"use client";
import type { FilterTab, RiskReport } from "@/lib/types";

interface FilterTabsProps {
  active: FilterTab;
  onChange: (tab: FilterTab) => void;
  report: RiskReport;
}

export function FilterTabs({ active, onChange, report }: FilterTabsProps) {
  const counts = {
    all: report.risks.length,
    high: report.risks.filter((r) => r.severity === "High").length,
    medium: report.risks.filter((r) => r.severity === "Medium").length,
    low: report.risks.filter((r) => r.severity === "Low").length,
  };

  const tabs: { id: FilterTab; label: string; dot: string | null }[] = [
    { id: "all", label: "All", dot: null },
    { id: "high", label: "High", dot: "var(--risk-high)" },
    { id: "medium", label: "Medium", dot: "var(--risk-med)" },
    { id: "low", label: "Low", dot: "var(--risk-low)" },
  ];

  return (
    <div className="ftabs" role="tablist" aria-label="Filter risks by severity">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          className={`ftab !rounded-xs ${active === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.dot && <span className="ftab-dot" style={{ background: t.dot }} />}
          {t.label}
          <span className="ftab-ct" style={{ color: t.dot }}>
            {counts[t.id]}
          </span>
        </button>
      ))}
    </div>
  );
}
