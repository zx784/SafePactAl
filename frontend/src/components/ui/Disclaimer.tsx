import type { CSSProperties } from "react";
import { LucideIcon } from "@/components/ui/Icon";

interface DisclaimerProps {
  style?: CSSProperties;
  className?: string;
}

export function Disclaimer({ style, className }: DisclaimerProps) {
  return (
    <div className={`disclaimer ${className ?? ""}`} style={style}>
      <LucideIcon name="info" size={17} />
      <span>
        ProtectMe AI helps you understand contracts. It does not replace a lawyer or provide legal advice.
      </span>
    </div>
  );
}
