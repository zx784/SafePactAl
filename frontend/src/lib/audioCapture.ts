/**
 * Phase 8E — Browser microphone capture for Gemini Live audio-in.
 *
 * Captures raw PCM from the browser mic and streams it as 128ms base64-encoded
 * chunks. The backend forwards them to Gemini Live via send_realtime_input().
 *
 * Audio spec expected by Gemini Live:
 *   PCM 16-bit signed little-endian, 16 000 Hz, mono
 *
 * We create the AudioContext at 16 000 Hz (browser resamples from hardware rate).
 * If the browser refuses that rate, we downsample in JS before encoding.
 *
 * NOTE: Uses ScriptProcessorNode (deprecated) for broad browser compatibility.
 * Replace with AudioWorkletNode for production.
 */

const TARGET_SAMPLE_RATE = 16_000;
const SCRIPT_PROCESSOR_FRAMES = 2048; // 128 ms at 16 kHz

/** Resample Float32 buffer from inputRate → TARGET_SAMPLE_RATE using box filter. */
function resample(input: Float32Array, inputRate: number): Float32Array {
  if (inputRate === TARGET_SAMPLE_RATE) return input;
  const ratio = inputRate / TARGET_SAMPLE_RATE;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const lo = Math.floor(i * ratio);
    const hi = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    for (let j = lo; j < hi; j++) sum += input[j];
    out[i] = sum / (hi - lo);
  }
  return out;
}

/** Convert Float32 samples [-1, 1] to Int16 PCM bytes. */
function float32ToInt16(samples: Float32Array): Uint8Array {
  const int16 = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return new Uint8Array(int16.buffer);
}

/** Encode a Uint8Array as base64 string. */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Compute RMS of a Float32 buffer (0–1). */
function rms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

export interface AudioCaptureHandle {
  /** Stop capturing and release all resources. */
  stop(): void;
}

/**
 * Start mic capture and stream PCM chunks to the given WebSocket.
 *
 * @param ws         Open WebSocket — chunks are sent as JSON audio_input events.
 * @param onLevel    Called ~7 × /s with RMS level (0–1) for the level indicator.
 * @param onInfo     Optional — called once with a human-readable description of
 *                   the actual capture format (sample rate, resample status).
 *                   Used for the PM's audio-format verification requirement.
 * @returns          Handle with `.stop()` to end capture.
 */
export async function startAudioCapture(
  ws: WebSocket,
  onLevel: (level: number) => void,
  onInfo?: (info: string) => void,
  onChunkSent?: (count: number) => void,
): Promise<AudioCaptureHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl:  true,
    },
  });

  // Request 16 kHz context (browser resamples from hardware rate if needed)
  let audioCtx: AudioContext;
  try {
    audioCtx = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
  } catch {
    audioCtx = new AudioContext();
  }

  // Verify the actual rate the browser gave us. If it honored 16 kHz, no JS
  // resampling is needed. Otherwise we downsample each frame before encoding.
  const actualRate  = audioCtx.sampleRate;
  const honored16k  = actualRate === TARGET_SAMPLE_RATE;
  const trackLabel  = stream.getAudioTracks()[0]?.label ?? "unknown mic";
  onInfo?.(
    `AudioContext=${actualRate}Hz | honored 16kHz=${honored16k} | ` +
    `JS resample=${honored16k ? "no" : "yes"} | out=PCM 16kHz/16-bit/mono | mic="${trackLabel}"`,
  );

  const source    = audioCtx.createMediaStreamSource(stream);
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const processor = audioCtx.createScriptProcessor(SCRIPT_PROCESSOR_FRAMES, 1, 1);

  let chunksSent = 0;

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  processor.onaudioprocess = (e: AudioProcessingEvent) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    const raw    = e.inputBuffer.getChannelData(0);
    const actual = audioCtx.sampleRate;
    const pcmF32 = actual !== TARGET_SAMPLE_RATE ? resample(raw, actual) : raw;

    onLevel(rms(pcmF32));

    const bytes = float32ToInt16(pcmF32);
    ws.send(JSON.stringify({ type: "audio_input", audio: toBase64(bytes) }));
    chunksSent += 1;
    onChunkSent?.(chunksSent);
  };

  source.connect(processor);
  processor.connect(audioCtx.destination);

  return {
    stop() {
      processor.disconnect();
      source.disconnect();
      void audioCtx.close();
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}
