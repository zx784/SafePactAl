from pydantic import BaseModel
from app.schemas.risk_schema import RiskReport


class AnalyzeTextRequest(BaseModel):
    text: str


class AnalyzeResponse(BaseModel):
    session_id: str
    risk_report: RiskReport
