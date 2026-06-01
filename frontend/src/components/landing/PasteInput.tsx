"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LucideIcon } from "@/components/ui/Icon";

interface PasteInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function PasteInput({ onSubmit, isLoading }: PasteInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed.length < 50) return;
    onSubmit(trimmed);
  };

  const charCount = text.length;
  const canSubmit = charCount >= 50 && !isLoading;

  return (
    <div className="paste-box">
      <textarea
        className="paste-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your contract text here. We'll analyze every clause for you…"
        disabled={isLoading}
      />
      <div className="paste-footer">
        <span className="paste-count">{charCount.toLocaleString()} chars</span>
        <Button
          variant="primary"
          icon={isLoading ? "loader" : "search"}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isLoading ? "Analyzing…" : "Analyze contract"}
        </Button>
      </div>
      {charCount > 0 && charCount < 50 && (
        <div style={{ padding: "0 16px 12px", display: "flex", alignItems: "center", gap: 6 }}>
          <LucideIcon name="info" size={13} color="var(--state-warning)" />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Please paste at least 50 characters of contract text.
          </span>
        </div>
      )}
    </div>
  );
}
