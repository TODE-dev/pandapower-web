import io
import os
import pickle
import tempfile
import time
import warnings as py_warnings
from pathlib import Path
from typing import Optional
import uuid

import pandas as pd
import pandapower as pp
from pandapower import pandapowerNet

from ..logging_config import get_logger
from ..schemas.powerflow import (
    CalculationLog,
    NetworkSummary,
    PowerFlowResult,
    TableData,
)
from ..config import FILE_FORMATS, SUPPORTED_EXTENSIONS, SESSION_DIR

logger = get_logger(__name__)

# Algorithm-specific default iterations (matching pandapower's "auto" behavior)
# Source: pandapower/run.py documentation for max_iteration parameter
ALGORITHM_DEFAULT_ITERATIONS = {
    "nr": 10,       # Newton-Raphson: quadratic convergence
    "iwamoto_nr": 10,   # Iwamoto Newton-Raphson variant
    "bfsw": 100,    # Backward/Forward Sweep: for radial networks
    "gs": 1000,     # Gauss-Seidel: linear convergence, needs many iterations
    "fdbx": 30,     # Fast-Decoupled BX
    "fdxb": 30,     # Fast-Decoupled XB
}
DEFAULT_ITERATION_FALLBACK = 30  # Fallback for unknown algorithms


class PowerFlowService:
    """Service for handling pandapower network operations."""

    def __init__(self, network: pandapowerNet, filename: str, file_format: str):
        self.network = network
        self.filename = filename
        self.file_format = file_format
        self._results: Optional[PowerFlowResult] = None

    @classmethod
    def detect_format(cls, filename: str) -> Optional[str]:
        """Detect file format from filename extension."""
        ext = Path(filename).suffix.lower()
        for format_name, extensions in FILE_FORMATS.items():
            if ext in extensions:
                return format_name
        return None

    @classmethod
    def load_network(cls, content: bytes, filename: str) -> "PowerFlowService":
        """Load a pandapower network from file content.

        Args:
            content: File content as bytes
            filename: Original filename (used for format detection)

        Returns:
            PowerFlowService instance with loaded network

        Raises:
            ValueError: If file format is unsupported or network is invalid
        """
        file_format = cls.detect_format(filename)
        if file_format is None:
            supported = ", ".join(SUPPORTED_EXTENSIONS)
            logger.warning(
                "Unsupported file format",
                extra={"filename": filename, "supported": supported},
            )
            raise ValueError(
                f"Unsupported file format. Supported formats: {supported}"
            )

        logger.info(
            "Loading network file",
            extra={"filename": filename, "format": file_format},
        )

        # Create a temporary file to load the network
        ext = Path(filename).suffix.lower()
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp_file:
            tmp_file.write(content)
            tmp_path = tmp_file.name

        try:
            if file_format == "json":
                network = pp.from_json(tmp_path)
            elif file_format == "excel":
                network = pp.from_excel(tmp_path)
            elif file_format == "pickle":
                network = pp.from_pickle(tmp_path)
            elif file_format == "sqlite":
                network = pp.from_sqlite(tmp_path)
            else:
                raise ValueError(f"Unknown format: {file_format}")

            # Validate that we got a proper pandapower network
            if not isinstance(network, pandapowerNet):
                raise ValueError("File does not contain a valid pandapower network")

            # Basic validation - must have at least one bus
            if len(network.bus) == 0:
                logger.warning(
                    "Network has no buses",
                    extra={"filename": filename},
                )
                raise ValueError("Network must contain at least one bus")

            logger.info(
                "Network loaded successfully",
                extra={
                    "filename": filename,
                    "format": file_format,
                    "n_bus": len(network.bus),
                    "n_line": len(network.line),
                },
            )

            return cls(network, filename, file_format)

        except Exception as e:
            # Re-raise with more context if it's not already a ValueError
            if isinstance(e, ValueError):
                raise
            logger.error(
                "Failed to load network",
                extra={"filename": filename, "error": str(e)},
                exc_info=True,
            )
            raise ValueError(f"Failed to load network: {str(e)}") from e
        finally:
            # Clean up temporary file
            os.unlink(tmp_path)

    def get_network_summary(self) -> NetworkSummary:
        """Get summary of network components."""
        net = self.network
        return NetworkSummary(
            n_bus=len(net.bus),
            n_line=len(net.line),
            n_trafo=len(net.trafo),
            n_trafo3w=len(net.trafo3w) if "trafo3w" in net else 0,
            n_load=len(net.load),
            n_gen=len(net.gen),
            n_sgen=len(net.sgen) if "sgen" in net else 0,
            n_ext_grid=len(net.ext_grid),
            n_shunt=len(net.shunt) if "shunt" in net else 0,
            n_switch=len(net.switch) if "switch" in net else 0,
        )

    def run_powerflow(
        self,
        algorithm: str = "nr",
        max_iteration: Optional[int] = None,
        enforce_q_lims: bool = False,
        calculate_voltage_angles: bool = True,
        init: str = "auto",
        tolerance_mva: float = 1e-8,
    ) -> PowerFlowResult:
        """Run power flow calculation.

        Args:
            algorithm: Power flow algorithm
            max_iteration: Maximum number of iterations. If None, uses algorithm-specific default.
            enforce_q_lims: Enforce reactive power limits
            calculate_voltage_angles: Calculate voltage angles
            init: Initialization method
            tolerance_mva: Convergence tolerance in MVA

        Returns:
            PowerFlowResult with calculation results
        """
        # Resolve "auto" iteration count based on algorithm
        if max_iteration is None:
            resolved_max_iteration = ALGORITHM_DEFAULT_ITERATIONS.get(
                algorithm, DEFAULT_ITERATION_FALLBACK
            )
            logger.debug(
                "Using auto max_iteration",
                extra={"algorithm": algorithm, "resolved_max_iteration": resolved_max_iteration},
            )
        else:
            resolved_max_iteration = max_iteration

        logger.info(
            "Starting power flow calculation",
            extra={
                "algorithm": algorithm,
                "max_iteration": resolved_max_iteration,
                "max_iteration_auto": max_iteration is None,
                "enforce_q_lims": enforce_q_lims,
                "init": init,
            },
        )

        # Capture warnings during calculation
        captured_warnings: list[str] = []
        start_time = time.perf_counter()

        try:
            # Capture Python warnings during pandapower calculation
            with py_warnings.catch_warnings(record=True) as w:
                py_warnings.simplefilter("always")
                pp.runpp(
                    self.network,
                    algorithm=algorithm,
                    max_iteration=resolved_max_iteration,
                    enforce_q_lims=enforce_q_lims,
                    calculate_voltage_angles=calculate_voltage_angles,
                    init=init,
                    tolerance_mva=tolerance_mva,
                    numba=True,
                )
                # Collect any warnings that were raised
                for warning in w:
                    captured_warnings.append(str(warning.message))

            calc_time_ms = (time.perf_counter() - start_time) * 1000
            converged = self.network.converged

            # Extract iteration count from pandapower's internal data structure
            actual_iterations = None
            if hasattr(self.network, "_ppc") and self.network._ppc is not None:
                actual_iterations = self.network._ppc.get("iterations")

            # Extract slack bus power output
            # In pandapower, slack can be: ext_grid elements AND/OR generators with slack=True
            slack_p_mw = 0.0
            slack_q_mvar = 0.0
            has_slack = False

            if converged:
                # 1. Add power from external grids (always act as slack)
                if not self.network.res_ext_grid.empty:
                    if "p_mw" in self.network.res_ext_grid.columns:
                        slack_p_mw += float(self.network.res_ext_grid["p_mw"].sum())
                        has_slack = True
                    if "q_mvar" in self.network.res_ext_grid.columns:
                        slack_q_mvar += float(self.network.res_ext_grid["q_mvar"].sum())

                # 2. Add power from generators designated as slack (gen['slack'] == True)
                if not self.network.gen.empty and "slack" in self.network.gen.columns:
                    slack_gen_mask = self.network.gen["slack"] == True
                    if slack_gen_mask.any() and not self.network.res_gen.empty:
                        slack_gen_indices = self.network.gen[slack_gen_mask].index
                        if "p_mw" in self.network.res_gen.columns:
                            slack_p_mw += float(
                                self.network.res_gen.loc[
                                    self.network.res_gen.index.isin(slack_gen_indices), "p_mw"
                                ].sum()
                            )
                            has_slack = True
                        if "q_mvar" in self.network.res_gen.columns:
                            slack_q_mvar += float(
                                self.network.res_gen.loc[
                                    self.network.res_gen.index.isin(slack_gen_indices), "q_mvar"
                                ].sum()
                            )

            # Round values, set to None if no slack elements found
            slack_p_mw = round(slack_p_mw, 4) if has_slack else None
            slack_q_mvar = round(slack_q_mvar, 4) if has_slack else None

            # Create calculation log
            calc_log = CalculationLog(
                algorithm=algorithm,
                init_method=init,
                tolerance_mva=tolerance_mva,
                max_iteration=resolved_max_iteration,
                calculation_time_ms=round(calc_time_ms, 2),
                iterations=actual_iterations,
                warnings=captured_warnings,
                slack_p_mw=slack_p_mw,
                slack_q_mvar=slack_q_mvar,
            )

            if converged:
                self._results = self._extract_results()
                self._results.message = "Power flow converged successfully"
                self._results.calculation_log = calc_log
                logger.info(
                    "Power flow converged",
                    extra={
                        "converged": True,
                        "time_ms": calc_time_ms,
                        "min_vm_pu": self._results.min_vm_pu,
                        "max_vm_pu": self._results.max_vm_pu,
                        "max_loading_percent": self._results.max_loading_percent,
                    },
                )
            else:
                calc_log.warnings.append("Power flow did not converge")
                self._results = PowerFlowResult(
                    converged=False,
                    message="Power flow did not converge",
                    calculation_log=calc_log,
                )
                logger.warning(
                    "Power flow did not converge",
                    extra={
                        "converged": False,
                        "algorithm": algorithm,
                        "time_ms": calc_time_ms,
                    },
                )

        except Exception as e:
            calc_time_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Power flow calculation failed",
                extra={"error": str(e), "time_ms": calc_time_ms},
                exc_info=True,
            )
            self._results = PowerFlowResult(
                converged=False,
                message=f"Power flow calculation failed: {str(e)}",
                calculation_log=CalculationLog(
                    algorithm=algorithm,
                    init_method=init,
                    tolerance_mva=tolerance_mva,
                    max_iteration=resolved_max_iteration,
                    calculation_time_ms=round(calc_time_ms, 2),
                    warnings=[str(e)],
                ),
            )

        return self._results

    def _dataframe_to_table_data(
        self, df: pd.DataFrame, table_name: str, element_type: Optional[str] = None
    ) -> Optional[TableData]:
        """Convert a pandas DataFrame to TableData with device names.

        Args:
            df: Result DataFrame from pandapower
            table_name: Name of the result table (e.g., 'res_bus')
            element_type: Element type for name lookup (e.g., 'bus', 'line').
                          If None, auto-detected from table_name.
        """
        if df is None or df.empty:
            return None

        # Reset index to include it as a column
        df_reset = df.reset_index()
        df_reset.rename(columns={"index": "idx"}, inplace=True)

        # Inject device names as second column
        if element_type is None:
            element_type = table_name.replace("res_", "")  # 'res_bus' -> 'bus'

        if hasattr(self.network, element_type):
            element_table = getattr(self.network, element_type)
            if isinstance(element_table, pd.DataFrame) and "name" in element_table.columns:
                # Map index to name using element table's name column
                name_series = element_table["name"].reindex(df_reset["idx"])
                # Replace empty/NaN names with '-'
                device_names = name_series.apply(
                    lambda x: str(x).strip() if pd.notna(x) and str(x).strip() else "-"
                )
                # Insert name column at position 1 (after idx)
                df_reset.insert(1, "name", device_names.values)

        # Round numeric columns for display
        for col in df_reset.select_dtypes(include=["float64", "float32"]).columns:
            df_reset[col] = df_reset[col].round(4)

        # Convert to list of dictionaries
        data = df_reset.to_dict(orient="records")

        return TableData(
            columns=list(df_reset.columns),
            data=data,
            row_count=len(data),
        )

    def _extract_results(self) -> PowerFlowResult:
        """Extract results from network after power flow calculation."""
        net = self.network

        # Extract result tables
        res_bus = self._dataframe_to_table_data(net.res_bus, "res_bus")
        res_line = self._dataframe_to_table_data(net.res_line, "res_line")
        res_trafo = self._dataframe_to_table_data(net.res_trafo, "res_trafo")
        res_trafo3w = self._dataframe_to_table_data(
            net.res_trafo3w if hasattr(net, "res_trafo3w") else None, "res_trafo3w"
        )
        res_load = self._dataframe_to_table_data(net.res_load, "res_load")
        res_gen = self._dataframe_to_table_data(net.res_gen, "res_gen")
        res_sgen = self._dataframe_to_table_data(
            net.res_sgen if hasattr(net, "res_sgen") else None, "res_sgen"
        )
        res_ext_grid = self._dataframe_to_table_data(net.res_ext_grid, "res_ext_grid")
        res_shunt = self._dataframe_to_table_data(
            net.res_shunt if hasattr(net, "res_shunt") else None, "res_shunt"
        )

        # Calculate summary statistics
        max_loading = None
        if not net.res_line.empty and "loading_percent" in net.res_line.columns:
            max_loading = float(net.res_line["loading_percent"].max())
        if not net.res_trafo.empty and "loading_percent" in net.res_trafo.columns:
            trafo_max = float(net.res_trafo["loading_percent"].max())
            max_loading = max(max_loading or 0, trafo_max)

        min_vm = None
        max_vm = None
        if not net.res_bus.empty and "vm_pu" in net.res_bus.columns:
            min_vm = float(net.res_bus["vm_pu"].min())
            max_vm = float(net.res_bus["vm_pu"].max())

        return PowerFlowResult(
            converged=True,
            message="",
            res_bus=res_bus,
            res_line=res_line,
            res_trafo=res_trafo,
            res_trafo3w=res_trafo3w,
            res_load=res_load,
            res_gen=res_gen,
            res_sgen=res_sgen,
            res_ext_grid=res_ext_grid,
            res_shunt=res_shunt,
            max_loading_percent=max_loading,
            min_vm_pu=min_vm,
            max_vm_pu=max_vm,
        )

    def get_results(self) -> Optional[PowerFlowResult]:
        """Get cached power flow results."""
        return self._results

    def export_results_to_excel(self) -> bytes:
        """Export power flow results to Excel file.

        Returns:
            Excel file content as bytes
        """
        if self._results is None or not self._results.converged:
            raise ValueError("No converged results available to export")

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            # Write each result table to a separate sheet
            result_tables = [
                ("res_bus", self._results.res_bus),
                ("res_line", self._results.res_line),
                ("res_trafo", self._results.res_trafo),
                ("res_trafo3w", self._results.res_trafo3w),
                ("res_load", self._results.res_load),
                ("res_gen", self._results.res_gen),
                ("res_sgen", self._results.res_sgen),
                ("res_ext_grid", self._results.res_ext_grid),
                ("res_shunt", self._results.res_shunt),
            ]

            for sheet_name, table_data in result_tables:
                if table_data is not None and table_data.row_count > 0:
                    df = pd.DataFrame(table_data.data)
                    df.to_excel(writer, sheet_name=sheet_name, index=False)

            # Write summary sheet
            summary_data = {
                "Metric": [
                    "Converged",
                    "Max Loading (%)",
                    "Min Voltage (p.u.)",
                    "Max Voltage (p.u.)",
                ],
                "Value": [
                    "Yes" if self._results.converged else "No",
                    self._results.max_loading_percent or "N/A",
                    self._results.min_vm_pu or "N/A",
                    self._results.max_vm_pu or "N/A",
                ],
            }
            pd.DataFrame(summary_data).to_excel(
                writer, sheet_name="Summary", index=False
            )

        output.seek(0)
        return output.read()


# File-based session storage (for multi-worker support)
def _get_session_path(session_id: str) -> Path:
    """Get the file path for a session."""
    return SESSION_DIR / f"{session_id}.pkl"


def _ensure_session_dir() -> None:
    """Ensure the session directory exists."""
    SESSION_DIR.mkdir(parents=True, exist_ok=True)


def create_session(service: PowerFlowService) -> str:
    """Create a new session and store the service to file."""
    _ensure_session_dir()
    session_id = str(uuid.uuid4())
    session_path = _get_session_path(session_id)

    # Serialize the service state
    session_data = {
        "network": service.network,
        "filename": service.filename,
        "file_format": service.file_format,
        "results": service._results,
    }

    with open(session_path, "wb") as f:
        pickle.dump(session_data, f)

    logger.info(
        "Session created",
        extra={
            "session_id": session_id,
            "filename": service.filename,
            "session_path": str(session_path),
        },
    )
    return session_id


def get_session(session_id: str) -> Optional[PowerFlowService]:
    """Get a service by session ID from file storage."""
    session_path = _get_session_path(session_id)

    if not session_path.exists():
        logger.debug("Session file not found", extra={"session_id": session_id})
        return None

    try:
        with open(session_path, "rb") as f:
            session_data = pickle.load(f)

        # Reconstruct the service
        service = PowerFlowService(
            network=session_data["network"],
            filename=session_data["filename"],
            file_format=session_data["file_format"],
        )
        service._results = session_data.get("results")

        logger.debug(
            "Session loaded from file",
            extra={"session_id": session_id, "filename": service.filename},
        )
        return service

    except Exception as e:
        logger.error(
            "Failed to load session",
            extra={"session_id": session_id, "error": str(e)},
            exc_info=True,
        )
        return None


def update_session(session_id: str, service: PowerFlowService) -> bool:
    """Update an existing session in file storage."""
    session_path = _get_session_path(session_id)

    if not session_path.exists():
        logger.warning("Session not found for update", extra={"session_id": session_id})
        return False

    try:
        session_data = {
            "network": service.network,
            "filename": service.filename,
            "file_format": service.file_format,
            "results": service._results,
        }

        with open(session_path, "wb") as f:
            pickle.dump(session_data, f)

        logger.debug("Session updated", extra={"session_id": session_id})
        return True

    except Exception as e:
        logger.error(
            "Failed to update session",
            extra={"session_id": session_id, "error": str(e)},
            exc_info=True,
        )
        return False


def delete_session(session_id: str) -> bool:
    """Delete a session file."""
    session_path = _get_session_path(session_id)

    if session_path.exists():
        try:
            session_path.unlink()
            logger.info("Session deleted", extra={"session_id": session_id})
            return True
        except Exception as e:
            logger.error(
                "Failed to delete session",
                extra={"session_id": session_id, "error": str(e)},
            )
            return False

    logger.warning("Session not found for deletion", extra={"session_id": session_id})
    return False


def get_session_count() -> int:
    """Get the number of active session files."""
    _ensure_session_dir()
    return len(list(SESSION_DIR.glob("*.pkl")))
