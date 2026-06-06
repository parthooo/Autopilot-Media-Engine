# Design — Autopilot Media Engine

Locked design system for the dashboard (`apps/web`). Every page reads this file before emitting UI.

## Genre

modern-minimal · tone: utilitarian

## Macrostructure family

- **App pages (dashboard):** Workbench — sidebar index, stat strip on overview, table-led data views, controls in secondary column. No hero, no enrichment.
- **Detail pages:** Workbench detail — score block + stacked data panels, back navigation inline.

## Theme

- `--color-paper` oklch(16% 0.012 250)
- `--color-paper-2` oklch(20% 0.012 250)
- `--color-paper-3` oklch(24% 0.014 250)
- `--color-ink` oklch(91% 0.008 250)
- `--color-ink-2` oklch(62% 0.015 250)
- `--color-rule` oklch(32% 0.018 250)
- `--color-accent` oklch(69% 0.18 254)
- `--color-accent-ink` oklch(16% 0.012 250)
- `--color-focus` oklch(73% 0.19 254)

## Typography

- Display: Space Grotesk, weight 600, style normal
- Body: IBM Plex Sans, weight 400–500
- Mono: JetBrains Mono, weight 400–500
- Headings: roman only, no italic display

## Spacing

4-point named scale in `apps/web/tokens.css`. Pages use `var(--space-*)` only.

## Motion

- Easings: `--ease-out` cubic-bezier(0.16, 1, 0.3, 1)
- Reveal: none — content is present on load
- Reduced-motion: opacity-only, ≤ 150 ms

## Microinteractions stance

- Silent success for inline pipeline feedback
- Hover delay on tooltips: 800 ms · focus delay: 0 ms
- No celebratory toasts

## CTA voice

- Primary: filled accent, 6 px radius, short verb labels
- Secondary: hairline border, same radius

## Per-page allowances

- App pages MUST NOT use enrichment
- Overview MAY use two-column workbench grid (stats + table primary, controls secondary)

## What pages MUST share

- Sidebar wordmark, accent colour, font pairing, button shape, table scroll pattern

## What pages MAY differ on

- Overview stat strip + grid vs single-panel list views
- Detail pages add score hero block

## Exports

See `apps/web/tokens.css` for the canonical token block.
