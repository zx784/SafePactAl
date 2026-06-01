"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { LucideIcon } from "@/components/ui/Icon";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { generateMessage } from "@/lib/api";
import type {
  RiskItem,
  MessageType,
  MessageTone,
  MessageFormat,
  DebugLine,
} from "@/lib/types";

interface MessagePanelProps {
  riskIds: string[];
  risks: RiskItem[];
  sessionId: string;
  onClose: () => void;
  onDebugLine: (kind: DebugLine["kind"], text: string) => void;
}

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

const TYPE_OPTIONS: SegmentOption<MessageType>[] = [
  { value: "clarification",    label: "Clarification" },
  { value: "negotiation",      label: "Negotiation" },
  { value: "rejection",        label: "Rejection" },
  { value: "amendment_request", label: "Amendment" },
];

const TONE_OPTIONS: SegmentOption<MessageTone>[] = [
  { value: "polite",       label: "Polite" },
  { value: "firm",         label: "Firm" },
  { value: "professional", label: "Professional" },
];

const FORMAT_OPTIONS: SegmentOption<MessageFormat>[] = [
  { value: "email",    label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
];

const SEVERITY_ICON: Record<string, string> = {
  High:   "shield-alert",
  Medium: "alert-circle",
  Low:    "check-circle",
};

function SegGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mp-seg-group">
      <div className="mp-seg-label">{label}</div>
      <div className="mp-seg">
        {options.map((o) => (
          <button
            key={o.value}
            className={`mp-seg-btn${value === o.value ? " active" : ""}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MessagePanel({
  riskIds,
  risks,
  sessionId,
  onClose,
  onDebugLine,
}: MessagePanelProps) {
  const [messageType, setMessageType] = useState<MessageType>("clarification");
  const [tone, setTone]               = useState<MessageTone>("professional");
  const [format, setFormat]           = useState<MessageFormat>("email");
  const [draft, setDraft]             = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [copied, setCopied]           = useState(false);

  const selectedRisks = risks.filter((r) => riskIds.includes(r.id));

  const callGenerate = useCallback(
    async (extraInstruction?: string) => {
      setIsLoading(true);
      const label = extraInstruction
        ? extraInstruction.slice(0, 40)
        : `${messageType} / ${tone} / ${format}`;
      onDebugLine("tool", `generate_message(${label})`);

      try {
        const result = await generateMessage({
          session_id: sessionId,
          clause_ids: riskIds,
          message_type: messageType,
          tone,
          format,
          extra_instruction: extraInstruction,
        });
        setDraft(result.draft);
        onDebugLine("agent", `Draft ready — ${result.draft.length} chars`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        onDebugLine("error", `Message generation failed: ${msg}`);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, riskIds, messageType, tone, format, onDebugLine],
  );

  const handleCopy = useCallback(async () => {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    onDebugLine("info", "Draft copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [draft, onDebugLine]);

  return (
    <div className="msg-panel">
      {/* Header */}
      <div className="mp-head">
        <div className="mp-head-left">
          <LucideIcon name="sparkles" size={17} />
          Message Generator
        </div>
        <button className="mp-close" onClick={onClose} aria-label="Close panel">
          <LucideIcon name="x" size={18} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="mp-body scroll scroll-light">
        {/* Selected risks */}
        <div>
          <div className="mp-section-label">
            <LucideIcon name="shield-alert" size={12} />
            {riskIds.length === 1 ? "1 risk selected" : `${riskIds.length} risks selected`}
          </div>
          <div className="mp-risk-list">
            {selectedRisks.map((r) => (
              <div
                key={r.id}
                className={`mp-risk-chip mp-risk-chip-${r.severity.toLowerCase()}`}
              >
                <LucideIcon name={SEVERITY_ICON[r.severity] ?? "circle"} size={13} />
                {r.title}
              </div>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="mp-section">
          <SegGroup
            label="Message type"
            options={TYPE_OPTIONS}
            value={messageType}
            onChange={setMessageType}
          />
          <SegGroup
            label="Tone"
            options={TONE_OPTIONS}
            value={tone}
            onChange={setTone}
          />
          <SegGroup
            label="Format"
            options={FORMAT_OPTIONS}
            value={format}
            onChange={setFormat}
          />
        </div>

        {/* Generate / Regenerate */}
        <div className="mp-generate">
          <Button
            variant="primary"
            className="btn-block"
            icon={isLoading ? "loader" : "sparkles"}
            disabled={isLoading}
            onClick={() => callGenerate()}
          >
            {isLoading ? "Generating…" : draft ? "Regenerate" : "Generate draft"}
          </Button>
        </div>

        {/* Draft */}
        {draft && (
          <div className="mp-draft">
            <div className="mp-draft-head">
              <div className="mp-section-label" style={{ marginBottom: 0 }}>
                <LucideIcon name="file-text" size={12} />
                Generated draft
              </div>
              <div className="mp-draft-actions">
                <button
                  className="mp-tweak"
                  disabled={isLoading}
                  onClick={() =>
                    callGenerate(
                      "Rewrite this message to be significantly shorter while keeping the key points.",
                    )
                  }
                >
                  <LucideIcon name="minimize-2" size={12} />
                  Shorter
                </button>
                <button
                  className="mp-tweak"
                  disabled={isLoading}
                  onClick={() =>
                    callGenerate(
                      "Rewrite this message in a more formal, professional tone.",
                    )
                  }
                >
                  <LucideIcon name="briefcase" size={12} />
                  More formal
                </button>
              </div>
            </div>

            <textarea
              className="mp-textarea scroll-light"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={12}
              spellCheck
              aria-label="Generated message draft"
            />

            <Button
              variant="secondary"
              onLight
              size="sm"
              icon={copied ? "check" : "copy"}
              className="mp-copy"
              onClick={handleCopy}
            >
              {copied ? "Copied!" : "Copy draft"}
            </Button>
          </div>
        )}

        <Disclaimer style={{ marginTop: "auto" }} />
      </div>
    </div>
  );
}
