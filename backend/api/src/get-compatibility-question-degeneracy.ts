import {APIHandler} from 'api/helpers/endpoint'
import {PromptDegeneracy} from 'common/api/types'
import {sortBy} from 'lodash'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

type DegeneracyRow = {
  id: number
  question: string
  category: string | null
  multiple_choice_options: Record<string, number> | null
  answer_count: number
  top_choice: number | null
  top_choice_count: number
  top_prefs: number[] | null
  top_prefs_count: number
}

/**
 * Answer concentration for every compatibility prompt, for `/admin/compatibility-questions`.
 *
 * A prompt only ever contributes to a compatibility score when two people's answers differ, so the
 * question worth asking of the corpus is not how popular an item is but how much it separates
 * anyone. Both shares are computed here rather than in the page because they need every answer row,
 * and there is no reason to ship a few hundred thousand of those to a browser to take two maxima.
 *
 * Skipped answers (`importance = -1`) are excluded, and so are rows with no self-answer: neither
 * scores in `getCompatibilityScore`, so counting them would dilute exactly the shares this page
 * exists to surface. Unpaged and unsorted for the same reason `/admin/options` is — the judgement
 * is about the shape of the whole corpus, and a page boundary hides the comparison being made.
 */
export const getCompatibilityQuestionDegeneracy: APIHandler<
  'get-compatibility-question-degeneracy'
> = async (_props, auth) => {
  await throwErrorIfNotAdmin(auth.uid)

  const pg = createSupabaseDirectClient()

  const rows = await pg.manyOrNone<DegeneracyRow>(
    `with answers as (
       select a.question_id,
              a.multiple_choice,
              --- Normalised so that {2,1} and {1,2,2} are counted as the same accepted set.
              coalesce(
                (select array_agg(distinct p order by p) from unnest(a.pref_choices) as p),
                '{}'::int[]
              ) as prefs
       from compatibility_answers a
       where a.importance >= 0
         and a.multiple_choice >= 0
     ),
     totals as (
       select question_id, count(*)::int as answer_count
       from answers
       group by question_id
     ),
     top_choice as (
       select distinct on (question_id) question_id, multiple_choice, count(*)::int as n
       from answers
       group by question_id, multiple_choice
       order by question_id, count(*) desc, multiple_choice
     ),
     top_prefs as (
       select distinct on (question_id) question_id, prefs, count(*)::int as n
       from answers
       group by question_id, prefs
       order by question_id, count(*) desc, prefs
     )
     select cp.id,
            cp.question,
            cp.category,
            cp.multiple_choice_options,
            coalesce(t.answer_count, 0) as answer_count,
            tc.multiple_choice as top_choice,
            coalesce(tc.n, 0) as top_choice_count,
            tp.prefs as top_prefs,
            coalesce(tp.n, 0) as top_prefs_count
     from compatibility_prompts cp
              left join totals t on t.question_id = cp.id
              left join top_choice tc on tc.question_id = cp.id
              left join top_prefs tp on tp.question_id = cp.id
     where cp.answer_type = 'compatibility_multiple_choice'
     order by cp.id`,
  )

  return {
    questions: rows.map(
      (row): PromptDegeneracy => ({
        id: row.id,
        question: row.question,
        category: row.category,
        // Stored as {label: index}; answers reference the index, so invert into index order.
        options: sortBy(Object.entries(row.multiple_choice_options ?? {}), 1).map(
          ([label]) => label,
        ),
        answerCount: row.answer_count,
        topChoice: row.top_choice,
        topChoiceCount: row.top_choice_count,
        topPrefs: row.top_prefs,
        topPrefsCount: row.top_prefs_count,
      }),
    ),
  }
}
