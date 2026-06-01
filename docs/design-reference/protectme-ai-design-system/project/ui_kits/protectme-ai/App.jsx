/* ProtectMe AI — App shell & state machine */
function Nav({ onHome, showHome }) {
  return (
    <nav className="nav">
      <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <button className="brand" onClick={onHome} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <span className="brand-mark"><Icon name="shield-check" size={19} /></span>
          <span className="brand-name">Protect<em>Me</em> AI</span>
        </button>
        <div className="nav-links">
          <button className="nav-link">How it works</button>
          <button className="nav-link"><Icon name="lock" size={14} style={{ marginRight: 5 }} />Privacy</button>
          {showHome && <Button variant="secondary" onDark size="sm" icon="plus" onClick={onHome}>New contract</Button>}
        </div>
      </div>
    </nav>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const tint = { success: "var(--state-success)", warning: "var(--state-warning)", info: "var(--state-info)" }[toast.kind] || "var(--state-info)";
  return (
    <div className="toast-live fade-up">
      <span className="toast-ic" style={{ color: tint }}><Icon name={toast.icon || "check-circle"} size={18} /></span>
      <div><h4>{toast.title}</h4>{toast.body && <p>{toast.body}</p>}</div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState("landing");
  const [panel, setPanel] = useState(null); // 'message' | 'voice'
  const [selected, setSelected] = useState(new Set());
  const [messageRisks, setMessageRisks] = useState([]);
  const [voiceRisk, setVoiceRisk] = useState(null);
  const [lines, setLines] = useState([
    { kind: "agent", text: "report ready · 8 risks detected" },
    { kind: "tool", text: "risk.classify() → 3 high · 3 medium · 2 low" },
  ]);
  const [toast, setToast] = useState(null);

  const addLog = useCallback((kind, text) => setLines(l => [...l, { kind, text }]), []);
  const showToast = useCallback((t) => { setToast(t); setTimeout(() => setToast(null), 2600); }, []);

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const openMessage = (risks) => { setMessageRisks(risks); setPanel("message"); };
  const openVoice = (risk) => { setVoiceRisk(risk || null); setPanel("voice"); addLog("agent", "voice session started"); };

  const onUpload = () => { setScreen("dashboard"); showToast({ kind: "success", icon: "check-circle", title: "Report ready", body: "8 risks detected — sorted by severity." }); };

  const selectedRiskObjs = RISKS.filter(r => selected.has(r.id));

  return (
    <div className={`app ${panel ? "panel-open" : ""}`}>
      <Nav onHome={() => { setScreen("landing"); setPanel(null); setSelected(new Set()); }} showHome={screen === "dashboard"} />

      {screen === "landing" && <Landing onUpload={onUpload} />}

      {screen === "dashboard" && (
        <div className={`stage ${panel ? "stage-split" : ""}`}>
          <Dashboard
            selected={selected}
            onSelect={toggleSelect}
            onAsk={(r) => openVoice(r)}
            onGenerate={(r) => openMessage([r])}
            onGenerateSelected={() => openMessage(selectedRiskObjs)}
            onCallAgent={() => openVoice(null)}
            panelOpen={!!panel}
            terminalLines={lines}
          />

          {panel === "message" && (
            <>
              <div className="scrim" onClick={() => setPanel(null)} />
              <MessagePanel risks={messageRisks} onClose={() => setPanel(null)} />
            </>
          )}
          {panel === "voice" && (
            <>
              <div className="scrim" onClick={() => setPanel(null)} />
              <VoicePanel contextRisk={voiceRisk} onClose={() => setPanel(null)} onLog={addLog} />
            </>
          )}
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
