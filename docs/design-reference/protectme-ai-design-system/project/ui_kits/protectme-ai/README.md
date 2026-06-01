# ProtectMe AI — UI Kit

A high-fidelity, interactive recreation of the ProtectMe AI product, built on the
design-system tokens. Open **`index.html`** to run the full flow:

**Landing / Upload → Risk Report Dashboard → Message Generator → Voice Agent**

> This kit is a cosmetic, click-through prototype — real-ish interactions, fake data.
> It exists to show how the tokens and components compose into screens.

## Files
| File | Role |
|---|---|
| `index.html` | Entry point. Loads React + Babel + Lucide, then the scripts below in order. |
| `app.css` | Component styles beyond tokens (buttons, pills, cards, nav, disclaimer). |
| `screens.css` | Screen & layout styles (landing, dashboard, risk card, panels, voice). |
| `data.jsx` | Sample contract + 8 risks (3 high · 3 medium · 2 low) + severity map. |
| `ui.jsx` | Primitives: `Icon` (Lucide-in-React), `Button`, `IconButton`, `SeverityBadge`, `VoiceDot`. |
| `Landing.jsx` | Screen 1 — hero, dropzone (drag/upload/error/progress), how-it-works. |
| `RiskCard.jsx` | Collapsed ↔ expanded risk card with the 7-part anatomy. |
| `Dashboard.jsx` | Screen 2 — stats, filter tabs, search, risk list, sticky action bar, debug terminal. |
| `MessagePanel.jsx` | Message generator (type / tone / format / draft / tweaks). |
| `VoicePanel.jsx` | Voice agent — animated circle, scripted call states, transcript, controls. |
| `App.jsx` | State machine: screen routing, panel open/close, selection, terminal log, toasts. |

> **Babel scope note:** each `text/babel` script compiles in its own scope, so every
> component file ends with `Object.assign(window, { … })` to share globals. React hooks
> (`useState`, etc.) are exposed once as globals in `index.html`.

---

## Component anatomy (the important ones)

### Risk Card (`RiskCard.jsx`)
- **Purpose:** present one detected risk; collapse for scanning, expand for detail.
- **Collapsed:** severity badge (color + icon + label) · title · one-line preview · section ref · chevron. The whole header is the expand target (`<button aria-expanded>`).
- **Expanded adds:** Original clause (mono inset well) → In plain terms → Why it matters → Question to ask → Suggested action → actions **[Ask agent] [Generate message] [Select]**.
- **States:** default · hover (shadow `sm→md`) · expanded · **selected** (brand ring + check). Left border encodes severity (`--risk-*`).
- **Tokens:** `--risk-*`, `--surface-card`, `--surface-card-soft`, `--radius-lg/md`, `--shadow-sm/md`, `--brand-soft*`.

### Voice Agent (`VoicePanel.jsx`)
- **Anatomy:** header (status, minimize) → **voice circle** (animated) → status label + dot → tool-output chip → transcript (user/agent bubbles, `aria-live`) → controls **[Mute][End call][Text instead]**.
- **States (color + icon + animation):** Idle, Listening (rings pulse), Thinking, Tool running, Speaking (rings pulse), Draft ready, Call ended, Error — see `VOICE_STATES`.
- **Tokens:** `--voice-*`, `--gradient-voice`, `--glow-voice`.

### Message Generator (`MessagePanel.jsx`)
- **Controls:** type (Clarification / Negotiation / Rejection / Amendment) · tone (Polite / Firm / Professional) · format (Email / WhatsApp) · editable draft · tweaks **[Regenerate][Make shorter][More formal]** · **[Copy message]**.
- Desktop = right side panel; mobile = bottom sheet (same component, responsive CSS).

---

## Layout & screens

**Screen 1 — Landing / Upload.** Centered hero column (max `760px`), floating white
dropzone card (max `640px`) with drag-over / uploading / error states, privacy note,
3-up "how it works", persistent disclaimer. Canvas = navy with a soft top radial glow.

**Screen 2 — Risk Dashboard.** Content column max `920px`. Report header → 4-up summary
stats (→ 2-up < 980px → 1–2-up < 520px) → filter tabs + search → risk list (sorted
**High → Medium → Low**) → **sticky action bar** with the collapsible debug terminal and
**[Generate message][Call your agent]**.

**In-call layout.** Desktop ≥ 980px: report left, voice/message panel right (`1fr 420px`
grid). Mobile < 980px: panel becomes a **bottom sheet** over a scrim; the report stays
mounted underneath. (Glass blur on nav/action bar is dropped while a sheet is open to
avoid a Chromium backdrop-filter compositing bug.)

## Interaction & motion
- **Voice pulse:** concentric rings expand+fade from the circle while *listening*/*speaking*; the core gently *breathes* always. Color cross-fades on state change. Honors `prefers-reduced-motion`.
- **Card expand/collapse:** chevron rotates 180°; body rises in (`fadeUp`, transform-only so it's never hidden if paused).
- **Panel / sheet:** desktop slides in from the right; mobile rises as a sheet over a scrim.
- **Streaming transcript:** bubbles append and auto-scroll; tool chip flips *running → done*.
- **Tool → draft:** amber tool chip resolves to a green "Draft ready" card.

## Accessibility
- Severity is **always** color + icon + label — never color alone.
- All severity/state text colors meet **WCAG AA** on their soft backgrounds (see tokens).
- Focus-visible rings via `--shadow-focus`; tab targets ≥ 44px on mobile.
- Filter tabs are `role="tablist"`/`tab` with `aria-selected`; risk headers are buttons with `aria-expanded`; transcript & voice status use `aria-live="polite"`.
- Reduced-motion: entrance + pulse animations collapse; content stays fully visible.

## Do / Don't
- **DO** show *all* detected risks sorted by severity. **DON'T** show only a "Top 3".
- **DO** keep message generation available without a voice call. **DON'T** gate it behind the agent.
- **DO** keep language plain and reassuring. **DON'T** use scary/legal-sounding copy or claim to be a lawyer.
- **DO** use the brand gradient sparingly (primary CTA, hero, voice circle). **DON'T** put it behind body text or full cards.

---

## Implementation checklist (for an engineer)
1. Load `tokens.css` → `colors_and_type.css`; spread `protectmeTheme` into Tailwind `theme.extend`.
2. Run the app **dark** (navy canvas); compose reading surfaces as **white cards** with `--shadow-card`.
3. Build the **severity map once** (`High=red / Medium=amber / Low=green`) and reuse it for badges, card borders, filter dots, and stats. Never hard-code hex.
4. Severity & voice status = **color + icon + label** everywhere. Wire `aria-live` for transcript + status.
5. Render **all** risks, sorted `High→Medium→Low`. Sticky action bar drives *Generate message* / *Call your agent*; debug terminal is collapsible.
6. Message generation works standalone (no call required). Voice panel is desktop side-panel / mobile bottom-sheet.
7. Keep the brand gradient to primary CTA, hero, and the voice circle. Everything else is navy + white + severity.
8. Ship the **persistent disclaimer** ("does not replace a lawyer…") on every screen.
9. Respect `prefers-reduced-motion`; keep entrance animations transform-only so content is never hidden.
10. Verify AA contrast and 44px mobile targets before release.
