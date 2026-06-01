---
name: protectme-ai-design
description: Use this skill to generate well-branded interfaces and assets for ProtectMe AI (an AI contract-risk assistant), either for production or throwaway prototypes/mocks. Contains design principles, tokens (color/type/spacing/motion), the severity system, fonts, iconography, and an interactive UI kit.
user-invocable: true
---

# ProtectMe AI design skill

Read `README.md` first — it covers product context, content/voice, visual foundations,
and iconography. Then explore the other files.

## What's here
- `tokens.css` — **single source of truth** for all design tokens (CSS custom properties).
- `colors_and_type.css` — font imports + semantic type/color classes.
- `tailwind.config.js` — the same tokens as a Tailwind `theme.extend` (`protectmeTheme`).
- `preview/` — design-system specimen cards (colors, type, spacing, components).
- `ui_kits/protectme-ai/` — the interactive product recreation (start at `index.html`).

## How to use it
- **Visual artifacts** (slides, mocks, throwaway prototypes): copy `tokens.css` +
  `colors_and_type.css` into your output folder, build static HTML against the tokens,
  and reuse the component patterns from `ui_kits/protectme-ai/`.
- **Production code**: spread `protectmeTheme` into Tailwind and follow the
  *Implementation checklist* in `ui_kits/protectme-ai/README.md`.

## Non-negotiables
- Severity mapping is fixed everywhere: **High = red, Medium = amber, Low = green**, and is
  always expressed as **color + icon + label**, never color alone.
- Run dark (navy canvas); read on white cards. Brand gradient only on primary CTA, hero,
  and the voice circle.
- Tone is calm, plain, reassuring. Never alarmist, never legalese, never "you need a lawyer"
  framing — but always keep the persistent disclaimer visible.
- Tokens are the source of truth; never hard-code hex.
- Icons: Lucide (1.75px stroke). No emoji, no one-off hand-drawn SVG icons.

If invoked with no guidance, ask what the user wants to build, ask a few clarifying
questions, then act as an expert designer producing HTML artifacts or production code.
