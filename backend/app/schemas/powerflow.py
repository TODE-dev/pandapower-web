from typing import Optional
from pydantic import BaseModel, Field


class NetworkSummary(BaseModel):
    """Summary of network components."""

    n_bus: int = Field(description="Number of buses")
    n_line: int = Field(description="Number of lines")
    n_trafo: int = Field(description="Number of transformers")
    n_trafo3w: int = Field(default=0, description="Number of 3-winding transformers")
    n_load: int = Field(description="Number of loads")
    n_gen: int = Field(description="Number of generators")
    n_sgen: int = Field(default=0, description="Number of static generators")
    n_ext_grid: int = Field(description="Number of external grids")
    n_shunt: int = Field(default=0, description="Number of shunts")
    n_switch: int = Field(default=0, description="Number of switches")


class UploadResponse(BaseModel):
    """Response after uploading a network file."""

    session_id: str = Field(description="Session ID for subsequent requests")
    filename: str = Field(description="Original filename")
    file_format: str = Field(description="Detected file format")
    network_summary: NetworkSummary = Field(description="Network component summary")
    message: str = Field(default="Network loaded successfully")


class PowerFlowRequest(BaseModel):
    """Request parameters for power flow calculation."""

    algorithm: str = Field(
        default="nr",
        description="Power flow algorithm: 'nr' (Newton-Raphson), 'bfsw' (Backward/Forward Sweep), 'gs' (Gauss-Seidel), 'fdbx' (Fast-Decoupled BX), 'fdxb' (Fast-Decoupled XB)",
    )
    max_iteration: Optional[int] = Field(
        default=None,
        ge=1,
        le=10000,
        description="Maximum number of iterations. If None (auto), uses algorithm-specific defaults: nr=10, bfsw=100, gs=1000, fdbx=30, fdxb=30",
    )
    enforce_q_lims: bool = Field(
        default=False, description="Enforce reactive power limits of generators"
    )
    calculate_voltage_angles: bool = Field(
        default=True, description="Calculate voltage angles"
    )
    init: str = Field(
        default="auto",
        description="Initialization method: 'auto', 'flat', 'dc', 'results'",
    )
    tolerance_mva: float = Field(
        default=1e-8, gt=0, description="Convergence tolerance in MVA"
    )


class TableData(BaseModel):
    """Generic table data structure."""

    columns: list[str] = Field(description="Column names")
    data: list[dict] = Field(description="Row data as list of dictionaries")
    row_count: int = Field(description="Number of rows")


class CalculationLog(BaseModel):
    """Calculation diagnostic information."""

    algorithm: str = Field(description="Algorithm used for calculation")
    init_method: str = Field(description="Initialization method used")
    tolerance_mva: float = Field(description="Convergence tolerance in MVA")
    max_iteration: int = Field(description="Maximum iterations allowed (resolved from auto if applicable)")
    calculation_time_ms: Optional[float] = Field(
        default=None, description="Calculation time in milliseconds"
    )
    iterations: Optional[int] = Field(
        default=None, description="Actual number of iterations"
    )
    warnings: list[str] = Field(
        default_factory=list, description="Warnings from calculation"
    )
    slack_p_mw: Optional[float] = Field(
        default=None, description="Total active power output of slack bus(es) in MW"
    )
    slack_q_mvar: Optional[float] = Field(
        default=None, description="Total reactive power output of slack bus(es) in Mvar"
    )


class PowerFlowResult(BaseModel):
    """Results of power flow calculation."""

    converged: bool = Field(description="Whether the power flow converged")
    message: str = Field(description="Status message")
    iterations: Optional[int] = Field(default=None, description="Number of iterations")
    calculation_log: Optional[CalculationLog] = Field(
        default=None, description="Detailed calculation log"
    )

    # Result tables
    res_bus: Optional[TableData] = Field(default=None, description="Bus results")
    res_line: Optional[TableData] = Field(default=None, description="Line results")
    res_trafo: Optional[TableData] = Field(
        default=None, description="Transformer results"
    )
    res_trafo3w: Optional[TableData] = Field(
        default=None, description="3-winding transformer results"
    )
    res_load: Optional[TableData] = Field(default=None, description="Load results")
    res_gen: Optional[TableData] = Field(default=None, description="Generator results")
    res_sgen: Optional[TableData] = Field(
        default=None, description="Static generator results"
    )
    res_ext_grid: Optional[TableData] = Field(
        default=None, description="External grid results"
    )
    res_shunt: Optional[TableData] = Field(default=None, description="Shunt results")

    # Summary statistics
    max_loading_percent: Optional[float] = Field(
        default=None, description="Maximum loading percentage"
    )
    min_vm_pu: Optional[float] = Field(
        default=None, description="Minimum voltage magnitude in p.u."
    )
    max_vm_pu: Optional[float] = Field(
        default=None, description="Maximum voltage magnitude in p.u."
    )


class ErrorResponse(BaseModel):
    """Error response model."""

    detail: str = Field(description="Error message")
    error_type: str = Field(default="error", description="Type of error")


class ExampleNetworkInfo(BaseModel):
    """Info about an example network."""

    case_name: str = Field(description="Case identifier")
    display_name: str = Field(description="Display name")
    description_zh: str = Field(description="Chinese description")
    description_en: str = Field(description="English description")
    bus_count: int = Field(description="Number of buses")


class ExampleCategoryInfo(BaseModel):
    """Info about a category of example networks."""

    name_zh: str = Field(description="Chinese category name")
    name_en: str = Field(description="English category name")
    networks: list[ExampleNetworkInfo] = Field(description="Networks in this category")


class ExampleListResponse(BaseModel):
    """Response with categorized example networks."""

    categories: dict[str, ExampleCategoryInfo] = Field(
        description="Example networks organized by category"
    )
