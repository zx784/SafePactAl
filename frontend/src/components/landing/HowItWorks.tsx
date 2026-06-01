"use client";
import { LucideIcon } from "@/components/ui/Icon";

const STEPS = [
  {
    icon: "upload-cloud",
    title: "Upload your contract",
    body: "Drop in a PDF or text file. Nothing is shared without your say-so.",
  },
  {
    icon: "list-checks",
    title: "Review every risk",
    body: "See all detected risks, sorted by severity, explained in plain language.",
  },
  {
    icon: "mic",
    title: "Ask before you agree",
    body: "Generate a message or talk to your agent about anything you've read.",
  },
];

export function HowItWorks() {
  return (
    <div className="how">
      {STEPS.map((s, i) => (
        <div className="how-card" key={i}>
          <div className="how-num">{i + 1}</div>
          <div className="how-ic">
            <LucideIcon name={s.icon} size={20} />
          </div>
          <h4>{s.title}</h4>
          <p>{s.body}</p>
        </div>
      ))}
    </div>
  );
}
