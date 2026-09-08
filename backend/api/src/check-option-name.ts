import {APIHandler} from 'api/helpers/endpoint'
import {debug} from 'common/logger'
import {normalizeOptionName, optionNameProblem, splitOptionNames} from 'common/profiles/option-name'
import {OptionNameVerdict, OptionSummary, validateTable} from 'common/profiles/options'
import {tryCatch} from 'common/util/try-catch'
import {callGemini} from 'shared/llm/gemini'
import {log} from 'shared/monitoring/log'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {findSimilarOptions, resolveOptionName} from 'shared/supabase/options'

/** How many near-matches the model is asked to judge. Bounded input keeps the call cheap and fast. */
const CANDIDATES_FOR_LLM = 20

/** How many near-matches are offered to the reader. More than a few stops being a suggestion. */
const CANDIDATES_SHOWN = 3

/**
 * Decides what a typed option name should become — **without writing anything**.
 *
 * Read-only is the important part. Options are still created lazily by `setProfileOptions` when the
 * profile is saved, exactly as before, so abandoning a half-filled form cannot leave a permanent
 * option behind. This endpoint only tells the picker which of four things it is looking at, so it
 * can put an existing option in front of the reader before offering to create a new one.
 *
 * The ladder, cheapest first:
 *   1. is the name usable at all;
 *   2. does it already exist, under this name or a merged-away one (pure SQL);
 *   3. is anything close enough to be worth offering (trigram, pure SQL);
 *   4. only then, is any of those shortlisted candidates *the same thing* (one small LLM call).
 *
 * Step 4 is the only part that can catch "Computer programming" → "Programming", because that pair
 * shares no useful trigrams beyond the word itself and no thesaurus lists it. It is also why this
 * endpoint is authed and rate-limited. If the model is unavailable or unconfigured the shortlist
 * from step 3 is still returned — a slightly worse suggestion, never a blocked creation.
 */
export const checkOptionName: APIHandler<'check-option-name'> = async (props, _auth) => {
  const {table, name: rawName, locale} = props
  validateTable(table)

  const problem = optionNameProblem(rawName)
  if (problem) {
    return {
      verdict: {
        status: 'invalid',
        problem,
        // "hiking, cooking" is one string the reader meant as two options. Handing back the pieces
        // lets the picker offer to add both rather than just refusing.
        parts: problem === 'multiple' ? splitOptionNames(rawName) : undefined,
      },
    }
  }

  const name = normalizeOptionName(rawName)
  const pg = createSupabaseDirectClient()

  const existing = await resolveOptionName(pg, table, name, locale)
  if (existing) {
    return {verdict: {status: 'existing', option: existing.option, matchedOn: existing.matchedOn}}
  }

  const candidates = await findSimilarOptions(pg, table, name, locale, CANDIDATES_FOR_LLM)
  if (!candidates.length) return {verdict: {status: 'new', name}}

  const judged = await tryCatch(askModelForDuplicates(name, candidates, table))
  if (judged.error) {
    // A model failure must never block someone from adding an interest, so fall back to the trigram
    // shortlist rather than surfacing the error.
    log('check-option-name: duplicate check failed, falling back to similarity', judged.error)
  }

  const chosen = judged.data?.length ? judged.data : candidates.slice(0, CANDIDATES_SHOWN)

  return {
    verdict: {
      status: 'suggestion',
      name,
      candidates: chosen.slice(0, CANDIDATES_SHOWN),
      reason: judged.data?.length ? 'llm' : 'similar',
    } satisfies OptionNameVerdict,
  }
}

/**
 * Which of `candidates` mean the same thing as `name`, in the model's judgement.
 *
 * Deliberately narrow: the model picks from a fixed shortlist and may pick nothing. It is never
 * asked to invent a name, so the worst case is a suggestion the reader declines — and declining is
 * one click, because the create action stays available underneath.
 */
async function askModelForDuplicates(
  name: string,
  candidates: OptionSummary[],
  table: string,
): Promise<OptionSummary[]> {
  const byName = new Map(candidates.map((c) => [c.name.toLowerCase(), c]))

  const prompt = `A member of a social directory is adding "${name}" to their profile's ${table} list.

These options already exist:
${candidates.map((c) => `- ${c.name} (used by ${c.usageCount})`).join('\n')}

TASK: return the existing options that mean the SAME THING as "${name}", best first.

RULES:
- Same thing means a member searching for one would expect to find people who picked the other. "AI" and "Artificial intelligence" are the same thing. "Computer programming" and "Programming" are the same thing. "Climbing" and "Bouldering" are NOT — one is narrower.
- Being related, adjacent or in the same field is not enough. When in doubt, leave it out.
- Copy the option names EXACTLY as written above.
- Return at most 3.
- Return JSON only, in the form {"same": ["Option name", ...]}. An empty list is the right answer when nothing matches.`

  const output = await callGemini(prompt, {maxContextLength: 4000})
  if (!output) return []

  const parsed = JSON.parse(output) as {same?: unknown}
  if (!Array.isArray(parsed.same)) return []

  debug('check-option-name model shortlist', {name, same: parsed.same})

  // Mapped back through the candidate list by name, so a hallucinated option cannot reach the
  // reader — anything the model invented simply fails the lookup and is dropped.
  return parsed.same
    .filter((n): n is string => typeof n === 'string')
    .map((n) => byName.get(n.trim().toLowerCase()))
    .filter((c): c is OptionSummary => !!c)
}
