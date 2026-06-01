import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


# ── Base ──────────────────────────────────────────────────────────────────────

class ProtectMeException(Exception):
    """Base exception for all ProtectMe AI errors."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


# ── Session ───────────────────────────────────────────────────────────────────

class SessionNotFoundError(ProtectMeException):
    def __init__(self, session_id: str):
        super().__init__(f"Session not found: {session_id}", status_code=404)


# ── Gemini / configuration ────────────────────────────────────────────────────

class GeminiNotConfiguredError(ProtectMeException):
    def __init__(self):
        super().__init__(
            "Gemini API is not configured. Set GEMINI_API_KEY, "
            "GEMINI_ANALYSIS_MODEL, and GEMINI_CONVERSATION_MODEL in backend/.env.",
            status_code=503,
        )


# ── Contract ──────────────────────────────────────────────────────────────────

class InvalidContractError(ProtectMeException):
    def __init__(self, detail: str):
        super().__init__(f"Invalid contract input: {detail}", status_code=400)


class ContractAnalysisError(ProtectMeException):
    def __init__(self, detail: str):
        super().__init__(f"Contract analysis failed: {detail}", status_code=500)


# ── Message generation ────────────────────────────────────────────────────────

class MessageGenerationError(ProtectMeException):
    def __init__(self, detail: str):
        super().__init__(f"Message generation failed: {detail}", status_code=500)


class ClauseNotFoundError(ProtectMeException):
    def __init__(self, clause_ids: list):
        ids = ", ".join(clause_ids)
        super().__init__(
            f"Clause ID {ids} was not found in the current risk report.",
            status_code=404,
        )


class NoRiskReportError(ProtectMeException):
    def __init__(self):
        super().__init__(
            "This session does not have a risk report yet. Analyze a contract first.",
            status_code=409,
        )


# ── Exception handler registration ───────────────────────────────────────────

def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ProtectMeException)
    async def protectme_handler(request: Request, exc: ProtectMeException):
        logger.error("[%s] %s", type(exc).__name__, exc.message)
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message, "type": type(exc).__name__},
        )

    @app.exception_handler(HTTPException)
    async def http_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail},
        )

    @app.exception_handler(Exception)
    async def generic_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception on %s %s", request.method, request.url)
        return JSONResponse(
            status_code=500,
            content={"error": "An unexpected error occurred. Please try again."},
        )
