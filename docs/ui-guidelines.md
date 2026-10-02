# Frontend Design Guidelines

Purpose: this project's frontend must look deliberately designed, not generated. These rules exist because AI-written
UIs cluster around a small set of recognizable defaults. Follow the tokens below, and actively avoid the anti-patterns
section — that list is the actual "vibe coded" tell, more than any specific color choice.

Stack: React + Tailwind. Motion: noticeable, but orchestrated, not scattered.

---

## 1. Design tokens

Use these as the single source of truth. Add them to `tailwind.config.js` under `theme.extend.colors` — never use raw
Tailwind defaults (`slate-900`, `red-600`, etc.) for brand-relevant elements.

| Token | Hex | Use |
| ----- | --- | --- |

TODO

Contrast requirements:

- Body text on `canvas`/`surface`: minimum 7:1 contrast ratio (`text` ≈ 19:1, `text-muted` ≈ 7.8:1 on `surface`). Don't
  lighten `text-muted` further.
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
- No filler marketing language ("seamless," "empower," "unlock", "actually", "real") unless it's genuinely doing work in
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

- Warm cream background + serif display + terracotta/clay accent
- Near-black background + single bright acid-green or vermilion accent
- Every card: same radius, same soft grey shadow, same padding, arranged in a uniform grid
- Gradient washes used as decoration rather than meaning something
- Tracked-out ALL-CAPS eyebrow labels above every heading
- Meta info joined with middle dots, or "WORD — fragment" style labels
- A monospace face used for labels that aren't actually technical/data values
- Arrow (→) tacked onto every link or button
- Fade-slide-up entrance on every section, hover-lift on every card
- Texts that are slight repetitions / variations
