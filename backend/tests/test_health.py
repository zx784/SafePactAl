"""Phase 1 smoke tests — health check and basic route existence."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_200():
    response = client.get("/health")
    assert response.status_code == 200


def test_health_response_shape():
    data = client.get("/health").json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "gemini_configured" in data
    assert "active_sessions" in data


def test_analyze_without_gemini_returns_error():
    """Expect 400 (no input) or 503 (not configured) — never a 500 traceback."""
    response = client.post("/api/contracts/analyze")
    assert response.status_code in (400, 422, 503)


def test_generate_message_without_body_returns_422():
    response = client.post("/api/actions/generate-message", json={})
    assert response.status_code == 422


def test_get_unknown_session_returns_404():
    response = client.get("/api/session/nonexistent-session-id")
    assert response.status_code == 404
