from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile

from app.api.handlers.contract_handler import handle_analyze_contract
from app.schemas.contract_schema import AnalyzeResponse

router = APIRouter()


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    summary="Analyze a contract",
    description=(
        "Upload a contract as a PDF file or plain text. "
        "Returns a structured risk report and a session_id for subsequent requests. "
        "Phase 2 implementation."
    ),
)
async def analyze_contract(
    file: Optional[UploadFile] = File(None, description="Contract PDF"),
    text: Optional[str] = Form(None, description="Contract text (alternative to file)"),
):
    return await handle_analyze_contract(file, text)
