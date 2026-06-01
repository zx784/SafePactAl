# ProtectMe AI — Design System

> **Understand before you sign. Ask before you agree.**

ProtectMe AI is an AI-powered **contract-risk assistant**. A user uploads a contract
(rental, bank, subscription, service agreement), receives a structured **risk report**,
reviews every detected risk in a **dashboard**, generates clarification / negotiation
messages from specific clauses, and can optionally talk to a **real-time streaming voice
agent** for follow-up questions before signing.

**It is not a lawyer.** It is a contract-risk dashboard + voice agent that gives everyday,
non-expert people clarity and confidence quickly. The tone is **trustworthy, calm, and
clear — never alarmist, never legalese.**

This repository is a from-scratch design system generated from a written product brief
(no prior codebase or Figma). It is the single source of truth for building ProtectMe AI
interfaces in **React / Next.js + Tailwind CSS**.

---

## Design principles

1. **Show all risks, never hide them.** Always render every detected risk, sorted
   High → Medium → Low. Never "Top 3". Trust comes from completeness.
2. **Severity is color + label + icon — never color alone.** Every severity carries a
   word ("High"), a hue (red/amber/green), and an icon. Color-blind safe by construction.
3. **Calm, not alarmist.** Red means "read this carefully," not "panic." Plain, reassuring
   language everywhere. We explain; we never scare.
4. **We are a guide, not a lawyer.** Never claim legal authority. A persistent disclaimer
   is always one glance away. Suggested actions are framed as questions to ask, not verdicts.
5. **Clarity over density.** Generous whitespace, one idea per surface, progressive
   disclosure (collapsed → expanded). The interface should feel lighter than the contract.
6. **Voice is optional, never required.** Message generation and the full report work
   without ever starting a call. The agent augments; it never gates.
7. **Always explain the machine.** Voice/agent state is always visible and named
   (Listening, Thinking, Speaking…). The optional debug terminal makes the AI legible to
   power users. No silent black boxes.

---

## Brand voice — content fundamentals

**Person & address.** Second person, warm and direct. "**You**" (the reader) and "**we**"
(ProtectMe, sparingly). "Here's what we found." "You may want to ask about this clause."

**Tone.** Calm, plain-spoken, reassuring, competent. Like a knowledgeable friend who has
read a thousand contracts and is on your side. Never breathless, never legalese, never
condescending.

**Casing.** Sentence case everywhere — headings, buttons, labels. ("Upload contract", not
"Upload Contract".) Reserve Title Case for proper nouns and the product name.

**Severity language.** Always pair the level word with a plain explanation:
- ✅ "**High** — this clause could cost you money unexpectedly."
- ❌ "CRITICAL RISK DETECTED ⚠️" / "DANGER"

**Do say:** "worth a closer look", "you may want to ask", "this is common, but…",
"here's what it means in plain terms", "consider asking the other party to…"
**Don't say:** "illegal", "you must", "guaranteed", "lawsuit", "violation", "DANGER",
"act now", or anything that implies a legal ruling.

**Example microcopy**
- Hero: "Understand before you sign. Ask before you agree."
- Upload: "Drop your contract here — PDF or text. We'll read every clause for you."
- Empty report: "No contract yet. Upload one and we'll walk you through the risks."
- Disclaimer: "ProtectMe AI helps you understand contracts. It does not replace a lawyer
  or provide legal advice."
- Agent idle: "Tap to ask about anything you've read."

**Emoji.** Not used in product UI. Severity and status are communicated with the icon
system, not emoji. (Emoji are acceptable only in casual marketing channels, never in-app.)

**Numbers & stats.** Show counts that help a decision (risks found, by severity). Avoid
vanity metrics and decorative data. One thousand no's for every yes.

---

## Visual foundations

**Overall mood.** Clean modern SaaS, professional but quietly futuristic. Calm trust +
intelligent automation. Lots of breathing room. The dark navy canvas reads as "secure and
serious"; the floating white cards read as "clear and human."

**Color.**
- **Base theme is dark** — a deep navy/blue canvas (`--navy-900 #0B1124`) with subtly
  raised navy sections.
- **Surfaces are white cards** floating on that canvas with soft, navy-tinted shadows.
  Most reading happens on white; the dark frames it.
- **Brand gradient** (blue `#4D7CFE` → indigo `#6366F1` → violet `#8B5CF6`) is used
  **sparingly**: the primary button, the hero accent, and the voice visualizer. Never as a
  full-card background, never behind body text.
- **Severity is the workhorse palette:** red (high), amber (medium), green (low), each with
  a solid, a soft badge background, a border, and an AA-contrast text color.

**Type.** `Plus Jakarta Sans` for all UI — a friendly geometric grotesk that feels modern
and trustworthy without being cold. `JetBrains Mono` for the debug terminal and clause
code. Tight letter-spacing on large headings (`-0.02em`); relaxed `1.6` line-height on body
for comfortable reading of explanations.

**Spacing & layout.** 4px base scale. Generous padding inside cards (24–32px). Content
column caps at ~760px for readable explanation text; app shell caps at 1200px. Mobile-first;
the report is a single scroll column on mobile, a framed center column on desktop.

**Backgrounds.** Flat navy with one soft radial glow at the top of the hero
(`--gradient-hero`). No busy textures, no stock photography, no full-bleed imagery behind
content. The only "imagery" is the animated voice circle. Restraint is the brand.

**Corner radii.** Generously rounded. Cards `24px` (`--radius-xl`), large panels/hero
`32px`, pills & badges fully round (`999px`), inputs/buttons `14px`. Soft and friendly, never
sharp.

**Cards.** White (`#FFFFFF`), `24px` radius, `--shadow-card` (soft, diffuse, navy-tinted),
a 1px near-transparent border (`--border-card`) for definition on light regions. Inset wells
(original clause text) use `--surface-card-soft #F7F9FC` with `--radius-md`.

**Borders.** Hairline `1px` by default; `1.5px` for emphasis (selected card, focus). On the
dark canvas, borders are `rgba(255,255,255,0.10)`; on white cards, `rgba(14,23,48,0.08)`.

**Shadows / elevation.** Soft and low-contrast, always navy-tinted (`rgba(8,14,32,…)`),
never neutral grey or black. Five steps (`xs`→`xl`) plus a dedicated `--shadow-card`. Two
**glows** (`--glow-brand`, `--glow-voice`) are reserved for the primary CTA and the voice
circle only.

**Transparency & blur.** Used only for overlays: the modal/sheet scrim
(`--surface-overlay`) and the glass header/sheet (`--surface-glass` with `backdrop-filter:
blur(20px)`). Never blur behind body content.

**Animation.** Smooth, subtle, purposeful. Standard easing `cubic-bezier(0.2,0.8,0.2,1)`;
entrances decelerate (`--ease-entrance`); a gentle spring (`--ease-spring`) for the voice
circle only. Hover = subtle lift (`translateY(-1px)`) + shadow step-up + slight brightness.
Press = settle back to `translateY(0)` + `scale(0.98)`. Durations 140–320ms. The signature
motion is the **voice pulse** — concentric rings expanding from the agent circle. All looping
motion respects `prefers-reduced-motion`.

**Hover / press states.**
- Buttons: hover lifts 1px + deepens color; active presses to `scale(0.98)`.
- Cards: hover raises shadow `card → lg` and lifts 1px; the whole collapsed risk card is the
  click target to expand.
- Ghost/secondary: hover fills with a faint brand/neutral tint, no lift.

---

## Iconography

**System: [Lucide](https://lucide.dev)** — a clean, consistent `1.75px` stroke, rounded
line-cap icon set that matches the friendly-geometric type and rounded shape language. It is
CDN-available and tree-shakeable in React (`lucide-react`). *(Substitution note: there is no
prior brand icon set; Lucide is chosen as the closest fit for the calm-modern-SaaS direction.
Swap freely if a house set arrives.)*

**Usage rules.**
- Stroke icons only, `1.75px`, `20px` or `24px` box. Match icon color to adjacent text color
  (currentColor), except inside severity badges where the icon takes the severity text color.
- **Severity icons (fixed mapping):** High = `shield-alert` / `alert-triangle`,
  Medium = `alert-circle`, Low = `check-circle` / `info`. These never change — severity is
  always color **+** icon **+** label.
- **Voice state icons:** Idle = `mic`, Listening = `mic` (animated), Thinking = `loader`/
  `sparkles`, Speaking = `audio-lines`, Tool running = `wrench`/`terminal`, Draft ready =
  `file-check`, Call ended = `phone-off`, Error = `alert-octagon`.
- **Common UI:** upload = `upload-cloud`, search = `search`, copy = `copy`, regenerate =
  `refresh-cw`, send = `send`, mute = `mic-off`, end call = `phone-off`, expand = `chevron-down`,
  filter = `sliders-horizontal`, info/disclaimer = `info`, privacy = `lock`/`shield-check`.
- **No emoji** as icons. **No unicode glyphs** as icons. **No hand-drawn one-off SVGs** — use
  the Lucide set so weight and metrics stay consistent.

In React: `import { ShieldAlert, Mic, Copy } from "lucide-react";`
On a plain HTML page: load `https://unpkg.com/lucide@latest` and call `lucide.createIcons()`.

---

## Index — what's in this system

| File | What it is |
|---|---|
| `tokens.css` | **Single source of truth.** All design tokens as CSS custom properties (color, type, spacing, radii, shadow, motion, z-index, breakpoints) + dark/light theme mapping. |
| `colors_and_type.css` | Font imports (Plus Jakarta Sans + JetBrains Mono) and semantic typography + color helper classes (`.ds-h1`, `.ds-body`, `.fg-muted`…). |
| `tailwind.config.js` | The same tokens as a Tailwind `theme.extend` block (`protectmeTheme`). |
| `preview/` | Design-system specimen cards (colors, type, spacing, components) shown in the Design System tab. |
| `ui_kits/protectme-ai/` | High-fidelity, interactive recreation of the product: Landing/Upload → Risk Dashboard → Voice Agent. `index.html` is the runnable prototype. |
| `SKILL.md` | Makes this system usable as a downloadable Agent Skill. |

**Quick start for engineers**
1. Load `tokens.css` then `colors_and_type.css` (order matters).
2. Spread `protectmeTheme` into your Tailwind config's `theme.extend`.
3. Build components against tokens — never hard-code hex. Severity mapping
   (High=red / Medium=amber / Low=green) is fixed everywhere.
4. See `ui_kits/protectme-ai/` for the canonical component anatomy and screen layouts.
5. Follow the **Implementation checklist** at the bottom of
   `ui_kits/protectme-ai/README.md`.
