import logging
from typing import Optional

from fastapi import HTTPException, UploadFile

from app.schemas.contract_schema import AnalyzeResponse
from app.schemas.risk_schema import RiskReport
from app.services.contract_service import contract_service

logger = logging.getLogger(__name__)


async def handle_analyze_contract(
    file: Optional[UploadFile],
    text: Optional[str],
) -> AnalyzeResponse:
    """Validate input, call contract_service, return AnalyzeResponse."""
    if file is not None:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        filename = file.filename or "contract.pdf"
        if filename.lower().endswith(".txt"):
            try:
                text_content = content.decode("utf-8")
            except UnicodeDecodeError:
                text_content = content.decode("latin-1", errors="replace")
            session = await contract_service.analyze_from_text(text_content)
        else:
            session = await contract_service.analyze_from_pdf(content, filename)
    elif text and text.strip():
        session = await contract_service.analyze_from_text(text.strip())
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide either a PDF file (field: 'file') or contract text (field: 'text').",
        )

    # session.risk_report is a plain dict from model_dump(mode='json').
    # Reconstruct the typed RiskReport for the response schema.
    return AnalyzeResponse(
        session_id=session.session_id,
        risk_report=RiskReport(**session.risk_report),
    )
