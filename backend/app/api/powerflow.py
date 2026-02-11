import io

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse

from ..logging_config import get_logger
from ..schemas.powerflow import (
    UploadResponse,
    PowerFlowRequest,
    PowerFlowResult,
    ErrorResponse,
    ExampleNetworkInfo,
    ExampleCategoryInfo,
    ExampleListResponse,
)
from ..core.powerflow_service import (
    PowerFlowService,
    create_session,
    get_session,
    update_session,
    delete_session,
)
from ..core.examples_service import get_cached_example_list, export_example_to_excel
from ..config import SUPPORTED_EXTENSIONS

logger = get_logger(__name__)
router = APIRouter(prefix="/powerflow", tags=["powerflow"])


@router.post(
    "/upload",
    response_model=UploadResponse,
    responses={400: {"model": ErrorResponse}},
    summary="Upload a network file",
    description="Upload a pandapower network file (JSON, Excel, Pickle, or SQLite format)",
)
async def upload_network(file: UploadFile = File(...)) -> UploadResponse:
    """Upload a pandapower network file and create a session."""
    if not file.filename:
        logger.warning("Upload request with no filename")
        raise HTTPException(status_code=400, detail="No filename provided")

    logger.info("Processing upload request", extra={"filename": file.filename})

    try:
        content = await file.read()
        service = PowerFlowService.load_network(content, file.filename)
        session_id = create_session(service)

        logger.info(
            "Upload successful",
            extra={"session_id": session_id, "filename": file.filename},
        )

        return UploadResponse(
            session_id=session_id,
            filename=file.filename,
            file_format=service.file_format,
            network_summary=service.get_network_summary(),
            message="Network loaded successfully",
        )
    except ValueError as e:
        logger.error(
            "Upload validation error",
            extra={"filename": file.filename, "error": str(e)},
        )
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(
            "Upload internal error",
            extra={"filename": file.filename, "error": str(e)},
            exc_info=True,
        )
        raise HTTPException(
            status_code=500, detail=f"Internal error while loading network: {str(e)}"
        )


@router.post(
    "/run/{session_id}",
    response_model=PowerFlowResult,
    responses={404: {"model": ErrorResponse}, 400: {"model": ErrorResponse}},
    summary="Run power flow calculation",
    description="Run power flow calculation on a previously uploaded network",
)
async def run_powerflow(
    session_id: str,
    request: PowerFlowRequest = PowerFlowRequest(),
) -> PowerFlowResult:
    """Run power flow calculation on the uploaded network."""
    service = get_session(session_id)
    if service is None:
        logger.warning("Session not found", extra={"session_id": session_id})
        raise HTTPException(status_code=404, detail="Session not found")

    logger.info(
        "Running power flow",
        extra={
            "session_id": session_id,
            "algorithm": request.algorithm,
            "max_iteration": request.max_iteration,
        },
    )

    result = service.run_powerflow(
        algorithm=request.algorithm,
        max_iteration=request.max_iteration,
        enforce_q_lims=request.enforce_q_lims,
        calculate_voltage_angles=request.calculate_voltage_angles,
        init=request.init,
        tolerance_mva=request.tolerance_mva,
    )

    # Save results to file storage (for multi-worker support)
    update_session(session_id, service)

    logger.info(
        "Power flow completed",
        extra={"session_id": session_id, "converged": result.converged},
    )

    return result


@router.get(
    "/results/{session_id}",
    response_model=PowerFlowResult,
    responses={404: {"model": ErrorResponse}},
    summary="Get cached results",
    description="Get cached power flow results for a session",
)
async def get_results(session_id: str) -> PowerFlowResult:
    """Get cached power flow results."""
    service = get_session(session_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Session not found")

    results = service.get_results()
    if results is None:
        raise HTTPException(
            status_code=404, detail="No results available. Run power flow first."
        )

    return results


@router.get(
    "/download/{session_id}",
    responses={
        200: {
            "content": {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}
            },
            "description": "Excel file with power flow results",
        },
        404: {"model": ErrorResponse},
    },
    summary="Download results as Excel",
    description="Download power flow results as an Excel file",
)
async def download_results(session_id: str):
    """Download power flow results as Excel file."""
    service = get_session(session_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        excel_bytes = service.export_results_to_excel()
        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=powerflow_results_{session_id[:8]}.xlsx"
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete(
    "/session/{session_id}",
    responses={404: {"model": ErrorResponse}},
    summary="Delete session",
    description="Clean up a session and free resources",
)
async def delete_session_endpoint(session_id: str) -> dict:
    """Delete a session."""
    if delete_session(session_id):
        return {"message": "Session deleted successfully"}
    raise HTTPException(status_code=404, detail="Session not found")


@router.get(
    "/formats",
    summary="Get supported file formats",
    description="Get list of supported file formats and extensions",
)
async def get_supported_formats() -> dict:
    """Get supported file formats."""
    return {
        "formats": {
            "json": {"extensions": [".json"], "description": "JSON format (recommended)"},
            "excel": {"extensions": [".xlsx", ".xls"], "description": "Excel spreadsheet"},
            "pickle": {"extensions": [".p", ".pkl", ".pickle"], "description": "Python pickle"},
            "sqlite": {"extensions": [".sqlite", ".db"], "description": "SQLite database"},
        },
        "all_extensions": SUPPORTED_EXTENSIONS,
    }


@router.get(
    "/examples",
    response_model=ExampleListResponse,
    summary="List example networks",
    description="Get list of available example pandapower networks",
)
def list_examples() -> ExampleListResponse:
    """List available example networks organized by category."""
    data = get_cached_example_list()
    categories = {}
    for cat_key, cat_info in data.items():
        categories[cat_key] = ExampleCategoryInfo(
            name_zh=cat_info["name_zh"],
            name_en=cat_info["name_en"],
            networks=[ExampleNetworkInfo(**net) for net in cat_info["networks"]],
        )
    return ExampleListResponse(categories=categories)


@router.get(
    "/examples/{case_name}/download",
    responses={
        200: {
            "content": {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}
            },
            "description": "Excel file with example network",
        },
        404: {"model": ErrorResponse},
    },
    summary="Download example network",
    description="Download an example pandapower network as Excel file",
)
def download_example(case_name: str):
    """Download an example network as Excel file."""
    try:
        excel_bytes = export_example_to_excel(case_name)
        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f'attachment; filename="{case_name}.xlsx"'
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
