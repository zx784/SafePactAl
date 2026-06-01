"use client";
import { useEffect, useRef } from "react";
import { LucideIcon } from "@/components/ui/Icon";
import type { DebugLine } from "@/lib/types";

interface DebugTerminalProps {
  open: boolean;
  onToggle: () => void;
  lines: DebugLine[];
}

export function DebugTerminal({ open, onToggle, lines }: DebugTerminalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [open, lines]);

  return (
    <div className="terminal">
      <button
        className="terminal-head"
        onClick={onToggle}
        aria-expanded={open}
      >
        <LucideIcon name="terminal" size={15} />
        <span>Agent activity</span>
        <span className="terminal-meta">{lines.length} events</span>
        <LucideIcon name={open ? "chevron-down" : "chevron-up"} size={16} />
      </button>

      {open && (
        <div className="terminal-body scroll" ref={bodyRef}>
          {lines.length === 0 ? (
            <div className="tline">
              <span className="tline-tag tag-info">[info]</span>
              <span className="tline-text">Waiting for activity…</span>
            </div>
          ) : (
            lines.map((line, i) => (
              <div className="tline" key={i}>
                <span className={`tline-tag tag-${line.kind}`}>
                  [{line.kind}]
                </span>
                <span className="tline-text">{line.text}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
