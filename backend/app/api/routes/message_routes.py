from fastapi import APIRouter

from app.api.handlers.message_handler import handle_generate_message
from app.schemas.message_schema import GenerateMessageRequest, GenerateMessageResponse

router = APIRouter()


@router.post(
    "/generate-message",
    response_model=GenerateMessageResponse,
    summary="Generate a message from selected risks",
    description=(
        "Generate a professional message (email or WhatsApp) targeting one or more "
        "identified contract risks. Supports clarification, negotiation, rejection, "
        "and amendment request types. Phase 3 implementation."
    ),
)
async def generate_message(request: GenerateMessageRequest):
    return await handle_generate_message(request)
