"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Dropzone } from "@/components/landing/Dropzone";
import { PasteInput } from "@/components/landing/PasteInput";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Toast } from "@/components/ui/Toast";
import { LucideIcon } from "@/components/ui/Icon";
import { analyzeContract } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { SAMPLE_CONTRACT } from "@/lib/sampleContract";
import type { ToastData } from "@/lib/types";

type UploadTab = "file" | "paste";

export default function LandingPage() {
  const router = useRouter();
  const { setSession, addDebugLine } = useStore();

  const [tab, setTab] = useState<UploadTab>("file");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((t: ToastData) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fakeProgress = useCallback(() => {
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12 + 5;
      if (p >= 92) { clearInterval(interval); p = 92; }
      setProgress(Math.round(p));
    }, 300);
    return interval;
  }, []);

  const runAnalysis = useCallback(
    async (file?: File, text?: string) => {
      setIsLoading(true);
      const ticker = fakeProgress();
      addDebugLine("info", file ? `Uploading: ${file.name}` : "Analyzing pasted contract text…");

      try {
        const result = await analyzeContract(file, text);
        clearInterval(ticker);
        setProgress(100);

        setSession(result.session_id, result.risk_report);
        addDebugLine("agent", `Analysis complete — ${result.risk_report.risks.length} risks detected`);
        addDebugLine("tool", `risk.classify() → overall: ${result.risk_report.overall_risk}`);

        setTimeout(() => router.push("/dashboard"), 300);
      } catch (err: unknown) {
        clearInterval(ticker);
        setProgress(0);
        setIsLoading(false);

        const message =
          err instanceof Error ? err.message : "Analysis failed. Is the backend running?";
        addDebugLine("error", `Analysis failed: ${message}`);
        showToast({
          kind: "error",
          title: "Analysis failed",
          body: message,
        });
      }
    },
    [fakeProgress, setSession, addDebugLine, router, showToast],
  );

  const handleFile = useCallback(
    (file: File) => runAnalysis(file, undefined),
    [runAnalysis],
  );

  const handlePaste = useCallback(
    (text: string) => runAnalysis(undefined, text),
    [runAnalysis],
  );

  const handleSample = useCallback(
    () => runAnalysis(undefined, SAMPLE_CONTRACT),
    [runAnalysis],
  );

  return (
    <div className="app">
      <Nav />

      <main className="wrap landing">
        <div className="landing-hero">
          <span className="eyebrow fade-up" style={{ color: "var(--brand-blue)" }}>
            Contract-risk assistant
          </span>
          <h1 className="landing-title fade-up">
            Understand before you sign.
            <br />
            <span className="grad">Ask before you agree.</span>
          </h1>
          <p className="landing-sub fade-up">
            ProtectMe AI reads your rental, bank, subscription, or service agreement and shows you
            every risk — in plain language. Then you can ask questions before you commit.
          </p>
        </div>

        <div className="landing-upload fade-up">
          <div className="upload-tabs">
            <button
              className={`upload-tab ${tab === "file" ? "active" : ""}`}
              onClick={() => setTab("file")}
            >
              <LucideIcon name="upload-cloud" size={15} />
              Upload file
            </button>
            <button
              className={`upload-tab ${tab === "paste" ? "active" : ""}`}
              onClick={() => setTab("paste")}
            >
              <LucideIcon name="clipboard" size={15} />
              Paste text
            </button>
          </div>

          {tab === "file" ? (
            <Dropzone
              onFile={handleFile}
              onSample={handleSample}
              isLoading={isLoading}
              progress={progress}
            />
          ) : (
            <PasteInput onSubmit={handlePaste} isLoading={isLoading} />
          )}

          <div className="privacy-note">
            <LucideIcon name="lock" size={15} />
            <span>Your contract stays private. We analyze it to build your report and never sell your data.</span>
          </div>
        </div>

        <section className="landing-section">
          <h2 className="section-h">How it works</h2>
          <HowItWorks />
        </section>

        <Disclaimer style={{ margin: "8px 0 40px" }} />
      </main>

      <Toast toast={toast} />
    </div>
  );
}
