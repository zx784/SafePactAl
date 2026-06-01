/* ProtectMe AI — Screen 2: Risk Report Dashboard */
function StatCard({ icon, tint, label, value, sub, valueColor }) {
  return (
    <div className="stat">
      <div className="stat-ic" style={{ background: tint.bg, color: tint.fg }}><Icon name={icon} size={18} /></div>
      <div className="stat-k">{label}</div>
      <div className="stat-v" style={{ color: valueColor }}>{value}</div>
      {sub && <div className="stat-s">{sub}</div>}
    </div>
  );
}

function FilterTabs({ filter, setFilter }) {
  const tabs = [
    { id: "all", label: "All", count: COUNTS.total, dot: null },
    { id: "high", label: "High", count: COUNTS.high, dot: "var(--risk-high)" },
    { id: "medium", label: "Medium", count: COUNTS.medium, dot: "var(--risk-med)" },
    { id: "low", label: "Low", count: COUNTS.low, dot: "var(--risk-low)" },
  ];
  return (
    <div className="ftabs" role="tablist" aria-label="Filter risks by severity">
      {tabs.map(t => (
        <button key={t.id} role="tab" aria-selected={filter === t.id}
          className={`ftab ${filter === t.id ? "active" : ""}`} onClick={() => setFilter(t.id)}>
          {t.dot && <span className="ftab-dot" style={{ background: t.dot }} />}
          {t.label}
          <span className="ftab-ct">{t.count}</span>
        </button>
      ))}
    </div>
  );
}

function DebugTerminal({ open, onToggle, lines }) {
  const bodyRef = useRef(null);
  useEffect(() => { if (open && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [open, lines]);
  return (
    <div className={`terminal ${open ? "open" : ""}`}>
      <button className="terminal-head" onClick={onToggle} aria-expanded={open}>
        <Icon name="terminal" size={15} />
        <span>Agent activity</span>
        <span className="terminal-meta">{lines.length} events</span>
        <Icon name={open ? "chevron-down" : "chevron-up"} size={16} />
      </button>
      {open && (
        <div className="terminal-body scroll" ref={bodyRef}>
          {lines.map((l, i) => (
            <div className="tline" key={i}>
              <span className={`tline-tag tag-${l.kind}`}>[{l.kind === "agent" ? "Agent" : "Tool"}]</span>
              <span className="tline-text">{l.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Dashboard({ selected, onSelect, onAsk, onGenerate, onCallAgent, onGenerateSelected, panelOpen, terminalLines, printMode }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState("r1");
  const [termOpen, setTermOpen] = useState(!!printMode);

  const sorted = useMemo(() => [...RISKS].sort((a, b) => SEVERITY[a.severity].order - SEVERITY[b.severity].order), []);
  const visible = sorted.filter(r => {
    if (filter !== "all" && r.severity !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (r.title + r.preview + r.section + r.explanation).toLowerCase().includes(q);
    }
    return true;
  });

  const selectedCount = selected.size;

  return (
    <div className={`dash ${panelOpen ? "with-panel" : ""} ${printMode ? "dash-print" : ""}`}>
      <div className="dash-scroll scroll">
        <div className="dash-inner">
          {/* Report header */}
          <header className="report-head">
            <div>
              <span className="eyebrow" style={{ color: "var(--brand-blue)" }}>Risk report</span>
              <h1 className="report-title">{CONTRACT.name}</h1>
              <p className="report-meta">{CONTRACT.type} · {CONTRACT.pages} pages · analyzed just now</p>
            </div>
            <SeverityBadge severity="high" label="Overall: High risk" />
          </header>

          {/* Summary stats */}
          <div className="stats">
            <StatCard icon="file-text" tint={{ bg: "var(--brand-soft)", fg: "var(--brand-solid)" }} label="Contract type" value="Rental lease" />
            <StatCard icon="shield-alert" tint={{ bg: "var(--risk-high-soft)", fg: "var(--risk-high)" }} label="Overall risk" value="High" valueColor="var(--risk-high-text)" />
            <StatCard icon="list-checks" tint={{ bg: "var(--risk-med-soft)", fg: "var(--risk-med)" }} label="Detected risks" value={COUNTS.total} sub={`${COUNTS.high} high · ${COUNTS.medium} med · ${COUNTS.low} low`} />
            <StatCard icon="message-square" tint={{ bg: "var(--risk-low-soft)", fg: "var(--risk-low)" }} label="Recommendation" value={CONTRACT.recommendation} />
          </div>

          {/* Filters + search */}
          <div className="controls">
            <FilterTabs filter={filter} setFilter={setFilter} />
            <div className="search">
              <Icon name="search" size={17} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search risks…" aria-label="Search risks" />
              {search && <button className="search-clear" onClick={() => setSearch("")} aria-label="Clear search"><Icon name="x" size={14} /></button>}
            </div>
          </div>

          {/* Risk list */}
          <div className="risklist">
            {visible.length === 0 ? (
              <div className="empty">
                <Icon name="search-x" size={28} />
                <h3>No risks match</h3>
                <p>Try a different filter or search term.</p>
              </div>
            ) : visible.map(r => (
              <RiskCard key={r.id} risk={r}
                expanded={printMode ? true : expandedId === r.id}
                selected={selected.has(r.id)}
                onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                onSelect={() => onSelect(r.id)}
                onAsk={onAsk}
                onGenerate={onGenerate}
              />
            ))}
          </div>

          <div style={{ height: 120 }} />
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="actionbar">
        <DebugTerminal open={termOpen} onToggle={() => setTermOpen(!termOpen)} lines={terminalLines} />
        <div className="actionbar-row">
          <div className="actionbar-sel">
            {selectedCount > 0
              ? <><strong>{selectedCount}</strong> risk{selectedCount > 1 ? "s" : ""} selected</>
              : <span className="muted-ink">Select risks to draft a message</span>}
          </div>
          <div className="actionbar-btns">
            <Button variant="secondary" onLight icon="sparkles" disabled={selectedCount === 0} onClick={onGenerateSelected}>
              Generate message{selectedCount > 0 ? ` (${selectedCount})` : ""}
            </Button>
            <Button variant="primary" icon="phone" onClick={onCallAgent}>Call your agent</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
