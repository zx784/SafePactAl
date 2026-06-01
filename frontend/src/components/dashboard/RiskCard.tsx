"use client";
import { LucideIcon } from "@/components/ui/Icon";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { Button } from "@/components/ui/Button";
import type { RiskItem } from "@/lib/types";

interface RiskCardProps {
  risk: RiskItem;
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAsk: (risk: RiskItem) => void;
  onGenerate: (risk: RiskItem) => void;
}

// Final safety net: the backend normalizes blank fields, but if anything still
// arrives empty we never want to render an empty section in a risk card.
const ROW_FALLBACK = "This may create extra cost, responsibility, or uncertainty if not clarified.";

function coalesce(value: string | undefined | null, fallback = ROW_FALLBACK): string {
  return value && value.trim() ? value : fallback;
}

function RcRow({
  icon,
  label,
  children,
  fallback = ROW_FALLBACK,
}: {
  icon: string;
  label: string;
  children: string;
  fallback?: string;
}) {
  return (
    <div className="rc-row">
      <div className="rc-row-label">
        <LucideIcon name={icon} size={15} />
        {label}
      </div>
      <p>{coalesce(children, fallback)}</p>
    </div>
  );
}

export function RiskCard({
  risk,
  expanded,
  selected,
  onToggle,
  onSelect,
  onAsk,
  onGenerate,
}: RiskCardProps) {
  const severityKey = risk.severity.toLowerCase();
  const preview = risk.simple_explanation.length > 120
    ? risk.simple_explanation.slice(0, 117) + "…"
    : risk.simple_explanation;

  return (
    <div
      className={`riskcard riskcard-${severityKey} ${expanded ? "is-expanded" : ""} ${selected ? "is-selected" : ""}`}
    >
      <button
        className="riskcard-head"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <SeverityBadge severity={risk.severity} />
        <div className="riskcard-headtext">
          <h3>{risk.title}</h3>
          {!expanded && <p className="riskcard-preview">{preview}</p>}
          <span className="riskcard-section">{risk.category}</span>
        </div>
        {selected && (
          <span className="riskcard-sel">
            <LucideIcon name="check" size={14} />
          </span>
        )}
        <span className={`riskcard-chev ${expanded ? "up" : ""}`}>
          <LucideIcon name="chevron-down" size={20} />
        </span>
      </button>

      {expanded && (
        <div className="riskcard-body">
          <div className="rc-clause">
            <div className="rc-clause-label">
              <LucideIcon name="quote" size={13} />
              Original clause · {risk.category}
            </div>
            <p>{coalesce(risk.clause_text, "Clause text not available.")}</p>
          </div>

          <div className="rc-rows">
            <RcRow icon="message-circle" label="In plain terms"
              fallback="This clause may affect your rights or obligations.">
              {risk.simple_explanation}
            </RcRow>
            <RcRow icon="alert-circle" label="Why it matters">
              {risk.why_it_matters}
            </RcRow>
            <RcRow icon="help-circle" label="Question to ask"
              fallback="Can you clarify how this clause applies to me, and confirm it in writing?">
              {risk.question_to_ask}
            </RcRow>
            <RcRow icon="lightbulb" label="Suggested action" fallback="Review carefully">
              {risk.suggested_action}
            </RcRow>
          </div>

          <div className="rc-actions">
            <Button
              variant="secondary"
              onLight
              size="sm"
              icon="mic"
              onClick={() => onAsk(risk)}
            >
              Ask agent
            </Button>
            <Button
              variant="secondary"
              onLight
              size="sm"
              icon="sparkles"
              onClick={() => onGenerate(risk)}
            >
              Generate message
            </Button>
            <button
              className={`rc-select ${selected ? "on" : ""}`}
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
            >
              <span className="rc-check">
                {selected && <LucideIcon name="check" size={13} />}
              </span>
              {selected ? "Selected" : "Select"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
