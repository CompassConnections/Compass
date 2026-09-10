import {Row} from 'common/supabase/utils'

export type QuestionWithStats = Row<'compatibility_prompts'> & {
  answer_count: number
  score: number
  community_importance_percent: number
}

/**
 * How concentrated one compatibility prompt's answers are, for `/admin/compatibility-questions`.
 *
 * Two independent ways a prompt can stop discriminating, matching the two things a member fills in:
 * everyone describing themselves the same way (`topChoice`), and everyone accepting the same set in
 * a partner (`topPrefs`). A prompt can be fine on one and dead on the other — "Do you like to
 * cuddle?" splits three ways on self-report while nearly everyone accepts all three, and it scores
 * nothing for anyone. See `docs/compatibility-questions.md`.
 */
export type PromptDegeneracy = {
  id: number
  question: string
  category: string | null
  /** Option label per stored index, ordered by index — `multiple_choice_options` inverted. */
  options: string[]
  /** Answers that count: not skipped, and with a self-answer. Shares are out of this. */
  answerCount: number
  /** Most-picked self-answer as an index into `options`, or null when nobody has answered. */
  topChoice: number | null
  topChoiceCount: number
  /** Most-picked accepted set, normalised to sorted distinct indices into `options`. */
  topPrefs: number[] | null
  topPrefsCount: number
}

/** What a full rebuild of `compatibility_scores` did, for `/admin/compatibility-questions`. */
export type RecomputeAllResult = {
  /** Profiles that had at least one scoring answer, i.e. the ones any pair could be built from. */
  usersWithAnswers: number
  /** Pairs written. */
  pairs: number
  /** Rows the cache held before the rebuild replaced them, for comparison against `pairs`. */
  previousPairs: number
  seconds: number
}
