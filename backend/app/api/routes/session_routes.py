from fastapi import APIRouter
from pydantic import BaseModel

from app.api.handlers.session_handler import handle_get_session, handle_set_active_clause
from app.schemas.session_schema import Session

router = APIRouter()


class SetActiveClauseRequest(BaseModel):
    session_id: str
    active_clause_id: str


@router.post(
    "/active-clause",
    summary="Set the active (focused) risk clause",
    description=(
        "Tell the session which risk clause is currently in focus. "
        "The voice agent uses this to resolve references like 'this clause'."
    ),
)
async def set_active_clause(request: SetActiveClauseRequest):
    return await handle_set_active_clause(request.session_id, request.active_clause_id)


@router.get(
    "/{session_id}",
    response_model=Session,
    summary="Get full session state",
    description="Retrieve the complete session including risk report and conversation history.",
)
async def get_session(session_id: str):
    return await handle_get_session(session_id)
