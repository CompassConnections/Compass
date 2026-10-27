# Hungry Minds–inspired visual style

A spec for restyling Compass to look like the Hungry Minds product page
(<https://hungryminds.com/en-gb/products/the-book>). It is written for a coding agent. **It does not
describe the current Compass theme**, which is in [`../ui-guidelines.md`](../ui-guidelines.md) and
[`web/styles/globals.css`](../../web/styles/globals.css).

## Where the values come from

Every hex/rgba value, font name, size and radius below was copied from the site's own CSS, downloaded on
2026-10-21:

- `theme.css` (Shopify theme `t/68`, `?v=101598030190734986001792137485`): the `:root` variable block,
  base `html, body`, `.button*`, `.title*`, `.text*`, `.header`, `.product-info__*`, `.section--footer`
- `theme.book-v6.css` (`?v=122372979075771710301792137485`): rules for the book-page sections
  (`.section--book-content …`)
- inline `<style>` blocks in the page HTML (the announcement banner)

Nothing was sampled from screenshots or guessed from how it looks. The exceptions are the two
section backgrounds that are images. Their approximate colors were computed from the images' pixels (see §2).

**Live check (2026-10-21, Chrome, 1920px viewport).** The values were then confirmed against the rendered
page with `getComputedStyle`. All `:root` colors matched. So did the body background (`#F5F5F5`), the
header, footer and announcement colors, the primary and white buttons, H1, titles, body text, the FAQ pill
and the hover state of `.button--black`. The live check also turned up things the CSS read had missed:
the dark "Crafted" band (§2), the fluid root font size (§3), the primary button's border color, and how
`.button--brown` renders (§4). Where a value could not be recovered,
this doc says so under **Not recovered** instead of filling in a guess. Contrast ratios were computed
(WCAG 2.x formula) from the recovered hex values.

---

## 1. Palette (exact values from the site's `:root`)

### Core

| Site variable     | Value                 | What the site uses it for                                                                                                      |
| ----------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--white`         | `#FFFFFF`             | Page background (`html, body { background: var(--white) }`), header background, cards, FAQ pills                               |
| `--black`         | `#001026`             | **The navy.** Main body/product text, primary filled button (`.button--black`), price, quantity input                          |
| `--black-2`       | `#242626`             | Near-black. Default `.button` text + 1px border, `.title` and `.text` defaults, `.product-info__name` (the H1)                 |
| `--black-opacity` | `rgba(0, 16, 38, .5)` | Muted/secondary text (`.text--grey`, `.product-info__gift-text`)                                                               |
| `--grey`          | `rgba(0, 16, 38, .4)` | Muted text/icons                                                                                                               |
| `--error-bg`      | `#F5F5F5`             | Background of the whole product template (`.template-product { background: var(--error-bg) }`), also the band under `.process` |
| `--hover-color`   | `#59616A`             | Hover grey (slate)                                                                                                             |

### Gold / brown accents

| Site variable          | Value                      | What the site uses it for                                                       |
| ---------------------- | -------------------------- | ------------------------------------------------------------------------------- |
| `--gold`               | `#C5AD81`                  | Accent. `.button--gold` fill/border, progress bars                              |
| `--gold-product`       | `#C1AE86`                  | **Hover fill of the primary button** (`.button--black:hover`), add-button hover |
| `--top-banner`         | `#C1AE86`                  | Same value as `--gold-product`                                                  |
| `--gold-free`          | `#A88E5E`                  | Darker gold                                                                     |
| `--brown`              | `#755A31`                  | Brown accent                                                                    |
| `--brown-2`            | `#715B37`                  | Brown accent                                                                    |
| `--menu-link-color`    | `#715B37`                  | Menu links. Also the **hover fill of `.button--gold`** (white text)             |
| `--link-in-text-color` | `#AD7453`                  | Inline links in body text                                                       |
| `--gold-opacity`       | `rgba(197, 173, 129, .03)` | Very faint gold tint                                                            |
| `--input-hover`        | `rgba(197, 173, 129, .08)` | Input hover background                                                          |
| `--cart-free`          | `rgba(197, 173, 129, .12)` | Light gold tinted panel                                                         |

### "Book" section colors (dark maroon/brown, not navy)

Inside the gold, textured book sections the site does **not** use navy. Titles and text are very dark
red-browns:

| Site variable                      | Value                                   | Use                                                                                           |
| ---------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--title-color`                    | `#2F100F`                               | Section titles (`.title--product`, `.title--arnopro`), FAQ question text, focus outline       |
| `--text-color`                     | `#3E0104`                               | Body copy in book sections (`.text--product`, FAQ answers), table borders in the chapters map |
| (literal)                          | `rgba(47,16,15,.3)`                     | 1px border on the FAQ pill (`.faq-item__title`)                                               |
| (literal)                          | `#380b0d` at `opacity:.22`, `blur(9px)` | Soft shadow ellipse above/below `.concept-block`                                              |
| `--divider-color` (inline in HTML) | `#3E0104`                               | Divider                                                                                       |

### Borders, lines, overlays

| Site variable          | Value                               |
| ---------------------- | ----------------------------------- |
| `--border`             | `rgba(0, 0, 0, .06)`                |
| `--border-2`           | `rgba(0, 16, 38, .12)`              |
| `--border-3`           | `rgba(0, 16, 38, .33)`              |
| `--faq-border`         | `#E7E9EB`                           |
| `--menu-border`        | `#E3E3E3`                           |
| `--grey-3`             | `#EEEEEE`                           |
| `--grey-3-product`     | `#ECECEC` (gift pill background)    |
| `--grey-4`             | `#F7F7F7`                           |
| `--grey-4-product`     | `rgba(0, 16, 38, .06)`              |
| `--modal-choose-input` | `rgba(0, 16, 38, .04)`              |
| `--modal-choose-item`  | `#F5F5F6`                           |
| `--cart-bg` (overlay)  | `rgba(0, 16, 38, .3)`               |
| `::selection`          | background `#272e3ab3`, text `#fff` |

### Dark surfaces (footer, media)

| Site variable           | Value                                                                                | Use                            |
| ----------------------- | ------------------------------------------------------------------------------------ | ------------------------------ |
| `--footer-bg`           | `#272E3A`                                                                            | Footer background (slate navy) |
| `--footer-block-text`   | `rgba(255, 255, 255, .6)`                                                            | Footer body text               |
| `--footer-title-color`  | `rgba(255, 255, 255, .3)`                                                            | Footer column titles           |
| `--footer-input-bg`     | `rgba(255, 255, 255, .04)`                                                           | Footer input fill              |
| `--footer-input-border` | `rgba(255, 255, 255, .33)`                                                           | Footer input border            |
| `--media-bg`            | `#243040`                                                                            | Media blocks                   |
| `--hero-minds`          | `#1c2632`                                                                            | Dark hero                      |
| `--switch-bg`           | `#343B46`                                                                            | Toggle on dark                 |
| footer `::selection`    | background `#ffffffd9`, text `var(--footer-bg)`                                      |                                |
| announcement banner     | background `#000`, text `#fff`, 16px Rethink Sans, height `3rem` (`2.75rem` ≤1024px) | Top strip                      |

### Status / misc

| Site variable     | Value                    | Use                                                                       |
| ----------------- | ------------------------ | ------------------------------------------------------------------------- |
| `--red`           | `#B41D1C`                | "Save" label, warnings                                                    |
| `--red-opacity`   | `rgba(180, 29, 28, .06)` | Warning pill background (literal `#b41d1c0f` on `.product-info__warning`) |
| `--red-opacity-2` | `rgba(180, 29, 28, .03)` |                                                                           |
| `--orange`        | `#FF9900`                | `.button--orange`                                                         |
| `--yellow`        | `#FFC107`                | Defined in `:root`; no use on this page found                             |

The site also defines `--blue-ny #36424E`, `--gold-ny #938735` and `--save-background #959494`. They look
like campaign-specific values; leave them out.

---

## 2. Backgrounds and section rhythm

From the CSS, top to bottom:

1. **Announcement strip**: solid black `#000`, white text.
2. **Header**: `background: var(--white)`, `padding: 1.25rem 2.5rem`. On the home page it is transparent
   over the hero with white text/icons until scroll (`body:not(.is-fixed) …`).
3. **Product block**: the product template background is `#F5F5F5` (`--error-bg`). Text is navy
   `#001026`, cards and pills are white `#FFFFFF`.
4. **Book content sections** (`.section--thebook`): the gold/parchment look **is an image, not a CSS
   color**:

   ```css
   .section--thebook {
     background: url(https://cdn.shopify.com/s/files/1/0933/6717/3410/files/bg.jpg?v=1751444537);
     background-size: 108rem 81.5rem;
     background-position: center;
     background-repeat: repeat-y;
   }
   ```

   A decorative edge, `line.png`, tiles along the top of some sections (`::before`, `height: .625rem`,
   `repeat-x`). Video and concept frames use `border_1.png` / `border_2.png` images. On this background the
   text is maroon/brown (`#2F100F` titles, `#3E0104` body), and a few blocks use white text.

   **Approximated flat color (inferred from the image, not from CSS).** `bg.jpg` is 3456×2608 px. It is a
   pale cream parchment with faint warm stains toward the edges, not a saturated gold. Pixel statistics
   (downsampled to 400 px wide):

   | Statistic                         | Value                                                                    |
   | --------------------------------- | ------------------------------------------------------------------------ |
   | Mean                              | `#FEFBEB`                                                                |
   | Median                            | `#FEFCED`                                                                |
   | Dominant clusters (median-cut, 5) | `#FFFCEB` 31%, `#FDFEF1` 22%, `#FEFAE8` 21%, `#FDFDF2` 17%, `#FDF4DC` 8% |
   | 5th / 95th percentile             | `#FCF5DD` / `#FFFEF4`                                                    |

   **Use `#FEFBEB` as the flat parchment fill.** For a slightly warmer, more visibly "paper" band, use
   `#FCF5DD`, the darker stain tone. To approximate the texture without the image, put a subtle radial
   vignette from `#FEFBEB` (center) to `#FCF5DD` (edges).
   Contrast on `#FEFBEB` / `#FCF5DD`: `#2F100F` 16.8 / 16.0:1, `#3E0104` 16.7 / 15.9:1, `#001026`
   18.3 / 17.5:1, `#715B37` 6.2 / 5.9:1, `#AD7453` 3.7 / 3.6:1 (large text only).

   Because the parchment is so pale, the "gold" impression on the page comes mainly from the gold CSS
   accents (`#C5AD81`, `#C1AE86`), the brown/maroon type and the decorative image frames, not from the
   section fill. To get a stronger gold band, use `#C5AD81` as a solid fill with navy or maroon text
   (8.77:1). That is a design choice; the site's book sections don't do it.

5. **Dark "Crafted" band** (`.section--book-with-characteristics`, one band inside the parchment
   area, ~1100px tall). Computed `background-color: rgb(18, 20, 28)` = **`#12141C`**, under a background
   image, `bg-min.jpg` (3456×1980, a dark navy-black texture with a subtle gradient). Image statistics
   (inferred from pixels): mean `#10131B`, median `#0F1219`, 5th / 95th percentile `#0A0C11` / `#191D29`.
   The mean is within a couple of RGB steps of the CSS fallback, so **`#12141C` (exact, from CSS) works
   as the flat fill**. Text here is white `#FFFFFF`: Castellar for headings and spec values, Arno Pro for
   body, and Arno Pro at `opacity: .5` for spec labels. White on `#12141C` is 18.38:1.
6. **Footer**: `#272E3A` with white text at 0.6 / 0.3 opacity.

So the page alternates **light grey/white (product) → cream parchment (story) → one near-black band →
parchment → slate footer**.

**For Compass:** keep the default surface white (`#FFFFFF`) or `#F5F5F5`, with navy `#001026` text. Use the
parchment (`#FEFBEB`) and gold treatment for a few emphasis bands only (hero, "how it works",
testimonials). Do not use it for app chrome.

---

## 3. Typography

| Role                  | Site font                                                                             | Where                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Base / UI / buttons   | **Rethink Sans**, 400 (also 500, 600 loaded), fallback `Arial, Helvetica, sans-serif` | `html, body`, `.button`, announcement. Loaded from Google Fonts: `family=Rethink+Sans:wght@400;500;600`     |
| Display H1 / `.title` | **Millionaire**                                                                       | `.title`, `.product-info__name`                                                                             |
| Section titles (book) | **Castellar**, fallback `Arial, sans-serif`                                           | `.title--product`, letter-spacing `-2.08px`, line-height `normal`; FAQ questions (uppercase); chapter table |
| Serif body (book)     | **Arno Pro**, fallback `Times New Roman, Times, serif`                                | `.text--product`, FAQ answers, `.title--arnopro`                                                            |
| Uppercase labels      | **Velour Raw**                                                                        | `.product-info__description` (uppercase, `letter-spacing: -.9px`), gift title, advantage labels             |

Only Rethink Sans is freely available (Google Fonts). Millionaire, Castellar, Arno Pro and Velour Raw are
commercial or custom faces. Pick licensed substitutes, or ask the owner. Don't assume these fonts can be
loaded. Live, `document.fonts` reported all five as loaded: Rethink Sans 400/600, Millionaire 400,
Castellar 400, Arno Pro 400, Velour Raw 300/400.

### Free substitutes (use these in Compass)

All five are on Google Fonts (SIL Open Font License). They were chosen by comparing against the site's
live rendering (2026-10-21). The match is by eye, so verify side by side before shipping.

| Site font        | How it renders on the site                                                                                                                        | Substitute                                                                        | Alternative            | Notes                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rethink Sans** | Clean geometric-grotesque sans: buttons, product body text, announcement                                                                          | **Rethink Sans** (same font, already free)                                        | –                      | No substitution needed. Load 400 / 500 / 600.                                                                                                       |
| **Millionaire**  | Light, high-contrast _italic_ serif with long flowing swashes: the "The Book" H1, "Menu", "Cart (0)"                                              | **Cormorant** italic 400 (300 for large sizes)                                    | Bodoni Moda italic 400 | Display only (≥ 2rem). Cormorant's italic has the same thin hairlines and calligraphic flow. Don't use it for anything a user must read quickly.    |
| **Castellar**    | Thin, classical Roman inscriptional capitals: section titles ("ALL THAT YOU MAY WISH TO KNOW"), FAQ questions, chapter table                      | **Cinzel** 400                                                                    | Marcellus SC           | Cinzel is caps-only by design, like Castellar. Keep the site's `letter-spacing: -2.08px` only at title sizes; at FAQ size use `0`.                  |
| **Arno Pro**     | Old-style humanist (Aldine) book serif: story body copy, FAQ answers, spec values in the dark band                                                | **EB Garamond** 400 / italic                                                      | Crimson Pro            | Closest in spirit (Renaissance book face). Crimson Pro has a larger x-height and reads better below 16px.                                           |
| **Velour Raw**   | Small classical serif set in uppercase, slight negative tracking: "SELECT EDITION", menu links, the advantage labels ("8,000+ HOURS OF CREATION") | **Libre Caslon Text** 400, `text-transform: uppercase`, `letter-spacing: -0.03em` | Cormorant SC 600       | Sturdy enough at 14–16px label sizes, where Cormorant SC's hairlines get thin. The site's tracking is `-3%` (menu) / `-.9px` (product description). |

```css
@import url('https://fonts.googleapis.com/css2?family=Rethink+Sans:wght@400;500;600&family=Cormorant:ital,wght@1,300;1,400&family=Cinzel:wght@400;500&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Libre+Caslon+Text:wght@400;700&display=swap');

--font-ui: 'Rethink Sans', Arial, Helvetica, sans-serif; /* buttons, forms, app UI */
--font-display: 'Cormorant', 'Times New Roman', serif; /* italic hero headings (Millionaire role) */
--font-title: 'Cinzel', 'Times New Roman', serif; /* uppercase section titles (Castellar role) */
--font-serif:
  'EB Garamond', 'Times New Roman', Times, serif; /* long-form story copy (Arno Pro role) */
--font-label:
  'Libre Caslon Text', 'Times New Roman', serif; /* uppercase eyebrow labels (Velour Raw role) */
```

In Next.js, load them with `next/font/google` rather than the `@import`, to avoid a render-blocking
request.

**Compass-specific caveat:** Compass currently uses Atkinson Hyperlegible Next as `--font-main` for
legibility. A reasonable split: the substitutes above for marketing surfaces and headings, and Rethink
Sans (or keep Atkinson) for dense app UI such as profiles, chat and forms. Don't set long app text in
Cinzel, Cormorant italic or uppercase Caslon.

**Root font size is fluid.** Every `rem` value below scales with it:

```css
html,
body {
  font-size: 16px;
}
@media screen and (min-width: 1729px) {
  html,
  body {
    font-size: 0.925926vw;
  }
} /* = 16px at 1728px */
@media screen and (max-width: 389px) {
  html,
  body {
    font-size: 4.11311vw;
  }
} /* = 16px at 389px  */
```

So at 1920px wide, 1rem = 17.78px (measured live).

**Font sizes** (from `:root`; desktop → ≤ tablet → mobile breakpoints as declared in the three `:root`
blocks; breakpoint pixel widths not recorded here):

| Token            | Desktop  | Mid     | Mobile   |
| ---------------- | -------- | ------- | -------- |
| `--big-title`    | 5rem     | 3.75rem | 3rem     |
| `--h1`           | 4.5rem   | 3.75rem | 2.5rem   |
| `--h2`           | 3.625rem | 2.75rem | 2.5rem   |
| `--h5`           | 2rem     | 1.75rem | 1.25rem  |
| `--title-fs`     | 3.25rem  | 2.5rem  | 1.625rem |
| `--text`         | 1rem     | 1rem    | 1rem     |
| `--text-big`     | 1.375rem | –       | 1rem     |
| `--text-product` | 1.25rem  | –       | 1rem     |
| `--text-m`       | .875rem  | .875rem | .875rem  |
| `--text-s`       | .75rem   | .75rem  | .875rem  |
| `--button-text`  | 1.125rem | –       | 1rem     |

Line heights the site uses: titles `1.1` (`.title`), `1.29` (product name), `normal` (`.title--product`).
Body `1.63` (`.text`, `.product-info__text`) or `1.45` (`.text--product`). Labels `1.2`–`1.5`.

---

## 4. Components

### Buttons (pill-shaped, uppercase)

Base `.button`:

```css
display: flex;
align-items: center;
justify-content: center;
gap: 0.75rem;
font-family:
  Rethink Sans,
  Arial,
  Helvetica,
  sans-serif;
font-weight: 400;
font-size: var(--button-text); /* 1.125rem → 1rem mobile */
line-height: 1;
text-transform: uppercase;
color: #242626;
background: none;
border: 0.0625rem solid #242626;
border-radius: 3.625rem;
padding: 0.9375rem 1.25rem 0.8125rem;
min-width: 12.0625rem;
min-height: 3.625rem; /* .button--sm: min-height 3.5rem */
transition: 0.6s all ease;
```

| Variant                                                                        | Rest                                                                                                                  | Hover                                                                                                                  |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Primary** `.button--black` (the page's main CTA, 9 uses, e.g. "Add to cart") | bg `#001026`, text `#FFFFFF`, border `1px solid #242626` (inherited from base `.button`; verified live)               | bg `#C1AE86`, border `rgba(0,16,38,.12)`, text stays `#FFFFFF` (verified live by hovering; see the accessibility note) |
| `.button--brown` (1 use)                                                       | No CSS rule of its own. Renders as the base outline button: transparent bg, text and border `#242626` (verified live) | base `.button` (no hover rule)                                                                                         |
| `.button--white.button--full`                                                  | bg `#FFFFFF`, text `#001026`, border `#FFFFFF`                                                                        | bg `#C1AE86`, text `#FFFFFF`, border `rgba(0,16,38,.12)`                                                               |
| `.button--white` (outline on dark)                                             | text + border `#FFFFFF`                                                                                               | bg `#FFFFFF`, text `#242626`                                                                                           |
| `.button--gold`                                                                | bg + border `#C5AD81`                                                                                                 | bg + border `#715B37`, text `#FFFFFF`                                                                                  |
| `.button--border` (outline)                                                    | bg none, text `#001026`                                                                                               | (no specific hover rule found)                                                                                         |
| `.button--blue`                                                                | bg `#242626`, text `#FFFFFF`                                                                                          | (no specific hover rule found)                                                                                         |
| loading                                                                        | bg `#001026`, label hidden                                                                                            |                                                                                                                        |
| pressed `.button.active`                                                       | `transform: scale(.9)`                                                                                                |                                                                                                                        |
| disabled hover                                                                 | `opacity: .8`                                                                                                         |                                                                                                                        |
| arrow icon                                                                     | `svg` 2.75rem × .875rem; slides `translate(.625rem)` on hover                                                         |                                                                                                                        |

### Pills, chips, inputs

- Language pill `.product-info__lang-item`: bg white, `border-radius: 3.75rem`, padding `.9375rem`, navy,
  uppercase.
- Quantity stepper buttons: `3rem` square, `border-radius: 1.875rem`, `.03125rem solid rgba(0,16,38,.12)`,
  bg white.
- Gift pill: bg `#ECECEC`, `border-radius: 2rem`, padding `.625rem 1.875rem .625rem .625rem`.
- Warning pill: bg `#b41d1c0f`, `border-radius: 6.25rem`, text `#B41D1C`.

### FAQ / accordion (book section)

```css
.faq-item__title {
  padding: 1.65625rem 3.75rem 1.46875rem; /* mobile: 1.1875rem 1.25rem */
  background: #ffffff;
  border: 0.0625rem solid rgba(47, 16, 15, 0.3);
  border-radius: 3.75rem; /* mobile: 6.25rem */
  transition: all 0.3s ease;
}
.faq-item__title span {
  color: #2f100f;
  font-family: Castellar;
  text-transform: uppercase;
  line-height: 1.2;
}
.faq-item__title:focus-visible {
  outline: 2px solid #2f100f;
  outline-offset: 4px;
}
.faq-item__sub p {
  color: #3e0104;
  font-family: Arno Pro;
  line-height: 1.63;
}
/* mobile, open: pill background and border removed */
```

The product-info FAQ (on the grey `#F5F5F5` block) uses a white row, `padding: 1.59375rem 1.875rem`, hover bg
`#ffffff80`.

### Tables / grids (chapters map)

1px `#3E0104` borders on every cell, Castellar text in `#3E0104`, cell height `6.5rem`. Becomes a 3-column
grid at ≤ 1280px.

### Header

White, `padding: 1.25rem 2.5rem`, absolutely positioned. It slides up by the banner height
(`translate(0, -3rem)`) once the page is scrolled (`.is-fixed`).

---

## 5. Accessibility notes (computed from the values above)

| Pair                                     | Ratio           | Verdict                                                                                                                                                                                                        |
| ---------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#001026` on `#FFFFFF`                   | 19.05:1         | ✅                                                                                                                                                                                                             |
| `#001026` on `#F5F5F5`                   | 17.48:1         | ✅                                                                                                                                                                                                             |
| `#242626` on `#FFFFFF`                   | 15.21:1         | ✅                                                                                                                                                                                                             |
| `#2F100F` / `#3E0104` on `#FFFFFF`       | 17.47 / 17.34:1 | ✅                                                                                                                                                                                                             |
| `#001026` on `#C5AD81` / `#C1AE86`       | 8.77:1          | ✅ Navy text on gold works                                                                                                                                                                                     |
| `#FFFFFF` on `#C5AD81` / `#C1AE86`       | **2.17:1**      | ❌ Fails AA. **The site's primary-button hover (white on `#C1AE86`) and the `.button--white.button--full` hover have this problem. Don't copy it.** Use navy text on the gold hover, or darken the hover fill. |
| `#C5AD81` as text on `#FFFFFF`           | **2.17:1**      | ❌ Never use the gold as text or icon color on white                                                                                                                                                           |
| `#715B37` on `#FFFFFF` (and white on it) | 6.45:1          | ✅ The brown is the legible "gold" for text/links on white                                                                                                                                                     |
| `#AD7453` (inline link) on `#FFFFFF`     | **3.89:1**      | ⚠️ Below AA for body-size text. OK only for large text; otherwise use `#715B37`                                                                                                                                |
| `#59616A` on `#FFFFFF`                   | 6.28:1          | ✅                                                                                                                                                                                                             |
| `#B41D1C` on `#FFFFFF`                   | 6.70:1          | ✅                                                                                                                                                                                                             |
| `#FFFFFF` on `#272E3A` (footer)          | 13.65:1         | ✅ (at 0.6 opacity the effective ratio is lower; check it)                                                                                                                                                     |
| `#C5AD81` on `#272E3A` / `#001026`       | 6.29 / 8.77:1   | ✅ Gold as text works on dark surfaces                                                                                                                                                                         |

---

## 6. Mapping onto Compass (for the implementing agent)

Compass colors are RGB-triplet CSS variables in `web/styles/globals.css` (`:root` and `.dark`), exposed via
`web/tailwind.config.js`. The existing `ink`/`primary` ramps invert in dark mode. Suggested mapping for the
**light** theme. Only the values in the right column come from the site; ramp steps not listed have no site
equivalent and are left to the implementer:

| Compass token                              | Site value                                                      |
| ------------------------------------------ | --------------------------------------------------------------- |
| `canvas-0`, `canvas-50`                    | `#FFFFFF`                                                       |
| `canvas-100` (page bg)                     | `#FFFFFF` (or `#F5F5F5` for product-like grey areas)            |
| new `parchment` token (emphasis bands)     | `#FEFBEB`, edge tone `#FCF5DD` (approximated from `bg.jpg`, §2) |
| new `night` token (one dark emphasis band) | `#12141C` with white text (exact, §2)                           |
| `canvas-200` / borders                     | `rgba(0,16,38,.12)` / `#E7E9EB`                                 |
| `canvas-950` (sidebar)                     | `#272E3A` (footer) or `#001026`                                 |
| `ink-900` (primary text)                   | `#001026`                                                       |
| `ink-600` (body text)                      | `#242626` or `rgba(0,16,38,.5)` for muted                       |
| `primary-500` (accent fill)                | `#C5AD81`                                                       |
| `primary-700` (accent text/links)          | `#715B37`                                                       |
| `cta` / `cta-hover`                        | `#001026` / gold hover `#C1AE86` **with navy text** (see §5)    |
| `red-*` (error)                            | `#B41D1C`                                                       |

Other rules to carry over:

- Buttons: pill radius (`3.625rem`), uppercase, 1px border, `min-height: 3.625rem`, `transition .6s`.
- Accordions and chips are fully rounded pills.
- Gold-textured bands use maroon text (`#2F100F` / `#3E0104`), not navy.
- **Dark mode:** the site has no full dark theme. It only has a `.light` scope that swaps a few toggle
  variables. A dark theme for Compass has to be designed separately. A natural base is the site's dark
  surfaces (`#001026`, `#272E3A`, `#243040`, `#1c2632`) with `#C5AD81` accents, but that is a design
  choice, not something taken from the site.
- Follow the existing anti-pattern rules in [`../ui-guidelines.md`](../ui-guidelines.md), and update its
  palette table when the new tokens land.

---

## Not recovered (don't invent these)

- **The book-section background color.** It is a raster image (`bg.jpg`, tiled at `108rem × 81.5rem`),
  not a CSS color, so no exact CSS value exists. The flat approximation in §2 (`#FEFBEB`) was **computed
  from the image's pixels**, at the owner's request. The dark band's image statistics are also
  pixel-derived, but its recommended fill (`#12141C`) is the exact CSS value.
- **Decorative images**: `line.png` (section edge), `border_1.png` / `border_2.png` (frames). Assets only,
  no CSS equivalent.
- **The dark band's texture** (`bg-min.jpg`). Its flat color is exact (`#12141C`, from CSS); only the
  texture itself is an image asset.
- **Font files** for Millionaire, Castellar, Arno Pro, Velour Raw. They load on the live page, but no
  `@font-face` declarations were found in the downloaded same-origin CSS or HTML (they come from a
  stylesheet the browser wouldn't let the page script read). They are commercial anyway.
- **Hover states** for `.button--border`, `.button--blue`, `.button--brown` and plain links (beyond the
  ones listed) have no rule in the downloaded CSS.
- **Breakpoint widths** for the three font-size `:root` blocks were not recorded. Read them from
  `theme.css` if needed.
- **Viewport coverage**: the live check ran only at 1920px desktop width. Mobile computed styles were
  not checked.
