"""
Phase 8D — Gemini Live native audio WebSocket endpoint.

/ws/live/{session_id}  — Gemini Live session (persistent, native audio output)
/ws/voice/{session_id} — Journey TTS pipeline (existing, kept as fallback)

Protocol (same as /ws/voice/ so frontend needs no protocol changes):
  Client → Server:
    {type: "text_input",  text: "..."}
    {type: "transcript",  text: "..."}

  Server → Client:
    {type: "audio_chunk", turn_id: 1, seq: 0, audio: "<b64-wav>", mime: "audio/wav", duration_ms: 300}
    {type: "audio_done",  turn_id: 1}
    {type: "status",      state: "...", label: "..."}
    {type: "debug",       log: "..."}
    {type: "error",       message: "..."}

If Gemini Live is unavailable, the error event tells the client to fall back to /ws/voice/.
"""
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.exceptions import GeminiNotConfiguredError, SessionNotFoundError
from app.services.live_voice_service import live_voice_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/live/{session_id}")
async def live_voice_websocket(websocket: WebSocket, session_id: str):
    """
    Gemini Live native audio session.
    Persistent session — model remembers conversation context across turns.
    First audio typically arrives in ~1-2s (vs ~5-7s for Journey TTS pipeline).
    """
    await websocket.accept()
    logger.info("Live WS connected — session: %s", session_id)
    try:
        await websocket.send_json({"type": "debug", "log": "[Live] websocket accepted"})
        await live_voice_service.handle_live_session(session_id, websocket)
    except SessionNotFoundError as exc:
        await websocket.send_json({"type": "error", "message": exc.message})
        await websocket.close(code=1008)
    except GeminiNotConfiguredError as exc:
        await websocket.send_json({"type": "error", "message": exc.message})
        await websocket.close(code=1011)
    except WebSocketDisconnect:
        logger.info("Live WS disconnected — session: %s", session_id)
    except Exception:
        logger.exception("Live WS unhandled error — session: %s", session_id)
        try:
            await websocket.send_json({
                "type": "error",
                "message": "Unexpected error in Live session. Reconnect to standard mode.",
            })
            await websocket.close(code=1011)
        except Exception:
            pass
