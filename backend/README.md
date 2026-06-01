# ProtectMe AI — Backend

FastAPI backend: REST API + WebSocket voice agent server.

## Setup

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env — add your Gemini API key and model names

# Find available model IDs for your key:
python -m app.utils.model_check

# Start the server:
uvicorn app.main:app --reload
```

- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Run tests

```bash
cd backend
pytest tests/ -v
```

## Architecture

```
app/
├── main.py              ← FastAPI app, CORS, lifespan, health check
├── core/
│   ├── config.py        ← All settings from environment variables
│   ├── logging.py       ← Logging setup
│   └── exceptions.py    ← Custom exceptions + FastAPI handlers
├── api/
│   ├── routes/          ← FastAPI routers (no business logic)
│   └── handlers/        ← Request/response shaping, calls services
├── schemas/             ← Pydantic models (request/response/session)
├── services/            ← Business logic layer
├── repositories/        ← In-memory session store (MVP)
└── utils/               ← PDF extraction, JSON parsing, text helpers
```

## Environment variables

See `.env.example` for the full list.

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google AI Studio key |
| `GEMINI_ANALYSIS_MODEL` | Yes | Pro-level model for contract analysis |
| `GEMINI_CONVERSATION_MODEL` | Yes | Flash model for voice/intent |
| `GEMINI_LIVE_MODEL` | No | Phase 5 investigation |
| `FRONTEND_URL` | No | CORS origin (default: http://localhost:3000) |
