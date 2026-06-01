/* ProtectMe AI — Message Generator panel (desktop right panel / mobile sheet) */
const MSG_TYPES = ["Clarification", "Negotiation", "Rejection", "Amendment request"];
const TONES = ["Polite", "Firm", "Professional"];
const FORMATS = ["Email", "WhatsApp"];

function draftFor(type, tone, format, risks) {
  const greeting = format === "WhatsApp" ? "Hi," : "Dear Landlord,";
  const topics = risks.length
    ? risks.map(r => r.title.toLowerCase()).join(", ")
    : "a few clauses in the agreement";
  const opener = {
    Clarification: `I've reviewed the lease and wanted to ask a couple of quick questions before signing.`,
    Negotiation: `I've reviewed the lease and I'd like to propose a few small adjustments before signing.`,
    Rejection: `Thank you for sending the lease. As written, a few terms don't work for me.`,
    "Amendment request": `I've reviewed the lease and would like to request a few amendments before signing.`,
  }[type];
  const body = risks.length
    ? risks.map(r => `• ${r.title}: ${r.question}`).join("\n")
    : `• Could we clarify the renewal and deposit terms?`;
  const close = tone === "Firm"
    ? `I'm keen to move forward once these are addressed. Could you confirm by reply?`
    : tone === "Professional"
    ? `I'd appreciate your confirmation on these points at your convenience.`
    : `Thanks so much for understanding — happy to talk it through.`;
  return `${greeting}\n\n${opener} Specifically, regarding ${topics}:\n\n${body}\n\n${close}\n\nBest regards,\nAlex`;
}

function Segmented({ label, options, value, onChange }) {
  return (
    <div className="mg-field">
      <div className="mg-label">{label}</div>
      <div className="seg">
        {options.map(o => (
          <button key={o} className={`seg-btn ${value === o ? "on" : ""}`} onClick={() => onChange(o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function MessagePanel({ risks, onClose, printMode }) {
  const [type, setType] = useState("Clarification");
  const [tone, setTone] = useState("Polite");
  const [format, setFormat] = useState("Email");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState(() => draftFor("Clarification", "Polite", "Email", risks));

  const regen = useCallback((overrides = {}) => {
    setBusy(true);
    const t = { type, tone, format, ...overrides };
    setTimeout(() => { setDraft(draftFor(t.type, t.tone, t.format, risks)); setBusy(false); }, 650);
  }, [type, tone, format, risks]);

  useEffect(() => { if (!printMode) regen(); /* eslint-disable-next-line */ }, [type, tone, format]);

  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(draft).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };

  return (
    <aside className="panel" role="dialog" aria-label="Message generator">
      <div className="panel-head">
        <div className="panel-head-title">
          <div className="panel-ic" style={{ background: "var(--brand-soft)", color: "var(--brand-solid)" }}><Icon name="sparkles" size={17} /></div>
          <div>
            <h3>Generate a message</h3>
            <p>{risks.length ? `From ${risks.length} selected risk${risks.length > 1 ? "s" : ""}` : "From your report"}</p>
          </div>
        </div>
        <IconButton icon="x" label="Close panel" className="on-light" onClick={onClose} />
      </div>

      <div className="panel-body scroll scroll-light">
        <Segmented label="Message type" options={MSG_TYPES} value={type} onChange={setType} />
        <div className="mg-grid">
          <Segmented label="Tone" options={TONES} value={tone} onChange={setTone} />
          <Segmented label="Format" options={FORMATS} value={format} onChange={setFormat} />
        </div>

        <div className="mg-field">
          <div className="mg-label">Draft <span className="mg-format">{format}</span></div>
          <div className={`draft ${busy ? "busy" : ""}`}>
            {busy ? (
              <div className="draft-busy"><Icon name="loader" size={18} /> Writing your message…</div>
            ) : (
              <textarea value={draft} onChange={e => setDraft(e.target.value)} spellCheck="false" />
            )}
          </div>
        </div>

        <div className="mg-tweaks">
          <button className="chip" onClick={() => regen()}><Icon name="refresh-cw" size={14} /> Regenerate</button>
          <button className="chip" onClick={() => regen()}><Icon name="minimize-2" size={14} /> Make shorter</button>
          <button className="chip" onClick={() => { setTone("Professional"); }}><Icon name="briefcase" size={14} /> More formal</button>
        </div>
      </div>

      <div className="panel-foot">
        <Button variant="ghost" onLight onClick={onClose}>Done</Button>
        <Button variant="primary" icon={copied ? "check" : "copy"} onClick={copy}>{copied ? "Copied" : "Copy message"}</Button>
      </div>
    </aside>
  );
}

Object.assign(window, { MessagePanel });
