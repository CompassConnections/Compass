# Frontend Design Guidelines

Purpose: this project's frontend must look deliberately designed, not generated. These rules exist because AI-written
UIs cluster around a small set of recognizable defaults. Follow the tokens below, and actively avoid the anti-patterns
section — that list is the actual "vibe coded" tell, more than any specific color choice.

Stack: React + Tailwind. Motion: noticeable, but orchestrated, not scattered.

---

## 1. Design tokens

Colors are CSS custom properties (RGB triplets) defined in [`web/styles/globals.css`](../web/styles/globals.css), once
in `:root` and again in `.dark`, and exposed as Tailwind colors in [`web/tailwind.config.js`](../web/tailwind.config.js)
(`theme.extend.colors`). Use the tokens (`bg-canvas-50`, `text-ink-900`, `bg-cta`) — never hardcode hex values, and
never use raw Tailwind defaults (`slate-900`, `red-600`, etc.) for brand-relevant elements. The theme switches with the
`.dark` class, so each token resolves to a different value per theme. The `ink`, `primary`, `green`, `yellow` and `red`
ramps **invert** in dark mode: a higher number always means "more contrast with the page", not "darker".

### Current palette

The palette is warm and earthy on purpose: cream and tan surfaces, amber brand accent, sage green, deep warm-black
text, espresso-brown sidebar. Keep to it. Don't swap in cooler or "cleaner" colors.

🚩 = flagged: poor contrast (below WCAG AA, or below the 7:1 body-text target) or a broken/inconsistent value. The
usage limit in the Status column is a rule, not a suggestion. Light-mode values are shown; dark-mode values live under
`.dark` in `globals.css`.

| Token                                                | Light hex                       | Role                                                                                                                                                             | Status                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `canvas-100`                                         | `#EDE8E0`                       | Page background (warm beige)                                                                                                                                     | OK                                                                                                                                                                                                                                                                                                                                                         |
| `canvas-50`                                          | `#F7F4EF`                       | Cards / elevated surfaces (cream white)                                                                                                                          | OK                                                                                                                                                                                                                                                                                                                                                         |
| `canvas-200`, `canvas-300`                           | `#E8D5BC`, `#DECBB2`            | Tags, chips, borders (light tan)                                                                                                                                 | OK                                                                                                                                                                                                                                                                                                                                                         |
| `canvas-900`, `canvas-950`                           | `#443422`, `#2C2416`            | Sidebar pressed / sidebar (dark espresso)                                                                                                                        | OK                                                                                                                                                                                                                                                                                                                                                         |
| `canvas-0`                                           | `#FFFFFF`                       | Pure white surface                                                                                                                                               | OK                                                                                                                                                                                                                                                                                                                                                         |
| `primary-500`                                        | `#C17F3E`                       | Brand accent: fills, borders, focus rings (amber)                                                                                                                | 🚩 3.0:1 on `canvas-50`, 2.7:1 on `canvas-100`: fails AA as text. Never `text-primary-300`…`600` on light surfaces (ESLint `no-restricted-syntax` enforces it); use `text-primary-700`+. Exception: always-dark surfaces (sidebar rail, `bg-canvas-950` panels), where the lighter steps are the legible ones; disable the rule on that line with a reason |
| `primary-700`                                        | `#855022`                       | Amber for text, links and icons (terracotta brown); 6.0:1 on `canvas-50`, 5.4:1 on `canvas-100`, ≈ 8:1 in dark mode where the ramp inverts. Hover: `primary-800` | OK                                                                                                                                                                                                                                                                                                                                                         |
| `primary-50` … `primary-950`                         | `#FAF3E9` … `#2B1508`           | Amber ramp: tinted backgrounds, chat bubbles                                                                                                                     | OK                                                                                                                                                                                                                                                                                                                                                         |
| `cta`, `cta-hover`, `cta-deep`                       | `#A6682E`, `#855022`, `#653A18` | Solid button fill; white label at 4.52:1 / 6.29:1 / ~9:1; same value in both themes                                                                              | OK. Use `bg-cta text-white`, never `bg-primary-500 text-white` (3.30:1)                                                                                                                                                                                                                                                                                    |
| `ink-900`                                            | `#1E1A14`                       | Primary text (deep warm black), 15.8:1 on `canvas-50`                                                                                                            | OK                                                                                                                                                                                                                                                                                                                                                         |
| `ink-800`                                            | `#3E362C`                       | Strong secondary text, 10.8:1 on `canvas-50`                                                                                                                     | OK                                                                                                                                                                                                                                                                                                                                                         |
| `ink-600`                                            | `#6E6252`                       | Body / secondary text, 4.88:1 on `canvas-100`                                                                                                                    | 🚩 Passes AA but misses the 7:1 body-text target below. Use `ink-800` for running text; keep `ink-600` for secondary text                                                                                                                                                                                                                                  |
| `ink-500`                                            | `#8C8070`                       | Muted text (warm gray), 3.2:1 on `canvas-100`                                                                                                                    | 🚩 Fails AA. Decoration, placeholders and disabled states only, never text a user needs to read                                                                                                                                                                                                                                                            |
| `ink-0` … `ink-400`                                  | white, `#A0A0A0`                | Inverse text on dark fills                                                                                                                                       | 🚩 Degenerate ramp (50–200 are all white, 300 = 400)                                                                                                                                                                                                                                                                                                       |
| `green-500`                                          | `#6B8F71`                       | Accent: success, quote borders, status dots (sage)                                                                                                               | 🚩 3.3:1 on `canvas-50`: not for text. Icons, borders and dots only                                                                                                                                                                                                                                                                                        |
| `green-*` (other steps)                              | Tailwind defaults               | Success states                                                                                                                                                   | 🚩 Broken ramp: 300/400 are Tailwind's neon greens that clash with the sage, `green-200` is a hex in an RGB slot and 100/50 contain values > 255 (both invalid, so those classes render nothing)                                                                                                                                                           |
| `yellow-*`, `red-*`                                  | Tailwind defaults               | Warning / error states                                                                                                                                           | 🚩 Raw Tailwind ramps, not tuned to the warm palette                                                                                                                                                                                                                                                                                                       |
| `warning`, `error`                                   | `#F0D630`, `#E70D3D`            | One-off status colors, hardcoded in the config                                                                                                                   | 🚩 Duplicate `yellow` / `red`; use those                                                                                                                                                                                                                                                                                                                   |
| `teal` (`--color-yes-*`), `scarlet` (`--color-no-*`) | neutral grays                   | Legacy yes/no ramps                                                                                                                                              | 🚩 Pure gray despite the names; don't use in new UI                                                                                                                                                                                                                                                                                                        |
| `gray-*`                                             | `hsl(0 0% …)`                   | Legacy neutral ramp                                                                                                                                              | 🚩 Cool gray that clashes with the warm `ink`/`canvas` ramps; use those instead                                                                                                                                                                                                                                                                            |

Gradients: about 30 `bg-gradient-to-*` usages already exist, mostly `from-primary-*` washes. Keep them, but don't add
new purely decorative ones (section 7).

### Changing a palette value

Change the values in `globals.css` (both `:root` and `.dark`), keep the token **names** so components don't change,
re-check every contrast ratio noted in the comments there (especially `cta` with a white label, in both themes), and
update the table above.

Contrast requirements:

- Body text on `canvas-50` / `canvas-100`: minimum 7:1 contrast ratio. In light mode today only `ink-800` (≈ 9.7–10.8:1)
  and `ink-900` (≈ 14–16:1) meet it; `ink-600` (4.88:1) does not. Don't lighten muted text further.
- Every interactive element needs a visible focus state, not the browser default outline and not `outline: none`.

## 2. Typography

Do not default to Inter, Helvetica, Arial, or system-ui for headlines — these are the single most common AI-generated
tell.

- Set a real type scale (e.g. a 1.25–1.333 ratio), not arbitrary `text-xl`/`text-2xl` guesses.
- Line length under ~80 characters for body copy.
- Do not accent a single word in a headline with italics/color/bold — that's a generic tell, not an emphasis technique.
- No tracked-out ALL-CAPS eyebrow labels above headings.
- No unnecessary micro-labels above content that don't carry real information.

## 3. Layout & components

- Vary border-radius intentionally by role (e.g. sharp corners on structural containers, soft radius on interactive
  controls) rather than one `rounded-xl` applied to everything.
- Don't put the same soft grey drop-shadow under every card. If you need elevation, use the `canvas`/`surface` contrast
  and a hairline border instead of a shadow-heavy "SaaS card kit" look.
- No numbered markers (01 / 02 / 03) unless the content is genuinely sequential (steps, timeline).
- No middle-dot-joined meta strings ("A · B · C") or em-dash labels ("WORD — fragment") as default chrome.
- No arrow (→) appended to every button/link by habit — only where it signals actual navigation to a new context.
- Keep navigation and page structure minimal: fewer, clearer choices over dense option grids. Simplicity is a design
  requirement here, not a fallback.

## 4. Motion

Noticeable motion is wanted for this project, but it needs to be deliberate, not the generic scattered defaults:

- **Avoid**: fade-and-slide-up on every section as it scrolls into view, hover-lift + shadow on every card, identical
  transition on every element.
- **Do instead**: pick one or two orchestrated moments to spend the "noticeable" budget on — e.g. a real hero load-in
  sequence, a meaningful state transition (form submit → confirmation, tab switch, expand/collapse), or a page
  transition — and make that one genuinely well-crafted (spring-based easing, staggered children, appropriate duration)
  rather than spreading small effects everywhere.
- Motion should communicate cause and effect: it responds to what the user just did, or draws attention to something
  that actually changed.
- Define a custom easing curve/duration token instead of relying on Tailwind's default `transition` / `ease-in-out`.
- Always respect `prefers-reduced-motion`.

## 5. Copy & microcopy

- Write from the user's perspective, in plain language, naming things the way a user would understand them — not
  internal system terms.
- Buttons state the action taken: "Save changes," not "Submit." Keep the same verb through the whole flow (a "Publish"
  button leads to a "Published" confirmation).
- Error states say what happened and how to fix it — never vague, never apologetic filler ("Oops! Something went
  wrong").
- Empty states are an invitation to act, not just a blank space or a mascot illustration.
- No filler marketing language ("seamless," "empower," "unlock", "actually", "real", "every") unless it's genuinely
  doing work in
  that sentence.

## 6. Process (do this before writing component code)

1. Before building any new screen, write a short token/layout plan: which of the palette above is background vs. surface
   vs. accent on this specific screen, what the type scale looks like here, and a one-paragraph layout concept (ASCII
   wireframe is fine).
2. Check that plan against Section 7 below — if it matches a generic default, revise it and note what changed.
3. Then build.
4. Before calling a screen done, check: focus states visible? Responsive at mobile width? Reduced-motion respected? Does
   any card/button share identical shadow/radius/spacing with everything else by default rather than by choice?

## 7. Explicit anti-patterns (the "looks AI-generated" checklist)

Reject any of these unless there's a specific reason for this exact screen:

- Warm cream background + serif display + terracotta/clay accent (Compass's own palette, section 1, is an accepted
  exception: don't flag it or "fix" it, but don't stack more of these tells on top of it)
- Near-black background + single bright acid-green or vermilion accent
- Every card: same radius, same soft grey shadow, same padding, arranged in a uniform grid
- Gradient washes used as decoration rather than meaning something
- Tracked-out ALL-CAPS eyebrow labels above every heading
- Meta info joined with middle dots, or "WORD — fragment" style labels
- A monospace face used for labels that aren't actually technical/data values
- Arrow (→) tacked onto every link or button
- Fade-slide-up entrance on every section, hover-lift on every card
- Texts that are slight repetitions / variations
- Emojis (if really necessary, use React icons)
