# Wonder Tinker Design System

## 1. Atmosphere & Identity

Wonder Tinker feels like a quiet technical notebook running on Catppuccin: precise, readable, low-glare, and ready for repeated publishing. The signature is a Mocha-first index page with Latte-compatible tokens, category-tree browsing, restrained metadata, and a small amount of machine-room detail for Web and AI notes.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/primary | --surface-primary | #EFF1F5 | #1E1E2E | Page background |
| Surface/secondary | --surface-secondary | #E6E9EF | #181825 | Article panels and header bands |
| Surface-muted | --surface-muted | #DCE0E8 | #313244 | Quiet metadata surfaces |
| Surface-raised | --surface-raised | #CCD0DA | #45475A | Selected tree rows and inset surfaces |
| Text/primary | --text-primary | #4C4F69 | #CDD6F4 | Headlines and body |
| Text/secondary | --text-secondary | #5C5F77 | #BAC2DE | Summaries and metadata |
| Text/tertiary | --text-tertiary | #6C6F85 | #A6ADC8 | Fine labels |
| Border/default | --border-default | #BCC0CC | #45475A | Panels and dividers |
| Border/subtle | --border-subtle | #CCD0DA | #313244 | Soft separations |
| Accent/primary | --accent-primary | #1E66F5 | #89B4FA | Links and focus |
| Accent/hover | --accent-hover | #8839EF | #CBA6F7 | Link hover |
| Accent/secondary | --accent-secondary | #7287FD | #B4BEFE | Secondary selected states |
| Status/info | --status-info | #DDE7F8 | #1F344F | Topic chips |
| Status/success | --status-success | #DDEED8 | #203C31 | Stable-state indicators |
| Status/warning | --status-warning | #F5E6C8 | #493A1F | Draft indicators |
| Status/error | --status-error | #F2D5CF | #4A2634 | Error states |

### Rules

- Catppuccin Mocha is the default public theme. Latte values exist as the documented light-mode counterpart.
- Accent color is reserved for links, focus rings, selected tree rows, and selected technical metadata.
- Large surfaces stay on Catppuccin base, mantle, crust, and surface tones; no decorative gradient fields.
- Any new color must be added here before use.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | 44px / 2.75rem | 650 | 1.08 | 0 | Site title on wide screens |
| H1 | 34–44px / `clamp(2.125rem, 1.75rem + 1.4vw, 2.75rem)` | 650 | 1.08 | 0 | Page and article title |
| H2 | 26px / 1.625rem | 620 | 1.25 | 0 | Section headers |
| H3 | 20px / 1.25rem | 620 | 1.35 | 0 | Article titles |
| Body/lg | 18px / 1.125rem | 400 | 1.65 | 0 | Lead copy |
| Body | 16px / 1rem | 400 | 1.65 | 0 | Default text |
| Body/sm | 14px / 0.875rem | 400 | 1.5 | 0 | Secondary information |
| Caption | 12px / 0.75rem | 560 | 1.4 | 0.04em | Labels and metadata |
| Overline | 11px / 0.6875rem | 650 | 1.3 | 0.08em | Section labels |

### Font Stack

- Primary: Atkinson Hyperlegible, Pretendard, Noto Sans KR, system-ui, sans-serif
- Display: Fraunces, Charter, Georgia, serif
- Mono: JetBrains Mono, SF Mono, Consolas, monospace
- Serif: Charter, Georgia, Times New Roman, serif

### Rules

- Body text never drops below 14px.
- Letter spacing stays non-negative.
- Display type is used only for page titles and the brand wordmark.
- Mono text is only for metadata, code-like labels, category tree counts, and timestamps.
- Korean headings, prose, cards, and navigation wrap at word boundaries with `word-break: keep-all`; long unspaced content may fall back to container-safe wrapping.
- Inline code keeps identifiers intact inside a bounded horizontal scroll area. Article tables stay within the content width, and key/command columns do not split tokens.
- `BaseLayout.astro` loads Atkinson Hyperlegible, Fraunces, JetBrains Mono, and Noto Sans KR through a single Google Fonts stylesheet with `display=swap`.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a base of 4px.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Tight inline spacing |
| --space-2 | 8px | Compact gaps |
| --space-3 | 12px | Metadata groups |
| --space-4 | 16px | Default padding |
| --space-5 | 20px | Comfortable controls |
| --space-6 | 24px | Panel padding |
| --space-8 | 32px | Section inner spacing |
| --space-10 | 40px | Major content gaps |
| --space-12 | 48px | Page rhythm |
| --space-16 | 64px | First-screen spacing |

### Grid

- Max content width: 1120px
- Column system: one column on mobile, 12-column grid from 900px
- Breakpoints: sm 640px, md 768px, lg 1024px, xl 1280px

### Rules

- Page sections use full-width bands with constrained inner content.
- Article lists are dense but scannable; avoid oversized marketing cards.
- Fixed UI elements keep stable dimensions through explicit min-height or aspect-ratio.

## 5. Components

### Article Row

- Structure: anchor or article wrapper with metadata, title, summary, and topic chips.
- Variants: featured, compact.
- Spacing: --space-4 to --space-6.
- States: default, hover, focus.
- Accessibility: visible focus ring; title remains the primary link target.
- Motion: hover changes color and translate only.

### Topic Chip

- Structure: inline text label.
- Variants: Web, AI, Notes.
- Spacing: --space-2 horizontal, --space-1 vertical.
- States: static in scaffold.
- Accessibility: text label does not rely on color alone.
- Motion: none.

### Category Tree

- Structure: `<nav>` landmark with a nested list navigation tree containing category anchors and nested post links.
- Variants: compact sticky sidebar on desktop, full-width menu on mobile.
- Spacing: --space-3 to --space-5.
- States: default, hover, focus, current section target.
- Accessibility: visible focus ring; category counts are textual; post links remain normal anchors.
- Motion: hover changes color and translate only.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 120ms | ease-out | Link hover and button press |
| Standard | 220ms | ease-in-out | Panel hover |
| Emphasis | 420ms | cubic-bezier(0.16, 1, 0.3, 1) | Initial content reveal |

### Rules

- Animate only transform and opacity.
- Every interactive element has hover and focus states.
- Respect prefers-reduced-motion by disabling non-essential animation.

## 7. Depth & Surface

### Strategy

Use borders-only.

| Type | Value | Usage |
|------|-------|-------|
| Default | 1px solid var(--border-default) | Panels and article rows |
| Subtle | 1px solid var(--border-subtle) | Dividers and secondary blocks |

No box-shadow is used in the scaffold.
