"""
Phase 4 tests — SentenceBuffer, ConversationAgent, and WebSocket voice endpoint.

All Gemini calls are mocked — no real API quota used.
WebSocket tests use FastAPI TestClient's websocket_connect() context manager.
"""
import asyncio
import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

_AGENT_ROOT = Path(__file__).resolve().parent.parent.parent / "agent"
if str(_AGENT_ROOT) not in sys.path:
    sys.path.insert(0, str(_AGENT_ROOT))

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repositories.session_repository import session_repository
from app.schemas.session_schema import Session

client = TestClient(app)

# ── Shared fixtures ───────────────────────────────────────────────────────────

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
    ],
    "missing_information": [],
    "recommended_questions": [],
}


def _make_session(with_risks: bool = True) -> str:
    session = Session(
        risk_report=SAMPLE_RISK_REPORT if with_risks else None,
        contract_text="Sample contract." if with_risks else None,
    )
    session_repository.create(session)
    return session.session_id


def _collect_until(ws, stop_states=("idle", "draft_ready", "error"), max_msgs=30):
    """Receive WebSocket messages until a terminal state or max_msgs reached."""
    events = []
    for _ in range(max_msgs):
        msg = ws.receive_json()
        events.append(msg)
        if msg.get("type") == "status" and msg.get("state") in stop_states:
            break
        if msg.get("type") == "error":
            break
    return events


# ── SentenceBuffer unit tests ─────────────────────────────────────────────────

class TestSentenceBuffer:
    def _buf(self):
        from protectme_agent.streaming.sentence_buffer import SentenceBuffer
        return SentenceBuffer()

    def test_single_sentence_stays_buffered_until_flush(self):
        buf = self._buf()
        result = buf.add_token("Hello there.")
        assert result == []
        assert buf.flush() == ["Hello there."]

    def test_two_sentences_split_on_period_space(self):
        buf = self._buf()
        result = buf.add_token("Hello there. How are you?")
        assert result == ["Hello there."]
        assert buf.flush() == ["How are you?"]

    def test_question_mark_boundary(self):
        buf = self._buf()
        result = buf.add_token("Really? Yes!")
        assert result == ["Really?"]
        assert buf.flush() == ["Yes!"]

    def test_exclamation_boundary(self):
        buf = self._buf()
        result = buf.add_token("Amazing! That is great.")
        assert result == ["Amazing!"]

    def test_multi_token_accumulation(self):
        buf = self._buf()
        r1 = buf.add_token("Hello")
        assert r1 == []
        r2 = buf.add_token(". World.")
        assert r2 == ["Hello."]
        assert buf.flush() == ["World."]

    def test_flush_clears_buffer(self):
        buf = self._buf()
        buf.add_token("Partial text")
        buf.flush()
        assert buf.flush() == []

    def test_reset_clears_buffer(self):
        buf = self._buf()
        buf.add_token("Some text.")
        buf.reset()
        assert buf.flush() == []

    def test_empty_string_returns_empty(self):
        buf = self._buf()
        assert buf.add_token("") == []
        assert buf.flush() == []

    def test_three_sentences(self):
        buf = self._buf()
        result = buf.add_token("First. Second. Third.")
        assert result == ["First.", "Second."]
        assert buf.flush() == ["Third."]

    def test_arabic_punctuation_boundary(self):
        buf = self._buf()
        result = buf.add_token("هذا النص. وهذا النص الثاني.")
        assert len(result) >= 1


# ── ConversationAgent unit tests ──────────────────────────────────────────────

class TestConversationAgent:
    def _mock_client(self):
        mock = MagicMock()
        mock.conversation_model = "gemini-2.5-flash"
        mock.generate = AsyncMock(return_value="{}")
        return mock

    def _make_session_obj(self, with_risks=True, active_clause_id=None):
        return Session(
            risk_report=SAMPLE_RISK_REPORT if with_risks else None,
            active_clause_id=active_clause_id,
        )

    def test_unclear_intent_yields_clarification(self):
        from protectme_agent.conversation_agent import ConversationAgent
        from protectme_agent.schemas.intent_schema import Intent, IntentResult

        mock_client = self._mock_client()
        agent = ConversationAgent(mock_client)

        mock_router = MagicMock()
        mock_router.route = AsyncMock(
            return_value=IntentResult(
                intent=Intent.UNCLEAR,
                confidence=0.9,
                clarification_question="What would you like to do?",
            )
        )
        agent._router = mock_router

        session = self._make_session_obj()
        events = asyncio.run(self._collect(agent.handle_turn("uh", session)))

        types = [e["type"] for e in events]
        assert "sentence" in types
        assert "status" in types
        sentence_events = [e for e in events if e["type"] == "sentence"]
        assert any("?" in e["text"] for e in sentence_events)
        status_events = [e for e in events if e["type"] == "status"]
        assert status_events[-1]["state"] == "idle"

    def test_generate_message_intent_yields_draft_ready(self):
        from protectme_agent.conversation_agent import ConversationAgent
        from protectme_agent.schemas.intent_schema import Intent, IntentResult

        mock_client = self._mock_client()
        mock_client.generate = AsyncMock(return_value="Dear Landlord, I have concerns...")
        agent = ConversationAgent(mock_client)

        mock_router = MagicMock()
        mock_router.route = AsyncMock(
            return_value=IntentResult(
                intent=Intent.GENERATE_MESSAGE,
                confidence=0.95,
                target_clause_ids=["risk_001"],
                message_type="clarification",
                tone="polite",
                format="email",
            )
        )
        agent._router = mock_router

        session = self._make_session_obj()
        events = asyncio.run(self._collect(agent.handle_turn("Write me an email", session)))

        types = [e["type"] for e in events]
        assert "draft_ready" in types
        draft_event = next(e for e in events if e["type"] == "draft_ready")
        assert "draft" in draft_event
        assert len(draft_event["draft"]) > 0
        assert "risk_001" in draft_event["clause_ids"]

    def test_explain_clause_intent_yields_sentences(self):
        from protectme_agent.conversation_agent import ConversationAgent
        from protectme_agent.schemas.intent_schema import Intent, IntentResult

        mock_client = self._mock_client()
        mock_client.generate = AsyncMock(
            return_value=(
                "This means the lease renews automatically. "
                "You must give 90 days notice to cancel. "
                "This is not legal advice."
            )
        )
        agent = ConversationAgent(mock_client)

        mock_router = MagicMock()
        mock_router.route = AsyncMock(
            return_value=IntentResult(
                intent=Intent.EXPLAIN_CLAUSE,
                confidence=0.9,
                target_clause_ids=["risk_001"],
            )
        )
        agent._router = mock_router

        session = self._make_session_obj()
        events = asyncio.run(self._collect(agent.handle_turn("What does this mean?", session)))

        types = [e["type"] for e in events]
        assert "sentence" in types
        final_status = next(
            (e for e in reversed(events) if e["type"] == "status"), None
        )
        assert final_status is not None
        assert final_status["state"] == "idle"

    def test_generate_message_no_clause_asks_for_selection(self):
        from protectme_agent.conversation_agent import ConversationAgent
        from protectme_agent.schemas.intent_schema import Intent, IntentResult

        mock_client = self._mock_client()
        agent = ConversationAgent(mock_client)

        mock_router = MagicMock()
        mock_router.route = AsyncMock(
            return_value=IntentResult(
                intent=Intent.GENERATE_MESSAGE,
                confidence=0.85,
                target_clause_ids=[],  # No clause specified
            )
        )
        agent._router = mock_router

        session = self._make_session_obj()
        session = session.model_copy(update={"active_clause_id": None})
        events = asyncio.run(self._collect(agent.handle_turn("Write a message", session)))

        sentence_texts = [e["text"] for e in events if e["type"] == "sentence"]
        assert any("select" in t.lower() or "clause" in t.lower() for t in sentence_texts)

    def test_low_confidence_forces_clarification(self):
        from protectme_agent.conversation_agent import ConversationAgent
        from protectme_agent.schemas.intent_schema import Intent, IntentResult

        mock_client = self._mock_client()
        agent = ConversationAgent(mock_client)

        mock_router = MagicMock()
        mock_router.route = AsyncMock(
            return_value=IntentResult(
                intent=Intent.UNCLEAR,
                confidence=0.3,
                clarification_question="Could you be more specific?",
            )
        )
        agent._router = mock_router

        session = self._make_session_obj()
        events = asyncio.run(self._collect(agent.handle_turn("hmm", session)))

        assert any(e["type"] == "sentence" for e in events)
        assert any(
            e["type"] == "status" and e["state"] == "idle" for e in events
        )

    def test_active_clause_used_when_no_target_ids(self):
        from protectme_agent.conversation_agent import ConversationAgent
        from protectme_agent.schemas.intent_schema import Intent, IntentResult

        mock_client = self._mock_client()
        mock_client.generate = AsyncMock(return_value="Dear Landlord, I have concerns...")
        agent = ConversationAgent(mock_client)

        mock_router = MagicMock()
        mock_router.route = AsyncMock(
            return_value=IntentResult(
                intent=Intent.GENERATE_MESSAGE,
                confidence=0.9,
                target_clause_ids=[],  # Router found no clause IDs
                message_type="clarification",
                tone="professional",
                format="email",
            )
        )
        agent._router = mock_router

        # Session has active_clause_id set
        session = self._make_session_obj(active_clause_id="risk_001")
        events = asyncio.run(self._collect(agent.handle_turn("Write about this clause", session)))

        types = [e["type"] for e in events]
        assert "draft_ready" in types
        draft = next(e for e in events if e["type"] == "draft_ready")
        assert "risk_001" in draft["clause_ids"]

    async def _collect(self, agen):
        result = []
        async for event in agen:
            result.append(event)
        return result


# ── WebSocket endpoint tests ───────────────────────────────────────────────────

class TestVoiceWebSocket:
    def _make_agent_fixture(self, events: list):
        """Return an async generator function that yields the given events."""
        async def _handle_turn(user_text, session):
            for event in events:
                yield event
        return _handle_turn

    def _patch_voice(self, events: list):
        """Patch VoiceService so ConversationAgent yields `events` and TTS is skipped."""
        handle_turn_fn = self._make_agent_fixture(events)

        mock_agent = MagicMock()
        mock_agent.handle_turn = handle_turn_fn

        mock_agent_cls = MagicMock(return_value=mock_agent)

        # Patch TTS to return None so no audio_chunk events are sent during tests
        mock_tts = AsyncMock(return_value=None)

        return (
            patch("app.services.voice_service.ConversationAgent", mock_agent_cls),
            patch("app.services.voice_service._build_gemini_client"),
            patch("app.services.voice_service.synthesize_speech_fast", mock_tts),
        )

    def test_unknown_session_receives_error_and_close(self):
        with client.websocket_connect("/ws/voice/00000000-0000-0000-0000-000000000000") as ws:
            msg = ws.receive_json()
            assert msg["type"] == "error"
            assert "not found" in msg["message"].lower()

    def test_valid_session_receives_handshake(self):
        session_id = _make_session(with_risks=True)
        p1, p2, p3 = self._patch_voice([
            {"type": "status", "state": "idle", "label": "Ready"},
        ])
        with p1, p2, p3:
            with client.websocket_connect(f"/ws/voice/{session_id}") as ws:
                status_msg = ws.receive_json()
                assert status_msg["type"] == "status"
                assert status_msg["state"] == "idle"

                greeting_msg = ws.receive_json()
                assert greeting_msg["type"] == "sentence"
                assert len(greeting_msg["text"]) > 10

    def test_text_input_receives_sentence_events(self):
        session_id = _make_session(with_risks=True)
        agent_events = [
            {"type": "status", "state": "thinking", "label": "Thinking..."},
            {"type": "debug", "log": "[IntentRouter] intent=ask_question confidence=0.9"},
            {"type": "status", "state": "speaking", "label": "Speaking..."},
            {"type": "sentence", "text": "Your contract has several high-risk clauses."},
            {"type": "status", "state": "idle", "label": "Ready"},
        ]
        p1, p2, p3 = self._patch_voice(agent_events)
        with p1, p2, p3:
            with client.websocket_connect(f"/ws/voice/{session_id}") as ws:
                ws.receive_json()  # status: connected
                ws.receive_json()  # sentence: greeting

                ws.send_json({"type": "text_input", "text": "What are the main risks?"})
                events = _collect_until(ws)

        types = [e["type"] for e in events]
        assert "sentence" in types
        assert "status" in types
        sentence = next(e for e in events if e["type"] == "sentence")
        assert len(sentence["text"]) > 0

    def test_transcript_message_type_works(self):
        session_id = _make_session(with_risks=True)
        agent_events = [
            {"type": "sentence", "text": "Understood via transcript."},
            {"type": "status", "state": "idle", "label": "Ready"},
        ]
        p1, p2, p3 = self._patch_voice(agent_events)
        with p1, p2, p3:
            with client.websocket_connect(f"/ws/voice/{session_id}") as ws:
                ws.receive_json()  # status
                ws.receive_json()  # greeting

                ws.send_json({"type": "transcript", "text": "Explain the first clause"})
                events = _collect_until(ws)

        assert any(e["type"] == "sentence" for e in events)

    def test_unknown_message_type_returns_error(self):
        session_id = _make_session(with_risks=True)
        p1, p2, p3 = self._patch_voice([])
        with p1, p2, p3:
            with client.websocket_connect(f"/ws/voice/{session_id}") as ws:
                ws.receive_json()  # status
                ws.receive_json()  # greeting

                ws.send_json({"type": "bogus_type", "text": "hello"})
                # Skip any handshake noise (e.g. greeting_sent debug) and find the error.
                error_msg = ws.receive_json()
                for _ in range(5):
                    if error_msg.get("type") == "error":
                        break
                    error_msg = ws.receive_json()

        assert error_msg["type"] == "error"
        assert "bogus_type" in error_msg["message"]

    def test_generate_message_intent_returns_draft_ready(self):
        session_id = _make_session(with_risks=True)
        agent_events = [
            {"type": "status", "state": "thinking", "label": "Thinking..."},
            {"type": "status", "state": "tool_running", "label": "Writing..."},
            {
                "type": "tool_result",
                "tool": "generate_message",
                "result": {
                    "clause_ids": ["risk_001"],
                    "message_type": "clarification",
                    "tone": "polite",
                    "format": "email",
                },
            },
            {
                "type": "draft_ready",
                "draft": "Subject: Lease Query\n\nDear Landlord...",
                "clause_ids": ["risk_001"],
            },
            {"type": "status", "state": "draft_ready", "label": "Your draft is ready."},
        ]
        p1, p2, p3 = self._patch_voice(agent_events)
        with p1, p2, p3:
            with client.websocket_connect(f"/ws/voice/{session_id}") as ws:
                ws.receive_json()  # status
                ws.receive_json()  # greeting

                ws.send_json({
                    "type": "text_input",
                    "text": "Write me a polite email about the renewal clause",
                })
                events = _collect_until(ws, stop_states=("draft_ready", "idle", "error"))

        types = [e["type"] for e in events]
        assert "draft_ready" in types
        draft_event = next(e for e in events if e["type"] == "draft_ready")
        assert "draft" in draft_event
        assert len(draft_event["draft"]) > 0

    def test_draft_ready_stored_in_session(self):
        session_id = _make_session(with_risks=True)
        agent_events = [
            {
                "type": "tool_result",
                "tool": "generate_message",
                "result": {
                    "clause_ids": ["risk_001"],
                    "message_type": "clarification",
                    "tone": "polite",
                    "format": "email",
                },
            },
            {
                "type": "draft_ready",
                "draft": "Dear Landlord, I have questions about the renewal clause.",
                "clause_ids": ["risk_001"],
            },
            {"type": "status", "state": "draft_ready", "label": "Ready."},
        ]
        p1, p2, p3 = self._patch_voice(agent_events)
        with p1, p2, p3:
            with client.websocket_connect(f"/ws/voice/{session_id}") as ws:
                ws.receive_json()  # status
                ws.receive_json()  # greeting
                ws.send_json({"type": "text_input", "text": "Write a message"})
                _collect_until(ws, stop_states=("draft_ready", "idle", "error"))

        session_resp = client.get(f"/api/session/{session_id}")
        assert session_resp.status_code == 200
        data = session_resp.json()
        assert len(data["generated_messages"]) == 1
        assert data["generated_messages"][0]["clause_ids"] == ["risk_001"]

    def test_user_turn_stored_in_conversation_history(self):
        session_id = _make_session(with_risks=True)
        agent_events = [
            {"type": "sentence", "text": "Here is my answer."},
            {"type": "status", "state": "idle", "label": "Ready"},
        ]
        p1, p2, p3 = self._patch_voice(agent_events)
        with p1, p2, p3:
            with client.websocket_connect(f"/ws/voice/{session_id}") as ws:
                ws.receive_json()
                ws.receive_json()
                ws.send_json({"type": "text_input", "text": "What are the risks?"})
                _collect_until(ws)

        session_resp = client.get(f"/api/session/{session_id}")
        data = session_resp.json()
        history = data["conversation_history"]
        user_turns = [m for m in history if m["role"] == "user"]
        assert len(user_turns) >= 1
        assert user_turns[0]["content"] == "What are the risks?"

    def test_debug_events_forwarded_to_client(self):
        session_id = _make_session(with_risks=True)
        agent_events = [
            {"type": "debug", "log": "[IntentRouter] intent=explain_clause confidence=0.9"},
            {"type": "sentence", "text": "Here is the explanation."},
            {"type": "status", "state": "idle", "label": "Ready"},
        ]
        p1, p2, p3 = self._patch_voice(agent_events)
        with p1, p2, p3:
            with client.websocket_connect(f"/ws/voice/{session_id}") as ws:
                ws.receive_json()
                ws.receive_json()
                ws.send_json({"type": "text_input", "text": "Explain risk_001"})
                events = _collect_until(ws)

        debug_events = [e for e in events if e["type"] == "debug"]
        assert len(debug_events) >= 1
        # Phase 8C adds [TTS] timing debug events before the agent's [IntentRouter] event
        assert any("IntentRouter" in e["log"] for e in debug_events)

    def test_greeting_includes_risk_context(self):
        session_id = _make_session(with_risks=True)
        p1, p2, p3 = self._patch_voice([])
        with p1, p2, p3:
            with client.websocket_connect(f"/ws/voice/{session_id}") as ws:
                ws.receive_json()  # status
                greeting = ws.receive_json()

        assert greeting["type"] == "sentence"
        text = greeting["text"].lower()
        assert any(word in text for word in ("risk", "contract", "clause", "analyze"))

    def test_greeting_without_risk_report_uses_disclaimer_intro(self):
        session_id = _make_session(with_risks=False)
        p1, p2, p3 = self._patch_voice([])
        with p1, p2, p3:
            with client.websocket_connect(f"/ws/voice/{session_id}") as ws:
                ws.receive_json()  # status
                greeting = ws.receive_json()

        assert greeting["type"] == "sentence"
        assert len(greeting["text"]) > 10
