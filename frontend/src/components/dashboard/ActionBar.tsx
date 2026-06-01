"use client";
import { Button } from "@/components/ui/Button";
import { DebugTerminal } from "@/components/dashboard/DebugTerminal";
import type { DebugLine, RiskItem } from "@/lib/types";

interface ActionBarProps {
  selectedCount: number;
  selectedRisks: RiskItem[];
  debugLines: DebugLine[];
  termOpen: boolean;
  onToggleTerm: () => void;
  onGenerateSelected: (risks: RiskItem[]) => void;
  onCallAgent: () => void;
}

export function ActionBar({
  selectedCount,
  selectedRisks,
  debugLines,
  termOpen,
  onToggleTerm,
  onGenerateSelected,
  onCallAgent,
}: ActionBarProps) {
  return (
    <div className="actionbar">
      <DebugTerminal
        open={termOpen}
        onToggle={onToggleTerm}
        lines={debugLines}
      />
      <div className="actionbar-row">
        <div className="actionbar-sel">
          {selectedCount > 0 ? (
            <>
              <strong>{selectedCount}</strong>{" "}
              risk{selectedCount > 1 ? "s" : ""} selected
            </>
          ) : (
            <span className="muted-ink">Select risks to draft a message</span>
          )}
        </div>

        <div className="actionbar-btns">
          <Button
            variant="secondary"
            onDark
            icon="sparkles"
            disabled={selectedCount === 0}
            onClick={() => onGenerateSelected(selectedRisks)}
          >
            Generate message{selectedCount > 0 ? ` (${selectedCount})` : ""}
          </Button>
          <Button variant="primary" icon="phone" onClick={onCallAgent}>
            Call your agent
          </Button>
        </div>
      </div>
    </div>
  );
}
