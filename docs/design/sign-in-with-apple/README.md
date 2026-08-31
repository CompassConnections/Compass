# Sign in with Apple — source artwork

Apple's own logo files, from the **Sign in with Apple Logo** download at
<https://developer.apple.com/design/resources/> (`Logo-Sign-in-with-Apple.dmg`).

`AppleMark` in [`web/components/buttons/sign-up-button.tsx`](../../../web/components/buttons/sign-up-button.tsx)
inlines the `d` from `Logo - SIWA - Logo-only - Black.svg` verbatim. These files are kept so that
claim stays checkable — diff the path against the SVG rather than taking the comment's word for it.
Redrawing the mark is what got 1.42.0 rejected under guideline 4, so the check is worth being cheap.

Deliberately **not** under `web/public/`: that directory is served, and publishing Apple's assets as
standalone downloadable files is redistribution rather than use. Nothing imports these; they are
reference only.

Measurements taken from the bundle, used to size the button:

| Asset                                | Glyph size      | Ratio to a 44pt button |
| ------------------------------------ | --------------- | ---------------------- |
| Left-aligned, Small (24×44)          | 11.8 × 14.5     | 0.330                  |
| Left-aligned, **Medium** (31×44)     | **15.5 × 19.0** | **0.432**              |
| Left-aligned, Large (39×44)          | 19.5 × 24.0     | 0.545                  |
| Logo-only square (56×56, 44pt plate) | 15.0 × 19.0     | 0.432                  |

The button uses Medium — 19px tall in a 44px control. The black and white files carry the identical
path and differ only in `fill`, which is why one copy with `currentColor` is equivalent to both.

## Measured from Apple's reference button image

The logo bundle does not cover the label, so the remaining numbers were measured off a rendering of
Apple's own button (440×76 plate, content centred):

| Measure             | Ratio to button height  | At 44px |
| ------------------- | ----------------------- | ------- |
| Logo height         | 0.342                   | 15.1px  |
| Logo width / height | 0.789 (from the SVG)    | 11.8px  |
| Label block height  | 0.355                   | 15.6px  |
| Gap, mark → label   | 0.250                   | 11.0px  |
| Label stem / height | 0.111 → SF Pro Semibold |         |

A second measurement, against the 264×44 button Apple renders in the HIG page itself, settled the
label size:

| Measure     | Apple (264×44) | Ours, before | Ours, after |
| ----------- | -------------- | ------------ | ----------- |
| Logo height | 0.341          | 0.340        | 0.340       |
| Label block | 0.386          | 0.302        | 0.386       |
| Gap         | 0.273          | 0.264        | 0.273       |

The mark was never the part that was wrong — it matched to within 0.001. The lockup read small
because the label was undersized, which drags the whole thing down with it. Our label renders at
0.887 of its font-size, so Apple's 17px block needs a 19px font.

The button uses 19px semibold with a 12px gap and a 15px mark. One deliberate departure:

- **Logo scale.** Apple publishes three for a 44pt button (14.5 / 19 / 24), so there is no single
  mandated value. 15px is what their rendered button uses, and is the size at which mark and label
  read as equals — the relationship the reference is really showing.

At 19px the label is larger than `AuthSubmitButton`'s 15px directly above it. That is intended: the
guideline runs the same direction, since the Apple button may not be less prominent than the other
ways into an account.

The **Sign in with Apple Buttons** Figma/Sketch download remains the authority if either needs
settling exactly.
