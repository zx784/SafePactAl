"use client";
import { useState, useRef, useCallback } from "react";
import { LucideIcon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

type DropzoneState = "idle" | "uploading" | "error";

interface DropzoneProps {
  onFile: (file: File) => void;
  onSample: () => void;
  isLoading: boolean;
  progress: number;
}

const ACCEPTED = /\.(pdf|txt)$/i;

export function Dropzone({ onFile, onSample, isLoading, progress }: DropzoneProps) {
  const [drag, setDrag] = useState(false);
  const [state, setState] = useState<DropzoneState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!ACCEPTED.test(file.name)) {
        setState("error");
        return;
      }
      setState("uploading");
      onFile(file);
    },
    [onFile],
  );

  const dzState = isLoading ? "uploading" : state;

  return (
    <div
      className={`dropzone ${drag ? "is-drag" : ""} ${dzState === "error" ? "is-error" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
      role="button"
      tabIndex={0}
      aria-label="Upload contract file"
      onClick={() => { if (dzState !== "uploading") inputRef.current?.click(); }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {dzState === "uploading" ? (
        <div className="dz-inner">
          <div className="dz-ic dz-ic-busy">
            <LucideIcon name="loader" size={26} />
          </div>
          <h3 className="dz-title">Reading every clause…</h3>
          <p className="dz-sub">Analyzing your contract with AI</p>
          <div className="dz-progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="dz-sub" style={{ marginTop: 8 }}>{progress}%</p>
        </div>
      ) : dzState === "error" ? (
        <div className="dz-inner">
          <div className="dz-ic dz-ic-error">
            <LucideIcon name="file-x" size={26} />
          </div>
          <h3 className="dz-title">That file type isn&apos;t supported</h3>
          <p className="dz-sub">Please upload a PDF or plain text (.txt) file.</p>
          <Button
            variant="secondary"
            size="sm"
            style={{ marginTop: 14 }}
            onClick={(e) => { e.stopPropagation(); setState("idle"); }}
          >
            Try again
          </Button>
        </div>
      ) : (
        <div className="dz-inner">
          <div className="dz-ic">
            <LucideIcon name="upload-cloud" size={28} />
          </div>
          <h3 className="dz-title">Drop your contract here</h3>
          <p className="dz-sub">PDF or plain text — we&apos;ll read every clause for you.</p>
          <Button
            variant="primary"
            style={{ marginTop: 18 }}
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            <LucideIcon name="upload-cloud" size={17} />
            Upload contract
          </Button>
          <button
            className="dz-sample"
            onClick={(e) => { e.stopPropagation(); onSample(); }}
          >
            or try a sample lease
          </button>
        </div>
      )}
    </div>
  );
}
