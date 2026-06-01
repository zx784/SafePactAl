import logging

from app.schemas.session_schema import Session
from app.services.session_service import session_service

logger = logging.getLogger(__name__)


async def handle_set_active_clause(
    session_id: str, active_clause_id: str
) -> dict:
    session_service.set_active_clause(session_id, active_clause_id)
    return {
        "status": "ok",
        "session_id": session_id,
        "active_clause_id": active_clause_id,
    }


async def handle_get_session(session_id: str) -> Session:
    return session_service.get_session(session_id)
