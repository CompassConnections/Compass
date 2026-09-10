/**
 * The domains a compatibility prompt can belong to — `compatibility_prompts.category`.
 *
 * These are the coverage domains from `docs/compatibility-questions.md`: screening value comes from
 * spanning the areas where a mismatch is structural, and the doc's coverage table is the list of
 * those areas. Naming them here is what turns that table from a keyword guess over the question text
 * into something the data can answer, and it is what the category filter offers members.
 *
 * Two keys are not in that table — `relationship_style` and `interests_leisure`. The table lists the
 * domains the set is *short* on, not every domain it has, and roughly half the live corpus is
 * relationship-shape and taste items that would otherwise have had to be filed somewhere false.
 * Ordering runs highest structural screening value first, which is also the order the filter lists
 * them in.
 *
 * The column is free text and largely unpopulated, so nothing assumes a value is in this map: an
 * unrecognised category is shown as it is stored (`compatibilityCategoryLabel`), and the filters
 * offer whatever the loaded questions actually carry. Labels here are the English source strings —
 * the UI runs them through `t('compatibility.category.<key>', label)`.
 */
export const COMPATIBILITY_CATEGORIES = {
  kids_family: 'Kids & family',
  // Absorbs conflict and communication: how two people argue and repair is not a separate domain
  // from what their relationship is, it is the largest part of it. Also absorbs self-regulation and
  // growth, which only reach a partner through the same channel — unless the growth is about work,
  // in which case it files under `work`.
  relationship_style: 'Relationship style',
  money: 'Money',
  work: 'Work',
  politics: 'Politics',
  religion: 'Religion',
  // Ethics in practice, and what you owe people: honesty, transgression, obligation, showing up in a
  // crisis. Care and obligation live here rather than apart, being the same question applied to
  // someone specific.
  values_worldview: 'Values & worldview',
  sex_intimacy: 'Sex & intimacy',
  location_mobility: 'Location & mobility',
  // Split from daily rhythm on purpose: substances and fitness are screening dealbreakers, whereas
  // sleep schedule and routine predict daily friction. Merged, the dealbreakers lose slots to the
  // logistics.
  health: 'Health',
  daily_rhythm: 'Daily rhythm',
  friendship_social: 'Friendship & social life',
  interests_leisure: 'Interests & leisure',
  // Not a domain to grow: the doc marks trivia and IQ-test framings for retirement. It is here so
  // the ones already in the corpus can be labelled, and so found and removed.
  trivia: 'Trivia',
} as const

export type CompatibilityCategory = keyof typeof COMPATIBILITY_CATEGORIES

export const COMPATIBILITY_CATEGORY_KEYS = Object.keys(
  COMPATIBILITY_CATEGORIES,
) as CompatibilityCategory[]

/** English label for a stored category, falling back to the raw value for anything unrecognised. */
export const compatibilityCategoryLabel = (category: string) =>
  COMPATIBILITY_CATEGORIES[category as CompatibilityCategory] ?? category

/**
 * Stored categories present in a set of questions, ordered as `COMPATIBILITY_CATEGORIES` is (the
 * doc's coverage order, most dealbreaker value first), with unrecognised values after it.
 */
export const presentCompatibilityCategories = (questions: {category?: string | null}[]) => {
  const present = new Set<string>()
  for (const q of questions) if (q.category) present.add(q.category)
  const known = COMPATIBILITY_CATEGORY_KEYS.filter((key) => present.has(key))
  const unknown = [...present].filter((c) => !(c in COMPATIBILITY_CATEGORIES)).sort()
  return [...known, ...unknown]
}
