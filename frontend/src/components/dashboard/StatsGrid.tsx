import { LucideIcon } from "@/components/ui/Icon";
import type { RiskReport, RiskSeverity } from "@/lib/types";

interface StatCardProps {
  icon: string;
  tintBg: string;
  tintFg: string;
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
}

function StatCard({ icon, tintBg, tintFg, label, value, sub, valueColor }: StatCardProps) {
  return (
    <div className="stat">
      <div className="stat-ic" style={{ background: tintBg, color: tintFg }}>
        <LucideIcon name={icon} size={18} />
      </div>
      <div className="stat-k">{label}</div>
      <div className="stat-v" style={{ color: valueColor }}>{value}</div>
      {sub && <div className="stat-s">{sub}</div>}
    </div>
  );
}

const RISK_COLORS: Record<string, { bg: string; fg: string; text: string }> = {
  High:    { bg: "var(--risk-high-soft)",  fg: "var(--risk-high)",  text: "var(--risk-high-text)" },
  Medium:  { bg: "var(--risk-med-soft)",   fg: "var(--risk-med)",   text: "var(--risk-med-text)" },
  Low:     { bg: "var(--risk-low-soft)",   fg: "var(--risk-low)",   text: "var(--risk-low-text)" },
  Minimal: { bg: "var(--risk-low-soft)",   fg: "var(--risk-low)",   text: "var(--risk-low-text)" },
};

interface StatsGridProps {
  report: RiskReport;
}

export function StatsGrid({ report }: StatsGridProps) {
  const riskColors = RISK_COLORS[report.overall_risk] ?? RISK_COLORS.Medium;

  const counts = report.risks.reduce(
    (acc, r) => {
      acc[r.severity as RiskSeverity] = (acc[r.severity as RiskSeverity] ?? 0) + 1;
      return acc;
    },
    {} as Record<RiskSeverity, number>,
  );

  const sub = [
    counts.High   ? `${counts.High} high`   : null,
    counts.Medium ? `${counts.Medium} med`  : null,
    counts.Low    ? `${counts.Low} low`     : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="stats">
      <StatCard
        icon="file-text"
        tintBg="var(--brand-soft)"
        tintFg="var(--brand-solid)"
        label="Contract type"
        value={report.contract_type}
      />
      <StatCard
        icon="shield-alert"
        tintBg={riskColors.bg}
        tintFg={riskColors.fg}
        label="Overall risk"
        value={report.overall_risk}
        valueColor={riskColors.text}
      />
      <StatCard
        icon="list-checks"
        tintBg="var(--risk-med-soft)"
        tintFg="var(--risk-med)"
        label="Detected risks"
        value={report.risks.length}
        sub={sub}
      />
      <StatCard
        icon="message-square"
        tintBg="var(--risk-low-soft)"
        tintFg="var(--risk-low)"
        label="Recommendation"
        value={report.final_recommendation}
      />
    </div>
  );
}
