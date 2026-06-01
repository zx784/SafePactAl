"""
GeminiLiveClient — Phase 5 investigation result: DEFERRED.

Investigation (Phase 5):
  Model tested : gemini-2.5-flash-native-audio-latest
  API key      : Google AI Studio (no Google Cloud required for connection)
  SDK          : google-genai 2.7.0 — client.aio.live IS available

  Finding:
    The model accepts a WebSocket connection, but TEXT response modality is
    rejected with error 1007:
      "The requested combination of response modalities (TEXT) is not
       supported by the model. models/gemini-2.5-flash-native-audio"

    The Live API for this model is audio-only (PCM output).
    Consuming raw audio in the browser would require:
      - Binary WebSocket frames instead of JSON events
      - PCM audio decoding / Web Audio API playback in the browser
      - Significantly more complex client code

  Decision (Phase 5):
    DEFERRED. Browser speechSynthesis remains the MVP TTS path.
    PM approval required before any replacement of the speechSynthesis path.

  If re-investigated in the future:
    - Try gemini-2.5-flash-live-001 or a model that supports both TEXT and AUDIO
    - Try config={"response_modalities": ["AUDIO"]} and handle binary audio frames
    - Evaluate whether the complexity is justified at that time
"""
import logging

logger = logging.getLogger(__name__)


class GeminiLiveClient:
    """
    Stub for Gemini Live / native audio streaming.
    Status: DEFERRED — see module docstring for investigation findings.
    """

    def __init__(self, api_key: str, model: str):
        self._api_key = api_key
        self._model = model

    async def connect(self) -> None:
        raise NotImplementedError(
            "Gemini Live deferred. The native audio model rejects TEXT "
            "modality. Browser speechSynthesis is the approved MVP TTS path."
        )

    async def send_text(self, text: str) -> None:
        raise NotImplementedError("Gemini Live deferred.")

    async def receive_audio_chunks(self):
        raise NotImplementedError("Gemini Live deferred.")
        if False:
            yield b""

    async def close(self) -> None:
        raise NotImplementedError("Gemini Live deferred.")
