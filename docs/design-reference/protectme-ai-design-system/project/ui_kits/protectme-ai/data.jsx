/* ProtectMe AI — sample contract risk data (rental lease) */
const CONTRACT = {
  type: "Rental lease",
  name: "Maple Street Apartment — 12-month lease",
  pages: 14,
  overall: "high",
  recommendation: "Ask 3 questions before signing",
};

const RISKS = [
  {
    id: "r1",
    severity: "high",
    title: "Automatic renewal & price increase",
    section: "§7.2 · Term & renewal",
    preview: "The lease renews on its own and the rent can rise after the first year.",
    clause:
      "Upon expiry of the Initial Term, this Agreement shall automatically renew for successive twelve (12) month periods unless either party provides written notice of non-renewal no less than sixty (60) days prior to the end of the then-current term. The Landlord may adjust the monthly rent for any renewal term at its sole discretion.",
    explanation:
      "If you do nothing, the lease keeps renewing for another year — and the landlord can raise the rent each time, by any amount.",
    matters:
      "You could be locked into another full year, at a higher price, just by missing a deadline.",
    question:
      "Can we cap how much the rent can increase at renewal, and shorten the notice window to 30 days?",
    action: "Ask to add a rent-increase cap (e.g. 5%) and a shorter cancellation notice.",
  },
  {
    id: "r2",
    severity: "high",
    title: "Broad deduction from your deposit",
    section: "§11.4 · Security deposit",
    preview: "The landlord can keep parts of your deposit for vaguely-defined reasons.",
    clause:
      "The Landlord may retain all or any portion of the Security Deposit to remedy any default by Tenant, including but not limited to cleaning, repairs, repainting, and 'general wear' as determined by the Landlord, without itemized accounting.",
    explanation:
      "The landlord can take money from your deposit for things like 'general wear' and doesn't have to show you an itemized list of what it was spent on.",
    matters:
      "Without an itemized breakdown, it's hard to know if deductions are fair or to dispute them.",
    question:
      "Will you provide an itemized, written breakdown of any deposit deductions within 14 days of move-out?",
    action: "Request a written, itemized deposit return with photos at move-in and move-out.",
  },
  {
    id: "r3",
    severity: "high",
    title: "You waive the right to dispute in court",
    section: "§19.1 · Dispute resolution",
    preview: "Disagreements must go to binding arbitration — not a court.",
    clause:
      "Any dispute arising under this Agreement shall be resolved exclusively by binding arbitration administered under the rules of the designated provider, and the parties waive any right to a trial by jury or to participate in a class action.",
    explanation:
      "If something goes wrong, you can't take it to a normal court — you'd have to use a private arbitrator, and you give up the right to a jury.",
    matters:
      "Arbitration can be costly and the outcome is final, with very limited ability to appeal.",
    question:
      "Can we keep the option to resolve smaller disputes in small-claims court?",
    action: "Ask to carve out small-claims court as an option for disputes under a set amount.",
  },
  {
    id: "r4",
    severity: "medium",
    title: "Landlord entry with short notice",
    section: "§9.1 · Access",
    preview: "The landlord can enter with relatively short notice.",
    clause:
      "The Landlord and its agents may enter the Premises upon twenty-four (24) hours notice for inspection, maintenance, or to show the unit to prospective tenants or purchasers.",
    explanation:
      "The landlord can come into your home with 24 hours' notice — including to show it to other people.",
    matters: "Frequent showings near the end of your lease can affect your privacy.",
    question: "Can we agree on reasonable hours and a limit on how often showings happen per week?",
    action: "Ask to set showing hours and a weekly cap, with notice by message.",
  },
  {
    id: "r5",
    severity: "medium",
    title: "You pay for some repairs",
    section: "§8.3 · Maintenance",
    preview: "Certain repair costs are passed to you, the tenant.",
    clause:
      "Tenant shall be responsible for the cost of repairs to fixtures, appliances, and plumbing where the need for repair arises from Tenant's use, up to a maximum of $250 per incident.",
    explanation:
      "If something breaks during normal use, you may have to pay up to $250 per repair.",
    matters: "Repair costs can add up, and 'arising from your use' can be interpreted broadly.",
    question: "Can we clarify that normal wear and manufacturer faults are not the tenant's cost?",
    action: "Ask to exclude normal wear-and-tear and appliance faults from tenant-paid repairs.",
  },
  {
    id: "r6",
    severity: "medium",
    title: "Late fee starts quickly",
    section: "§4.2 · Rent",
    preview: "A late fee applies soon after the due date.",
    clause:
      "Rent is due on the first day of each month. A late fee of $75 shall apply if rent is not received by the third (3rd) day of the month, with an additional $10 per day thereafter.",
    explanation:
      "If rent is even a few days late, you owe $75 — plus $10 for every extra day.",
    matters: "A short grace period means a small delay becomes an expensive one.",
    question: "Can we extend the grace period to 5 days and cap the daily late charge?",
    action: "Ask for a 5-day grace period and a reasonable cap on cumulative late fees.",
  },
  {
    id: "r7",
    severity: "low",
    title: "Governing law",
    section: "§18.0 · General",
    preview: "Sets which region's law applies. Standard.",
    clause:
      "This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Premises is located.",
    explanation: "This just says local law applies to the lease. This is normal and expected.",
    matters: "Generally fine — it's the most common and fair choice.",
    question: "No action needed, but you can confirm the jurisdiction matches where you live.",
    action: "No action needed — standard clause.",
  },
  {
    id: "r8",
    severity: "low",
    title: "Quiet enjoyment guarantee",
    section: "§6.0 · Tenant rights",
    preview: "Protects your right to peaceful use of the home.",
    clause:
      "Tenant shall be entitled to quiet enjoyment of the Premises throughout the Term, subject to the terms of this Agreement.",
    explanation:
      "This is in your favor — it protects your right to live peacefully without unreasonable interference.",
    matters: "A good clause to have; it supports your privacy and comfort.",
    question: "No action needed — this protects you.",
    action: "No action needed — favorable clause.",
  },
];

const SEVERITY = {
  high:   { label: "High",   icon: "shield-alert",  order: 0 },
  medium: { label: "Medium", icon: "alert-circle",  order: 1 },
  low:    { label: "Low",    icon: "check-circle",   order: 2 },
};

const COUNTS = {
  total: RISKS.length,
  high: RISKS.filter(r => r.severity === "high").length,
  medium: RISKS.filter(r => r.severity === "medium").length,
  low: RISKS.filter(r => r.severity === "low").length,
};

Object.assign(window, { CONTRACT, RISKS, SEVERITY, COUNTS });
