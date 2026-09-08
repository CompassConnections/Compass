/**
 * Canonical spelling and identity for the user-creatable taxonomies (`interests`, `causes`, `work`).
 *
 * These three tables are the only place in the product where a member can mint a new value that
 * everyone else then sees, and for a long time the only thing between them and unbounded duplication
 * was `ON CONFLICT (name)` — byte-exact string equality — behind an index called `idx_*_name_ci`
 * that did no case folding at all. "Gaming", "gaming" and " Gaming " were three options.
 *
 * The rules here are deliberately small. Everything they do NOT do is handled by identity
 * (`optionNameKey`) and by the alias tables instead, because guessing is how a formatter destroys
 * "Bach", "iOS" and "AI".
 *
 * Mirrored by `normalize_option_name()` in `20260907_canonical_options.sql`, which had to normalise
 * the existing table from inside Postgres. Keep the two in step.
 */

/**
 * Long enough for the longest thing in the seeded corpus ("Cross-country skiing", "Sustainable
 * living") with room to spare, short enough that a pasted sentence is rejected rather than becoming
 * a permanent option nobody will ever match on.
 */
export const MAX_OPTION_NAME_LENGTH = 40

/** Why a typed name cannot become an option. Rendered by the picker; see `optionNameProblem`. */
export type OptionNameProblem = 'empty' | 'too_long' | 'multiple' | 'no_letter'

/**
 * The canonical spelling of `raw`: whitespace collapsed, trailing sentence punctuation dropped, first
 * character uppercased, **nothing else touched**.
 *
 * Sentence case, not title case, and only applied to a name typed in all lower case. The existing
 * corpus is sentence case throughout ("Video games",
 * "Climate science", "Rock climbing"), so title-casing new entries would make every new option
 * visibly clash with every old one. And the remaining words are left exactly as typed rather than
 * lowercased, because lowercasing them turns "Bach" into "bach" and "Rock climbing in Yosemite" into
 * something worse. Divergence like "Rock Climbing" vs "Rock climbing" is settled by
 * {@link optionNameKey} instead — they are the same option, and whoever created it first keeps their
 * spelling.
 *
 * Trailing punctuation is stripped from a closed set rather than "all punctuation", which would turn
 * "C++" into "C".
 */
export function normalizeOptionName(raw: string): string {
  const collapsed = raw
    // Non-breaking spaces arrive via paste and are not matched by `\s` in every engine.
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.,;:!?]+$/, '')
    .trim()
  if (!collapsed) return ''
  // Only when the name carries no capital of its own. Uppercasing the first character
  // unconditionally turns "iOS" into "IOS" — a name whose lowercase initial is the whole point.
  // A capital anywhere is taken as evidence the writer meant the casing they typed.
  if (/\p{Lu}/u.test(collapsed)) return collapsed
  return collapsed.charAt(0).toUpperCase() + collapsed.slice(1)
}

/**
 * The identity of an option name — what `UNIQUE (lower(name))` enforces in Postgres. Two names with
 * the same key are the same option, whatever their casing or spacing.
 */
export function optionNameKey(raw: string): string {
  return normalizeOptionName(raw).toLowerCase()
}

/**
 * `null` when `raw` is fit to become an option, otherwise why it is not.
 *
 * `multiple` is the one worth explaining: people type "hiking, cooking" into a field that takes one
 * value at a time, and before this that became a single permanent option holding two interests that
 * no filter for either would ever match. Only `,` and `;` count — "Arts and crafts" and "Film/TV"
 * are single legitimate options, so neither " and " nor "/" is treated as a separator.
 */
export function optionNameProblem(raw: string): OptionNameProblem | null {
  const name = normalizeOptionName(raw)
  if (!name) return 'empty'
  if (name.length > MAX_OPTION_NAME_LENGTH) return 'too_long'
  if (/[,;]/.test(name)) return 'multiple'
  if (!/\p{L}/u.test(name)) return 'no_letter'
  return null
}

/** The pieces a "hiking, cooking" entry should have been, for the picker to offer back. */
export function splitOptionNames(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map(normalizeOptionName)
    .filter((name) => !optionNameProblem(name))
}
