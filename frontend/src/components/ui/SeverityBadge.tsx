import { LucideIcon } from "@/components/ui/Icon";
import { SEVERITY_META } from "@/lib/types";

interface SeverityBadgeProps {
  severity: string;
  label?: string;
}

export function SeverityBadge({ severity, label }: SeverityBadgeProps) {
  const meta = SEVERITY_META[severity] ?? SEVERITY_META["Low"];
  const cssKey = meta.cssKey;

  return (
    <span className={`pill pill-${cssKey}`}>
      <LucideIcon name={meta.icon} size={14} />
      {label ?? `${meta.label} risk`}
    </span>
  );
}
