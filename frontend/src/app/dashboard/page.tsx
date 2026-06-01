"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { SearchInput } from "@/components/dashboard/SearchInput";
import { RiskList } from "@/components/dashboard/RiskList";
import { ActionBar } from "@/components/dashboard/ActionBar";
import { MessagePanel } from "@/components/dashboard/MessagePanel";
import { VoicePanel } from "@/components/dashboard/VoicePanel";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Toast } from "@/components/ui/Toast";
import { useStore } from "@/store/useStore";
import { setActiveClause } from "@/lib/api";
import type { FilterTab, RiskItem, ToastData } from "@/lib/types";

type PanelMode = "none" | "message" | "voice";

export default function DashboardPage() {
  const router = useRouter();
  const {
    sessionId,
    riskReport,
    selectedIds,
    debugLines,
    toggleSelect,
    clearSession,
    addDebugLine,
    _hasHydrated,
  } = useStore();

  const [filter, setFilter]             = useState<FilterTab>("all");
  const [search, setSearch]             = useState("");
  const [termOpen, setTermOpen]         = useState(false);
  const [toast, setToast]               = useState<ToastData | null>(null);
  const [panelMode, setPanelMode]       = useState<PanelMode>("none");
  const [panelRiskIds, setPanelRiskIds] = useState<string[]>([]);
  const [voiceClauseId, setVoiceClauseId] = useState<string | null>(null);

  // Debounce "Ask agent" opens — suppress duplicate logs + active-clause POSTs
  // from rapid double-clicks or React StrictMode re-invokes.
  const lastOpenRef = useRef<{ key: string; ts: number }>({ key: "", ts: 0 });

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!sessionId || !riskReport) router.replace("/");
  }, [_hasHydrated, sessionId, riskReport, router]);

  const showToast = useCallback((t: ToastData) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const closePanel = useCallback(() => setPanelMode("none"), []);

  const openMessagePanel = useCallback((ids: string[]) => {
    setPanelRiskIds(ids);
    setPanelMode("message");
  }, []);

  const openVoicePanel = useCallback((clauseId: string | null = null) => {
    setVoiceClauseId(clauseId);
    setPanelMode("voice");
  }, []);

  const handleFilterChange = useCallback((tab: FilterTab) => {
    setFilter(tab);
    addDebugLine("info", `Filter: ${tab}`);
  }, [addDebugLine]);

  const handleAsk = useCallback(async (risk: RiskItem) => {
    const now = Date.now();
    // Skip if this exact clause was just opened (<1s) or its voice panel is
    // already open — avoids the repeated "Voice agent opened" log + dup POST.
    const alreadyOpen = panelMode === "voice" && voiceClauseId === risk.id;
    const rapidRepeat = lastOpenRef.current.key === risk.id && now - lastOpenRef.current.ts < 1000;
    lastOpenRef.current = { key: risk.id, ts: now };
    if (alreadyOpen || rapidRepeat) return;

    addDebugLine("info", `Voice agent opened for: ${risk.title}`);
    // Set the focused clause and WAIT for success BEFORE opening the panel,
    // so "explain this clause" always answers about the selected risk.
    if (sessionId) {
      try {
        await setActiveClause(sessionId, risk.id);
        addDebugLine("tool", `[Session] active_clause_id set: ${risk.id}`);
      } catch {
        addDebugLine("error", `Failed to set active clause: ${risk.id}`);
      }
    }
    openVoicePanel(risk.id);
  }, [addDebugLine, openVoicePanel, sessionId, panelMode, voiceClauseId]);

  const handleGenerate = useCallback((risk: RiskItem) => {
    addDebugLine("info", `Message panel opened for: ${risk.title}`);
    openMessagePanel([risk.id]);
  }, [addDebugLine, openMessagePanel]);

  const handleGenerateSelected = useCallback((risks: RiskItem[]) => {
    addDebugLine("info", `Message panel opened for ${risks.length} risk(s)`);
    openMessagePanel(risks.map((r) => r.id));
  }, [addDebugLine, openMessagePanel]);

  const handleCallAgent = useCallback(async () => {
    const now = Date.now();
    const alreadyOpen = panelMode === "voice" && voiceClauseId === null;
    const rapidRepeat = lastOpenRef.current.key === "__general__" && now - lastOpenRef.current.ts < 1000;
    lastOpenRef.current = { key: "__general__", ts: now };
    if (alreadyOpen || rapidRepeat) return;

    addDebugLine("info", "Voice agent opened (action bar)");
    // General call — clear any previously focused clause so a stale selection
    // can't leak into "explain this clause".
    if (sessionId) {
      try {
        await setActiveClause(sessionId, "");
        addDebugLine("tool", "[Session] active_clause_id cleared");
      } catch { /* non-fatal */ }
    }
    openVoicePanel(null);
  }, [addDebugLine, openVoicePanel, sessionId, panelMode, voiceClauseId]);

  const handleHome = useCallback(() => {
    clearSession();
    router.push("/");
  }, [clearSession, router]);

  if (!_hasHydrated) return null;
  if (!riskReport || !sessionId) return null;

  const selectedRisks = riskReport.risks.filter((r) => selectedIds.includes(r.id));
  const panelOpen = panelMode !== "none";

  return (
    <div className={`app${panelOpen ? " panel-open" : ""}`}>
      <Nav onHome={handleHome} showNewContract />

      <div className="dash">
        <div className="dash-main">
          {/* Scrollable risk list */}
          <div className="dash-scroll scroll">
            <div className="dash-inner">
              <header className="report-head">
                <div>
                  <span className="eyebrow" style={{ color: "var(--brand-blue)" }}>
                    Risk report
                  </span>
                  <h1 className="report-title">{riskReport.contract_type}</h1>
                  <p className="report-meta">
                    {riskReport.risks.length} risks detected · session {sessionId.slice(0, 8)}
                  </p>
                </div>
                <SeverityBadge
                  severity={riskReport.overall_risk}
                  label={`Overall: ${riskReport.overall_risk} risk`}
                />
              </header>

              <StatsGrid report={riskReport} />

              <div className="controls">
                <FilterTabs active={filter} onChange={handleFilterChange} report={riskReport} />
                <SearchInput value={search} onChange={setSearch} />
              </div>

              <RiskList
                risks={riskReport.risks}
                filter={filter}
                search={search}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onAsk={handleAsk}
                onGenerate={handleGenerate}
              />

              <Disclaimer style={{ margin: "32px 0 16px" }} />
              <div style={{ height: 120 }} />
            </div>
          </div>

          {/* Right panel — message or voice, never both */}
          {panelMode === "message" && (
            <MessagePanel
              riskIds={panelRiskIds}
              risks={riskReport.risks}
              sessionId={sessionId}
              onClose={closePanel}
              onDebugLine={addDebugLine}
            />
          )}
          {panelMode === "voice" && (
            <VoicePanel
              sessionId={sessionId}
              riskReport={riskReport}
              initialClauseId={voiceClauseId}
              onClose={closePanel}
              onDebugLine={addDebugLine}
              useLive={process.env.NEXT_PUBLIC_VOICE_MODE === "live"}
            />
          )}
        </div>

        <ActionBar
          selectedCount={selectedIds.length}
          selectedRisks={selectedRisks}
          debugLines={debugLines}
          termOpen={termOpen}
          onToggleTerm={() => setTermOpen((o) => !o)}
          onGenerateSelected={handleGenerateSelected}
          onCallAgent={handleCallAgent}
        />
      </div>

      {/* Mobile overlay — click to close whichever panel is open */}
      {panelOpen && (
        <div className="mp-overlay" onClick={closePanel} aria-hidden="true" />
      )}

      <Toast toast={toast} />
    </div>
  );
}
