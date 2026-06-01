"use client";
import { LucideIcon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

interface NavProps {
  onHome?: () => void;
  showNewContract?: boolean;
}

export function Nav({ onHome, showNewContract }: NavProps) {
  return (
    <nav className="nav">
      <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <button className="brand" onClick={onHome} aria-label="Go to home">
          <span className="brand-mark">
            <LucideIcon name="shield-check" size={19} color="#fff" />
          </span>
          <span className="brand-name">
            Protect<em>Me</em> AI
          </span>
        </button>

        <div className="nav-links">
          <button className="nav-link">How it works</button>
          <button className="nav-link" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <LucideIcon name="lock" size={14} />
            Privacy
          </button>
          {showNewContract && (
            <Button variant="secondary" onDark size="sm" icon="plus" onClick={onHome}>
              New contract
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
