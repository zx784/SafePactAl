/* ProtectMe AI — Voice Agent panel (animated circle, transcript, states) */
const VOICE_STATES = {
  idle:      { color: "var(--voice-idle)",      icon: "mic",          label: "Tap to talk",        live: false },
  listening: { color: "var(--voice-listening)", icon: "mic",          label: "Listening…",          live: true },
  thinking:  { color: "var(--voice-thinking)",  icon: "sparkles",     label: "Thinking…",           live: false },
  tool:      { color: "var(--voice-tool)",      icon: "wrench",       label: "Checking the clause…", live: false },
  speaking:  { color: "var(--voice-speaking)",  icon: "audio-lines",  label: "Speaking",            live: true },
  draft:     { color: "var(--voice-draft)",     icon: "file-check",   label: "Draft ready",         live: false },
  ended:     { color: "var(--voice-ended)",     icon: "phone-off",    label: "Call ended",          live: false },
  error:     { color: "var(--voice-error)",     icon: "alert-octagon",label: "Connection error",    live: false },
};

/* The signature animated voice circle */
function VoiceCircle({ state }) {
  const s = VOICE_STATES[state];
  return (
    <div className={`vcircle vcircle-${state}`}>
      {s.live && <><span className="vring" /><span className="vring" /><span className="vring" /></>}
      <div className="vcore" style={{ "--vc": s.color }}>
        <Icon name={s.icon} size={30} color="#fff" />
      </div>
    </div>
  );
}

function VoicePanel({ contextRisk, onClose, onLog, printMode }) {
  const [state, setState] = useState(printMode ? "speaking" : "idle");
  const [muted, setMuted] = useState(false);
  const [turns, setTurns] = useState(printMode ? [
    { role: "user", text: `Can you explain ${contextRisk ? contextRisk.title.toLowerCase() : "the renewal clause"} in simple terms?` },
    { role: "agent", text: contextRisk ? contextRisk.explanation : "This clause lets the lease renew on its own, and the rent can go up each time." },
    { role: "agent", text: "Would you like me to draft a message asking about it?" },
  ] : []);
  const [tool, setTool] = useState(printMode ? { name: "clause.lookup", status: "done", result: contextRisk ? contextRisk.section : "\u00a77.2" } : null);
  const bodyRef = useRef(null);
  const timers = useRef([]);

  const push = (role, text) => setTurns(t => [...t, { role, text }]);
  const after = (ms, fn) => { const id = setTimeout(fn, ms); timers.current.push(id); };

  // Scripted demo call
  useEffect(() => {
    if (printMode) return;
    const topic = contextRisk ? contextRisk.title.toLowerCase() : "the renewal clause";
    after(400, () => setState("listening"));
    after(1500, () => { push("user", `Can you explain ${topic} in simple terms?`); setState("thinking"); onLog && onLog("agent", `understanding question about ${topic}`); });
    after(2700, () => { setState("tool"); setTool({ name: "clause.lookup", status: "running" }); onLog && onLog("tool", `clause.lookup("${topic}")`); });
    after(4200, () => { setTool({ name: "clause.lookup", status: "done", result: contextRisk ? contextRisk.section : "§7.2" }); onLog && onLog("tool", "clause.lookup → match found"); });
    after(4700, () => { setState("speaking"); push("agent", contextRisk ? contextRisk.explanation : "This clause lets the lease renew on its own, and the rent can go up each time."); });
    after(8200, () => { setState("speaking"); push("agent", "Would you like me to draft a message asking about it?"); });
    after(11000, () => { setState("draft"); onLog && onLog("agent", "draft.ready ✓"); });
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, [contextRisk]);

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [turns, tool]);

  const s = VOICE_STATES[state];

  return (
    <aside className="panel voicepanel" role="dialog" aria-label="Voice agent">
      <div className="panel-head dark">
        <div className="panel-head-title">
          <div className="panel-ic" style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}><Icon name="headphones" size={17} /></div>
          <div>
            <h3 style={{ color: "#fff" }}>Your agent</h3>
            <p style={{ color: "var(--text-on-dark-2)" }} aria-live="polite">{s.label}</p>
          </div>
        </div>
        <IconButton icon="x" label="Minimize" className="on-dark-icon" onClick={onClose} />
      </div>

      {/* Stage */}
      <div className="voice-stage">
        <VoiceCircle state={state} />
        <div className="voice-status" aria-live="polite">
          <VoiceDot color={s.color.replace("var(", "").replace(")", "") ? s.color : s.color} live={s.live} />
          <span style={{ color: s.color }}>{s.label}</span>
        </div>
        {tool && (
          <div className={`tool-out ${tool.status}`}>
            <Icon name={tool.status === "running" ? "loader" : "check-circle"} size={14} />
            <span><code>{tool.name}</code>{tool.result ? ` → ${tool.result}` : "…"}</span>
          </div>
        )}
      </div>

      {/* Transcript */}
      <div className="transcript scroll" ref={bodyRef} aria-live="polite" aria-label="Conversation transcript">
        {turns.map((t, i) => (
          <div key={i} className={`bubble bubble-${t.role}`}>
            <span className="bubble-who">{t.role === "user" ? "You" : "Agent"}</span>
            <p>{t.text}</p>
          </div>
        ))}
        {state === "draft" && (
          <div className="draft-ready-card">
            <div className="drc-head"><Icon name="file-check" size={15} /> Draft ready</div>
            <p>A clarification message about “{contextRisk ? contextRisk.title : "the renewal clause"}” is ready to review.</p>
            <Button variant="primary" size="sm" icon="arrow-right">Open draft</Button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="voice-controls">
        <button className={`vbtn ${muted ? "on" : ""}`} onClick={() => setMuted(!muted)}>
          <Icon name={muted ? "mic-off" : "mic"} size={20} />
          <span>{muted ? "Unmute" : "Mute"}</span>
        </button>
        <button className="vbtn vbtn-end" onClick={() => { setState("ended"); after(700, onClose); }}>
          <Icon name="phone-off" size={20} />
          <span>End call</span>
        </button>
        <button className="vbtn" onClick={onClose}>
          <Icon name="keyboard" size={20} />
          <span>Text instead</span>
        </button>
      </div>
    </aside>
  );
}

Object.assign(window, { VoicePanel, VOICE_STATES });
