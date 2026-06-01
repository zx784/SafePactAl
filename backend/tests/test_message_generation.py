"""
Phase 3 tests — message generation, intent routing, active clause.

All tests mock Gemini calls — no real API quota used.
"""
import asyncio
import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

# Make the agent package importable in the test environment
# tests/ → backend/ → protectme-ai-agent/ → agent/
_AGENT_ROOT = Path(__file__).resolve().parent.parent.parent / "agent"
if str(_AGENT_ROOT) not in sys.path:
    sys.path.insert(0, str(_AGENT_ROOT))

from fastapi.testclient import TestClient

from app.main import app
from app.repositories.session_repository import session_repository
from app.schemas.session_schema import Session

client = TestClient(app)

# ── Sample risk report fixture ─────────────────────────────────────────────────

SAMPLE_RISK_REPORT = {
    "contract_type": "Rental Agreement",
    "overall_risk": "High",
    "final_recommendation": "Do Not Sign Yet",
    "summary": "Multiple unfair clauses.",
    "confidence": 0.95,
    "risks": [
        {
            "id": "risk_001",
            "title": "Automatic Lease Renewal",
            "severity": "High",
            "category": "Renewal",
            "clause_text": "The lease shall automatically renew unless 90 days notice is given.",
            "simple_explanation": "Lease renews automatically if you don't give 90 days notice.",
            "why_it_matters": "You could be locked in for another year without realising it.",
            "question_to_ask": "Can the notice period be reduced?",
            "suggested_action": "Negotiate",
        },
        {
            "id": "risk_002",
            "title": "High Daily Late Fee",
            "severity": "High",
            "category": "Fees",
            "clause_text": "A fee of 10% per day will be charged on late payments.",
            "simple_explanation": "10% daily fee on any late payment.",
            "why_it_matters": "This can add up very quickly.",
            "question_to_ask": "Can the late fee be capped or reduced?",
            "suggested_action": "Negotiate",
        },
        {
            "id": "risk_003",
            "title": "No Interest on Security Deposit",
            "severity": "Low",
            "category": "Deposit",
            "clause_text": "The security deposit will not earn interest.",
            "simple_explanation": "You earn no interest on your deposit.",
            "why_it_matters": "Minor financial loss over time.",
            "question_to_ask": "Is interest applicable?",
            "suggested_action": "Review carefully",
        },
    ],
    "missing_information": [],
    "recommended_questions": ["Can the notice period be shortened?"],
}


def _make_session_with_risks() -> str:
    """Create a fresh session with a risk report. Returns session_id."""
    session = Session(
        risk_report=SAMPLE_RISK_REPORT,
        contract_text="Sample contract text for testing.",
    )
    session_repository.create(session)
    return session.session_id


# ── Tool unit tests: GenerateMessageTool ──────────────────────────────────────

class TestGenerateMessageTool:
    def _mock_client(self, response_text: str):
        mock = MagicMock()
        mock.conversation_model = "gemini-2.5-flash"
        mock.generate = AsyncMock(return_value=response_text)
        return mock

    def test_returns_draft_string(self):
        from protectme_agent.tools.generate_message_tool import GenerateMessageTool

        tool = GenerateMessageTool()
        result = asyncio.run(
            tool.execute(
                clause_texts=["The lease automatically renews."],
                risk_titles=["Automatic Renewal: Lease renews without notice."],
                message_type="clarification",
                tone="polite",
                format="email",
                gemini_client=self._mock_client("Subject: Lease Query\n\nDear Landlord..."),
            )
        )
        assert isinstance(result, str)
        assert len(result) > 0

    def test_calls_gemini_once(self):
        from protectme_agent.tools.generate_message_tool import GenerateMessageTool

        mock_client = self._mock_client("Draft text.")
        tool = GenerateMessageTool()
        asyncio.run(
            tool.execute(
                clause_texts=["Clause text."],
                risk_titles=["Risk title."],
                message_type="negotiation",
                tone="firm",
                format="whatsapp",
                gemini_client=mock_client,
            )
        )
        mock_client.generate.assert_awaited_once()

    def test_empty_clause_texts_raises(self):
        from protectme_agent.tools.generate_message_tool import GenerateMessageTool

        tool = GenerateMessageTool()
        with pytest.raises(ValueError, match="No clause texts"):
            asyncio.run(
                tool.execute(
                    clause_texts=[],
                    risk_titles=[],
                    message_type="clarification",
                    tone="polite",
                    format="email",
                    gemini_client=self._mock_client(""),
                )
            )

    def test_no_client_raises(self):
        from protectme_agent.tools.generate_message_tool import GenerateMessageTool

        tool = GenerateMessageTool()
        with pytest.raises(ValueError, match="gemini_client"):
            asyncio.run(
                tool.execute(
                    clause_texts=["text"],
                    risk_titles=["title"],
                    message_type="clarification",
                    tone="polite",
                    format="email",
                    gemini_client=None,
                )
            )


# ── Tool unit tests: ExplainClauseTool ────────────────────────────────────────

class TestExplainClauseTool:
    def _mock_client(self, response_text: str):
        mock = MagicMock()
        mock.conversation_model = "gemini-2.5-flash"
        mock.generate = AsyncMock(return_value=response_text)
        return mock

    def test_returns_explanation(self):
        from protectme_agent.tools.explain_clause_tool import ExplainClauseTool

        tool = ExplainClauseTool()
        result = asyncio.run(
            tool.execute(
                clause_text="The lease automatically renews unless cancelled.",
                risk_context={"simple_explanation": "Lease renews automatically."},
                gemini_client=self._mock_client(
                    "This means your lease will keep going unless you cancel it. "
                    "This is not legal advice."
                ),
            )
        )
        assert isinstance(result, str)
        assert len(result) > 10

    def test_calls_gemini_once(self):
        from protectme_agent.tools.explain_clause_tool import ExplainClauseTool

        mock_client = self._mock_client("Explanation text.")
        tool = ExplainClauseTool()
        asyncio.run(
            tool.execute(
                clause_text="Some clause.",
                gemini_client=mock_client,
            )
        )
        mock_client.generate.assert_awaited_once()

    def test_empty_clause_raises(self):
        from protectme_agent.tools.explain_clause_tool import ExplainClauseTool

        tool = ExplainClauseTool()
        with pytest.raises(ValueError, match="clause_text"):
            asyncio.run(
                tool.execute(clause_text="", gemini_client=self._mock_client(""))
            )

    def test_no_client_raises(self):
        from protectme_agent.tools.explain_clause_tool import ExplainClauseTool

        tool = ExplainClauseTool()
        with pytest.raises(ValueError, match="gemini_client"):
            asyncio.run(
                tool.execute(clause_text="Some clause.", gemini_client=None)
            )


# ── Tool unit tests: GenerateQuestionsTool ────────────────────────────────────

class TestGenerateQuestionsTool:
    def _mock_client(self, response_text: str):
        mock = MagicMock()
        mock.conversation_model = "gemini-2.5-flash"
        mock.generate = AsyncMock(return_value=response_text)
        return mock

    def test_returns_list_from_risk_report(self):
        from protectme_agent.tools.generate_questions_tool import GenerateQuestionsTool

        tool = GenerateQuestionsTool()
        result = asyncio.run(
            tool.execute(
                risk_report=SAMPLE_RISK_REPORT,
                gemini_client=self._mock_client(
                    "1. Can the notice period be reduced?\n"
                    "2. What is the penalty for missing a payment?\n"
                    "3. Is deposit interest available?"
                ),
            )
        )
        assert isinstance(result, list)
        assert len(result) >= 1
        assert all(isinstance(q, str) for q in result)

    def test_returns_list_from_clause_texts(self):
        from protectme_agent.tools.generate_questions_tool import GenerateQuestionsTool

        tool = GenerateQuestionsTool()
        result = asyncio.run(
            tool.execute(
                clause_texts=["Automatic renewal clause text."],
                gemini_client=self._mock_client(
                    "1. Can the renewal be opt-in?\n2. What is the penalty for breaking this?"
                ),
            )
        )
        assert isinstance(result, list)
        assert len(result) >= 1

    def test_no_input_raises(self):
        from protectme_agent.tools.generate_questions_tool import GenerateQuestionsTool

        tool = GenerateQuestionsTool()
        with pytest.raises(ValueError, match="risk_report or clause_texts"):
            asyncio.run(tool.execute(gemini_client=self._mock_client("")))

    def test_no_client_raises(self):
        from protectme_agent.tools.generate_questions_tool import GenerateQuestionsTool

        tool = GenerateQuestionsTool()
        with pytest.raises(ValueError, match="gemini_client"):
            asyncio.run(tool.execute(risk_report=SAMPLE_RISK_REPORT, gemini_client=None))


# ── IntentRouter unit tests ────────────────────────────────────────────────────

class TestIntentRouter:
    def _make_router(self, gemini_json: dict):
        from protectme_agent.intent_router import IntentRouter

        mock_client = MagicMock()
        mock_client.conversation_model = "gemini-2.5-flash"
        mock_client.generate = AsyncMock(return_value=json.dumps(gemini_json))
        return IntentRouter(mock_client)

    def test_generate_message_intent_high_confidence(self):
        router = self._make_router({
            "intent": "generate_message",
            "confidence": 0.95,
            "target_clause_ids": ["risk_001"],
            "message_type": "clarification",
            "tone": "polite",
            "format": "email",
        })
        result = asyncio.run(router.route("Write me an email about the renewal clause."))
        assert result.intent.value == "generate_message"
        assert result.confidence >= 0.9
        assert not result.needs_clarification

    def test_explain_clause_intent(self):
        router = self._make_router({
            "intent": "explain_clause",
            "confidence": 0.88,
            "target_clause_ids": ["risk_002"],
            "message_type": None,
            "tone": None,
            "format": None,
        })
        result = asyncio.run(router.route("What does the late fee clause mean?"))
        assert result.intent.value == "explain_clause"
        assert not result.needs_clarification

    def test_low_confidence_forces_unclear(self):
        router = self._make_router({
            "intent": "ask_question",
            "confidence": 0.45,
            "target_clause_ids": [],
            "message_type": None,
            "tone": None,
            "format": None,
        })
        result = asyncio.run(router.route("uh, I dunno"))
        assert result.needs_clarification
        assert result.clarification_question is not None
        assert len(result.clarification_question) > 10

    def test_explicit_unclear_intent_adds_clarification(self):
        router = self._make_router({
            "intent": "unclear",
            "confidence": 0.9,
            "target_clause_ids": [],
            "message_type": None,
            "tone": None,
            "format": None,
        })
        result = asyncio.run(router.route("hello"))
        assert result.needs_clarification
        assert result.clarification_question is not None

    def test_parse_failure_returns_unclear(self):
        from protectme_agent.intent_router import IntentRouter

        mock_client = MagicMock()
        mock_client.conversation_model = "gemini-2.5-flash"
        mock_client.generate = AsyncMock(return_value="not valid json at all")
        router = IntentRouter(mock_client)
        result = asyncio.run(router.route("some ambiguous input"))
        assert result.needs_clarification
        assert result.intent.value == "unclear"

    def test_active_clause_context_passed(self):
        from protectme_agent.intent_router import IntentRouter

        mock_client = MagicMock()
        mock_client.conversation_model = "gemini-2.5-flash"
        mock_client.generate = AsyncMock(
            return_value=json.dumps({
                "intent": "explain_clause",
                "confidence": 0.9,
                "target_clause_ids": ["risk_001"],
                "message_type": None,
                "tone": None,
                "format": None,
            })
        )
        router = IntentRouter(mock_client)
        result = asyncio.run(
            router.route("Explain this clause.", active_clause_id="risk_001")
        )
        # Verify Gemini was called (with active clause context injected into prompt)
        mock_client.generate.assert_awaited_once()
        assert result.intent.value == "explain_clause"


# ── POST /api/actions/generate-message endpoint tests ─────────────────────────

class TestGenerateMessageEndpoint:
    def _patch_client(self, draft_text: str):
        """Context manager: patches _build_gemini_client to return a mock."""
        mock_client = MagicMock()
        mock_client.conversation_model = "gemini-2.5-flash"
        mock_client.generate = AsyncMock(return_value=draft_text)
        return patch(
            "app.services.message_service._build_gemini_client",
            return_value=mock_client,
        )

    def test_email_clarification_returns_200(self):
        session_id = _make_session_with_risks()
        with self._patch_client("Subject: Inquiry\n\nDear Landlord, I have concerns..."):
            response = client.post(
                "/api/actions/generate-message",
                json={
                    "session_id": session_id,
                    "clause_ids": ["risk_001"],
                    "message_type": "clarification",
                    "tone": "polite",
                    "format": "email",
                },
            )
        assert response.status_code == 200
        body = response.json()
        assert "draft" in body
        assert len(body["draft"]) > 0
        assert body["session_id"] == session_id
        assert body["clause_ids"] == ["risk_001"]
        assert body["message_type"] == "clarification"
        assert body["tone"] == "polite"
        assert body["format"] == "email"

    def test_whatsapp_negotiation_returns_200(self):
        session_id = _make_session_with_risks()
        with self._patch_client("Hi, about the late fee clause — can we discuss?"):
            response = client.post(
                "/api/actions/generate-message",
                json={
                    "session_id": session_id,
                    "clause_ids": ["risk_002"],
                    "message_type": "negotiation",
                    "tone": "firm",
                    "format": "whatsapp",
                },
            )
        assert response.status_code == 200
        assert response.json()["format"] == "whatsapp"
        assert response.json()["tone"] == "firm"

    def test_email_rejection_firm_tone(self):
        session_id = _make_session_with_risks()
        with self._patch_client("I cannot accept these terms as written."):
            response = client.post(
                "/api/actions/generate-message",
                json={
                    "session_id": session_id,
                    "clause_ids": ["risk_001"],
                    "message_type": "rejection",
                    "tone": "firm",
                    "format": "email",
                },
            )
        assert response.status_code == 200
        assert response.json()["message_type"] == "rejection"

    def test_amendment_request_professional_tone(self):
        session_id = _make_session_with_risks()
        with self._patch_client("Dear Landlord, I propose the following amendment..."):
            response = client.post(
                "/api/actions/generate-message",
                json={
                    "session_id": session_id,
                    "clause_ids": ["risk_001"],
                    "message_type": "amendment_request",
                    "tone": "professional",
                    "format": "email",
                },
            )
        assert response.status_code == 200
        assert response.json()["message_type"] == "amendment_request"

    def test_multiple_clause_ids(self):
        session_id = _make_session_with_risks()
        with self._patch_client("I have concerns about two clauses..."):
            response = client.post(
                "/api/actions/generate-message",
                json={
                    "session_id": session_id,
                    "clause_ids": ["risk_001", "risk_002"],
                    "message_type": "clarification",
                    "tone": "professional",
                    "format": "email",
                },
            )
        assert response.status_code == 200
        assert response.json()["clause_ids"] == ["risk_001", "risk_002"]

    def test_clause_id_not_found_returns_404(self):
        session_id = _make_session_with_risks()
        response = client.post(
            "/api/actions/generate-message",
            json={
                "session_id": session_id,
                "clause_ids": ["risk_999"],
                "message_type": "clarification",
                "tone": "polite",
                "format": "email",
            },
        )
        assert response.status_code == 404
        assert "risk_999" in response.json()["error"]

    def test_no_risk_report_returns_409(self):
        empty_session = Session()
        session_repository.create(empty_session)
        response = client.post(
            "/api/actions/generate-message",
            json={
                "session_id": empty_session.session_id,
                "clause_ids": ["risk_001"],
                "message_type": "clarification",
                "tone": "polite",
                "format": "email",
            },
        )
        assert response.status_code == 409
        assert "risk report" in response.json()["error"].lower()

    def test_unknown_session_returns_404(self):
        response = client.post(
            "/api/actions/generate-message",
            json={
                "session_id": "00000000-0000-0000-0000-000000000000",
                "clause_ids": ["risk_001"],
                "message_type": "clarification",
                "tone": "polite",
                "format": "email",
            },
        )
        assert response.status_code == 404

    def test_generated_message_stored_in_session(self):
        session_id = _make_session_with_risks()
        with self._patch_client("Subject: Test\n\nDear Landlord..."):
            client.post(
                "/api/actions/generate-message",
                json={
                    "session_id": session_id,
                    "clause_ids": ["risk_001"],
                    "message_type": "clarification",
                    "tone": "polite",
                    "format": "email",
                },
            )

        session_resp = client.get(f"/api/session/{session_id}")
        assert session_resp.status_code == 200
        data = session_resp.json()
        assert len(data["generated_messages"]) == 1
        gm = data["generated_messages"][0]
        assert gm["clause_ids"] == ["risk_001"]
        assert gm["message_type"] == "clarification"
        assert gm["tone"] == "polite"
        assert gm["format"] == "email"
        assert len(gm["draft"]) > 0

    def test_multiple_messages_accumulate_in_session(self):
        session_id = _make_session_with_risks()
        with self._patch_client("First draft."):
            client.post(
                "/api/actions/generate-message",
                json={
                    "session_id": session_id,
                    "clause_ids": ["risk_001"],
                    "message_type": "clarification",
                    "tone": "polite",
                    "format": "email",
                },
            )
        with self._patch_client("Second draft."):
            client.post(
                "/api/actions/generate-message",
                json={
                    "session_id": session_id,
                    "clause_ids": ["risk_002"],
                    "message_type": "negotiation",
                    "tone": "firm",
                    "format": "whatsapp",
                },
            )

        session_resp = client.get(f"/api/session/{session_id}")
        assert len(session_resp.json()["generated_messages"]) == 2


# ── POST /api/session/active-clause tests ─────────────────────────────────────

class TestSetActiveClause:
    def test_set_active_clause_returns_200(self):
        session_id = _make_session_with_risks()
        response = client.post(
            "/api/session/active-clause",
            json={"session_id": session_id, "active_clause_id": "risk_001"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["active_clause_id"] == "risk_001"
        assert body["session_id"] == session_id
        assert body["status"] == "ok"

    def test_active_clause_persists_in_session(self):
        session_id = _make_session_with_risks()
        client.post(
            "/api/session/active-clause",
            json={"session_id": session_id, "active_clause_id": "risk_002"},
        )
        session_resp = client.get(f"/api/session/{session_id}")
        assert session_resp.status_code == 200
        assert session_resp.json()["active_clause_id"] == "risk_002"

    def test_active_clause_can_be_updated(self):
        session_id = _make_session_with_risks()
        client.post(
            "/api/session/active-clause",
            json={"session_id": session_id, "active_clause_id": "risk_001"},
        )
        client.post(
            "/api/session/active-clause",
            json={"session_id": session_id, "active_clause_id": "risk_003"},
        )
        session_resp = client.get(f"/api/session/{session_id}")
        assert session_resp.json()["active_clause_id"] == "risk_003"

    def test_set_active_clause_unknown_session_returns_404(self):
        response = client.post(
            "/api/session/active-clause",
            json={
                "session_id": "00000000-0000-0000-0000-000000000000",
                "active_clause_id": "risk_001",
            },
        )
        assert response.status_code == 404


# ── pytest import (must be at module level for class-based tests) ──────────────
import pytest
