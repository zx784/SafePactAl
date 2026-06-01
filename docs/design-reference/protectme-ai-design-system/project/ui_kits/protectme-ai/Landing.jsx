/* ProtectMe AI — Screen 1: Landing + Upload */
function Dropzone({ onUpload }) {
  const [drag, setDrag] = useState(false);
  const [state, setState] = useState("idle"); // idle | uploading | error
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const begin = useCallback((file) => {
    if (file && file.name && !/\.(pdf|txt|docx?)$/i.test(file.name)) {
      setState("error");
      return;
    }
    setState("uploading");
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += Math.random() * 22 + 8;
      if (p >= 100) { p = 100; clearInterval(t); setTimeout(() => onUpload(), 420); }
      setProgress(Math.min(100, Math.round(p)));
    }, 240);
  }, [onUpload]);

  return (
    <div
      className={`dropzone ${drag ? "is-drag" : ""} ${state === "error" ? "is-error" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); begin(e.dataTransfer.files[0]); }}
      role="button"
      tabIndex={0}
      onClick={() => state !== "uploading" && inputRef.current && inputRef.current.click()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current && inputRef.current.click(); } }}
    >
      <input ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx" className="sr-only"
        onChange={(e) => begin(e.target.files[0])} />

      {state === "uploading" ? (
        <div className="dz-inner">
          <div className="dz-ic dz-ic-busy"><Icon name="loader" size={26} /></div>
          <h3 className="dz-title">Reading every clause…</h3>
          <p className="dz-sub">Maple Street lease · 14 pages</p>
          <div className="dz-progress"><span style={{ width: `${progress}%` }} /></div>
          <p className="dz-sub" style={{ marginTop: 8 }}>{progress}%</p>
        </div>
      ) : state === "error" ? (
        <div className="dz-inner">
          <div className="dz-ic dz-ic-error"><Icon name="file-x" size={26} /></div>
          <h3 className="dz-title">That file type isn't supported</h3>
          <p className="dz-sub">Please upload a PDF, Word, or text file.</p>
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setState("idle"); }} style={{ marginTop: 14 }}>Try again</Button>
        </div>
      ) : (
        <div className="dz-inner">
          <div className="dz-ic"><Icon name="upload-cloud" size={28} /></div>
          <h3 className="dz-title">Drop your contract here</h3>
          <p className="dz-sub">PDF, Word, or text — we'll read every clause for you.</p>
          <Button variant="primary" style={{ marginTop: 18 }} onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}>
            <Icon name="upload-cloud" size={17} /> Upload contract
          </Button>
          <button className="dz-sample" onClick={(e) => { e.stopPropagation(); begin({ name: "sample.pdf" }); }}>
            or try a sample lease
          </button>
        </div>
      )}
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: "upload-cloud", title: "Upload your contract", body: "Drop in a PDF or text file. Nothing is shared without your say-so." },
    { icon: "list-checks", title: "Review every risk", body: "See all detected risks, sorted by severity, explained in plain language." },
    { icon: "mic", title: "Ask before you agree", body: "Generate a message or talk to your agent about anything you've read." },
  ];
  return (
    <div className="how">
      {steps.map((s, i) => (
        <div className="how-card" key={i}>
          <div className="how-num">{i + 1}</div>
          <div className="how-ic"><Icon name={s.icon} size={20} /></div>
          <h4>{s.title}</h4>
          <p>{s.body}</p>
        </div>
      ))}
    </div>
  );
}

function Landing({ onUpload }) {
  return (
    <div>
      <main className="wrap landing">
        <div className="landing-hero">
          <span className="eyebrow fade-up" style={{ color: "var(--brand-blue)" }}>Contract-risk assistant</span>
          <h1 className="landing-title fade-up">
            Understand before you sign.<br /><span className="grad">Ask before you agree.</span>
          </h1>
          <p className="landing-sub fade-up">
            ProtectMe AI reads your rental, bank, subscription, or service agreement and shows you
            every risk — in plain language. Then you can ask questions before you commit.
          </p>
        </div>

        <div className="landing-upload fade-up">
          <Dropzone onUpload={onUpload} />
          <div className="privacy-note">
            <Icon name="lock" size={15} />
            <span>Your contract stays private. We analyze it to build your report and never sell your data.</span>
          </div>
        </div>

        <section className="landing-section">
          <h2 className="section-h">How it works</h2>
          <HowItWorks />
        </section>

        <div className="disclaimer" style={{ margin: "8px 0 40px" }}>
          <Icon name="info" size={17} />
          <span>ProtectMe AI helps you understand contracts. It does not replace a lawyer or provide legal advice.</span>
        </div>
      </main>
    </div>
  );
}

Object.assign(window, { Landing });
