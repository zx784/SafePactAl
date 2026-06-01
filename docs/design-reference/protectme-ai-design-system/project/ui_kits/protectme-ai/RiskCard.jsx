/* ProtectMe AI — Risk Card (collapsed preview ↔ expanded detail) */
function RiskCard({ risk, expanded, selected, onToggle, onSelect, onAsk, onGenerate }) {
  const meta = SEVERITY[risk.severity];
  return (
    <div className={`riskcard riskcard-${risk.severity} ${expanded ? "is-expanded" : ""} ${selected ? "is-selected" : ""}`}>
      {/* Header — the whole row is the expand target */}
      <button className="riskcard-head" onClick={onToggle} aria-expanded={expanded}>
        <SeverityBadge severity={risk.severity} />
        <div className="riskcard-headtext">
          <h3>{risk.title}</h3>
          {!expanded && <p className="riskcard-preview">{risk.preview}</p>}
          <span className="riskcard-section">{risk.section}</span>
        </div>
        {selected && <span className="riskcard-sel"><Icon name="check" size={14} /></span>}
        <span className={`riskcard-chev ${expanded ? "up" : ""}`}><Icon name="chevron-down" size={20} /></span>
      </button>

      {/* Expanded body */}
      <div className="riskcard-body" hidden={!expanded}>
        <div className="rc-clause">
          <div className="rc-clause-label"><Icon name="quote" size={13} /> Original clause · {risk.section}</div>
          <p>{risk.clause}</p>
        </div>

        <div className="rc-rows">
          <RcRow icon="message-circle" label="In plain terms">{risk.explanation}</RcRow>
          <RcRow icon="alert-circle" label="Why it matters">{risk.matters}</RcRow>
          <RcRow icon="help-circle" label="Question to ask">{risk.question}</RcRow>
          <RcRow icon="lightbulb" label="Suggested action">{risk.action}</RcRow>
        </div>

        <div className="rc-actions">
          <Button variant="secondary" onLight size="sm" icon="mic" onClick={() => onAsk(risk)}>Ask agent</Button>
          <Button variant="secondary" onLight size="sm" icon="sparkles" onClick={() => onGenerate(risk)}>Generate message</Button>
          <button className={`rc-select ${selected ? "on" : ""}`} onClick={onSelect}>
            <span className="rc-check"><Icon name="check" size={13} /></span>
            {selected ? "Selected" : "Select"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RcRow({ icon, label, children }) {
  return (
    <div className="rc-row">
      <div className="rc-row-label"><Icon name={icon} size={15} /> {label}</div>
      <p>{children}</p>
    </div>
  );
}

Object.assign(window, { RiskCard });
