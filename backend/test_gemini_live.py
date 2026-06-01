"""
Phase 5 — Gemini Live API investigation.
Run from backend/ directory:
  python test_gemini_live.py

Determines whether Gemini Live is accessible with a plain AI Studio key
(no Google Cloud / IAM / billing required).

Outcome is documented in agent/protectme_agent/streaming/live_client.py.
"""
import asyncio
import sys
from pathlib import Path

_AGENT_ROOT = Path(__file__).resolve().parent.parent / "agent"
if str(_AGENT_ROOT) not in sys.path:
    sys.path.insert(0, str(_AGENT_ROOT))

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")
import os

API_KEY = os.getenv("GEMINI_API_KEY", "")
LIVE_MODEL = os.getenv("GEMINI_LIVE_MODEL", "gemini-2.5-flash-native-audio-latest")

print("Gemini Live API Investigation")
print(f"Model     : {LIVE_MODEL}")
print(f"API key   : {'set' if API_KEY else 'NOT SET'}")

if not API_KEY:
    print("SKIP — no API key")
    sys.exit(0)


async def investigate():
    from google import genai

    client = genai.Client(api_key=API_KEY)

    # ── Check 1: Is the live module present? ─────────────────────────────────
    has_live = hasattr(client.aio, "live")
    print(f"\nSDK has client.aio.live : {has_live}")
    if not has_live:
        print("RESULT: Gemini Live module not available in this SDK version.")
        return "not_available"

    # ── Check 2: Can we connect? ──────────────────────────────────────────────
    print(f"\nAttempting connection to {LIVE_MODEL} ...")
    try:
        async with client.aio.live.connect(
            model=LIVE_MODEL,
            config={"response_modalities": ["TEXT"]},
        ) as session:
            print("Connected. Sending test message ...")
            await session.send(input="Say 'hello' in one word.", end_of_turn=True)

            response_text = ""
            async for response in session.receive():
                if hasattr(response, "text") and response.text:
                    response_text += response.text
                if getattr(response, "server_content", None):
                    sc = response.server_content
                    if getattr(sc, "turn_complete", False):
                        break

            print(f"Live response received: {repr(response_text[:100])}")
            print("\nRESULT: Gemini Live is ACCESSIBLE with a plain AI Studio key.")
            return "accessible"

    except Exception as exc:
        error_type = type(exc).__name__
        error_msg = str(exc)
        print(f"Connection failed — {error_type}: {error_msg[:200]}")

        if any(kw in error_msg.lower() for kw in
               ("billing", "cloud", "iam", "permission", "quota", "vertex")):
            print("\nRESULT: Gemini Live requires Google Cloud / billing setup.")
            print("→ Recommendation: Keep browser speechSynthesis as MVP TTS path.")
            return "requires_cloud"
        else:
            print(f"\nRESULT: Connection failed ({error_type}).")
            print("→ Recommendation: Keep browser speechSynthesis as MVP TTS path.")
            return "failed"


if __name__ == "__main__":
    result = asyncio.run(investigate())
    sys.exit(0)
