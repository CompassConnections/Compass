# Writing compatibility questions

Guidelines for the **content** of Compass compatibility prompts — the question text and its answer options.
Nothing here is about code. The mechanics (tables, scoring, API) are described in
[`docs/database-schema.md`](database-schema.md) and the score itself in
`common/src/profiles/compatibility-score.ts`; this doc is what a human (or an LLM drafting a batch) should
follow before adding a prompt to `compatibility_prompts`.

Companion docs: [`relationship-science-platform-ideas.md`](relationship-science-platform-ideas.md) (what the
evidence says a matching product can and cannot do) and
[`relationship-science-learning-module.md`](relationship-science-learning-module.md).

---

## What the instrument actually is

Every prompt is answered along four axes, and a good question has to work on all four:

| Axis        | Column             | What the member does                                          |
| ----------- | ------------------ | ------------------------------------------------------------- |
| Self-report | `multiple_choice`  | Picks **exactly one** option: "this is me."                   |
| Preference  | `pref_choices[]`   | Picks **any subset** they'd accept in the other person.       |
| Weight      | `importance` (0–3) | Not / Somewhat / Important / Very Important (`-1` = skipped). |
| Context     | `explanation`      | Optional free text, shown on the profile.                     |

Scoring is asymmetric and importance-weighted: A's score counts A's importance weight on the questions where
**B's** answer is inside **A's** accepted set, and vice versa; the two are combined with a geometric mean and
shrunk toward 50% until roughly 100 shared answers exist (`getCompatibilityScore`). Three consequences drive
almost every guideline below:

1. **A question only ever scores when both people answered it.** A prompt nobody answers is dead weight in
   the list and costs attention from the ones that do work.
2. **A question only discriminates if members' accepted sets differ.** If nearly everyone accepts every
   option, the item contributes score to every pair equally — pure noise with a UI cost. (OkCupid handled
   this by force-downgrading "all options acceptable" to irrelevant; we don't, so it has to be handled in
   the writing.)
3. **The member sees the question twice** — once as "me", once as "who I'd accept". Wording that only reads
   naturally in the first direction produces a confusing second screen.

### `importance_score` is a serving order, not a weight

`compatibility_prompts.importance_score` decides what a member is asked first:
`get-compatibility-questions` orders by it **descending**, so the highest number is served first and `0`
sorts last. The core set runs from 67 down to 1 and everything else sits at 0, after the whole ramp.

The name is misleading and it is worth saying plainly: **a low number means "ask this later", never "this
matters less"**. "History with addiction" carries `2` and "how many hours you want to work" carries `54`;
the first is far more load-bearing for a match. The ordering encodes _exposure_, which is the axis Aron's
procedure escalates along, and nothing else. The member's own `importance` (0–3) is the only thing that
weights the score.

---

## The honesty constraint (read this first)

The strongest finding in this literature is a negative one, and it should shape ambition rather than be
ignored. Machine learning over 100+ pre-meeting self-report measures predicted **0% of the relationship
variance** in speed-dating attraction ([Joel, Eastwick & Finkel,
2017](https://journals.sagepub.com/doi/10.1177/0956797617714580)); across 43 longitudinal couples studies
and 11,000+ couples, individual-difference variables were largely eclipsed once relationship-specific
variables were in the model — _"'who I am' doesn't really matter once I know 'who I am when I am with
you'"_ ([Joel et al., 2020, PNAS](https://www.pnas.org/doi/10.1073/pnas.1917036117)). The 2012 review of
the industry found **no compelling evidence that any matching algorithm works**
([Finkel et al.](https://www.psychologicalscience.org/publications/journals/pspi/online-dating.html)).

So a compatibility question set cannot be sold — internally or to members — as predicting whether two people
will click. What the evidence supports it doing is narrower and still valuable:

- **Screening out** structurally impossible pairings (kids, monogamy, location, religion). Dealbreakers are
  weighted more heavily than dealmakers in real mate choice ([Jonason et al.,
  2015](https://journals.sagepub.com/doi/full/10.1177/0146167215609064)), so removing hard mismatches is the
  highest-value thing the instrument does.
- **Producing perceived similarity**, which predicts attraction and satisfaction more robustly than actual
  similarity does ([Montoya, Horton & Kirchner,
  2008](https://journals.sagepub.com/doi/abs/10.1177/0265407508096700)); the actual-similarity effect fades
  to non-significance in existing relationships, while perceived similarity keeps predicting.
- **Giving people something worth talking about.** Escalating, reciprocal self-disclosure is the mechanism
  that generates closeness ([Aron et al.,
  1997](https://ggia.berkeley.edu/practice/36_questions_for_increasing_closeness)); a prompt plus a written
  `explanation` is a small instance of it.

Write questions to serve those three jobs. A question that serves none of them is decoration.

---

## The ten guidelines

### 1. Ask about values, plans and behaviour — not personality traits

Similarity in attitudes, values and background predicts stability; similarity in Big Five personality
largely does not (see the [values-vs-personality
comparison](https://www.sciencedirect.com/science/article/abs/pii/S0191886923002295) and the [longitudinal
trait-similarity null](https://www.sciencedirect.com/science/article/abs/pii/S0092656623000405)). Where
personality matters it is as a **main effect, not a match**: a partner low in neuroticism and high in
agreeableness/conscientiousness predicts satisfaction regardless of your own score ([Malouff et al.
meta-analysis](https://www.sciencedirect.com/science/article/abs/pii/S0092656609002001), partner-effect
r = −0.22 for neuroticism). Our score only knows how to reward matching, so it will systematically
mis-handle those items.

| Prefer                                                             | Avoid                                           |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| "Do you want to raise children?"                                   | "Are you an introvert or an extrovert?"         |
| "How would you want to split finances with a long-term partner?"   | "Are you more of a thinker or a feeler?"        |
| "When you're upset with a partner, what do you actually do first?" | "How agreeable would your friends say you are?" |

The rule of thumb: if a mismatch on the item would create a **recurring, concrete negotiation**, it belongs.
If a mismatch just describes two different temperaments, it doesn't.

### 2. The member must have one clear answer, not "it depends"

A prompt whose honest answer is context-dependent produces garbage in both directions. As a self-report, the
member either skips it (the item scores nothing for anyone) or picks whichever branch is salient that day —
so two identical people land on different options and lose score to each other. As a preference, the accepted
set balloons to "all of the above," which by construction contributes nothing.

The test is not "is there a nuance here" — there always is — but **would this member give the same answer
next month, and would a friend who knows them well predict it?** If the answer turns on which situation, which
partner, or which mood, the question is under-specified. Fix it by narrowing the frame until one answer is
clearly true:

| Under-specified                    | Answerable                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| "Do you need a lot of alone time?" | "After a full day with people, what do you usually need that evening?"         |
| "How do you handle stress?"        | "In a stressful week, what happens to your contact with a partner?"            |
| "Is jealousy healthy?"             | "Your partner has a close friendship with an ex. What's your honest reaction?" |

Adding a situation, a timeframe or a concrete stake is usually enough. What does **not** fix it is adding an
"it depends" option — that converts a bad question into a bad question everyone can dodge, and see guideline
#5: the dodge option is the one everyone accepts, so the item still discriminates nothing.

### 3. Ask what people can report accurately, not what only gets revealed

Compatibility questions are self-report, and self-report is only valid for things a person can actually
observe about themselves and has no strong incentive to shade. Two things break that:

- **Social desirability.** "Are you comfortable admitting when you're wrong?" has one answer everyone gives.
  Nobody selects "no, I dig in" — not because it's rare, but because nobody _sees_ it in themselves. Same for
  "Are you a good listener?", "Do you communicate openly?", "Are you emotionally available?". These are real
  and important traits; they are simply not measurable this way. They get revealed over months of behaviour,
  which is the other person's job to discover, not the questionnaire's.
- **Limited self-insight.** Stated criteria are a weak guide to behaviour — the finding that people's stated
  ideal-partner preferences predict excitement about a profile and predict essentially nothing after meeting
  face-to-face is the core of
  [`relationship-science-platform-ideas.md`](relationship-science-platform-ideas.md). Anything phrased as
  "what kind of person are you" inherits that weakness.

The workaround is to stop asking for the verdict and ask for the **observable behaviour or the stated
position** instead — something the member has direct access to and no obvious reason to misreport:

| Not answerable honestly                            | Answerable                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------ |
| "Are you comfortable admitting when you're wrong?" | "After an argument, who usually reaches out first in your past relationships?" |
| "Are you a good listener?"                         | "A partner vents about work. What do you actually do first?"                   |
| "Are you generous?"                                | "What share of your income do you give away?"                                  |
| "Are you emotionally mature?"                      | "Have you ever been in therapy, and how do you think about it?"                |

A useful heuristic: if the flattering answer is obvious, you're measuring self-presentation, not the person.
Prefer questions where every option costs the member something to admit, or where no option is flattering
because they're just different (guideline #4 again).

### 4. Every option must be one a real, likeable person would pick

This is the single most common defect in the inherited corpus. Options like _"Are you kidding? I lie, cheat,
AND steal"_ or _"Get off me!!"_ are jokes: nobody selects them, so the item collapses to a one-option
question that discriminates nothing while still consuming a slot. The same applies to trivia and IQ-test
framings — the snapshot contains seven, including _"Which is bigger? The sun / The earth"_, which measures
nothing about compatibility and reads as a screening insult.

Test: write each option, then ask "would I be comfortable being matched with the person who picked this?"
If the answer for some option is obviously no for everyone, the option is a distractor, not a choice.

### 5. Aim for options that split the population, not ones with a 90/10 answer

An item's usefulness is roughly its ability to separate people. _"Do you like to cuddle?"_ (Yes / No /
Sometimes) is the second most-answered question in the corpus and close to useless: nearly everyone answers
Yes or Sometimes and accepts both. Prefer forced trade-offs where each option has real constituency:

> Weak: "Is honest communication important to you?" (everyone says yes)
> Strong: "Your partner is upset with you but says 'I'm fine.' What do you want to happen next?"

If you can predict the modal answer with >80% confidence before shipping, rewrite the item. After shipping,
`answer_count` and the distribution of `multiple_choice` tell you which items are degenerate — retire them.

### 6. Each question must add information the others don't

The score sums importance weights across items, so two questions that measure the same thing get counted
twice. A member who marks both "Very Important" has silently given that one construct 50 points of weight
while thinking they gave 25 — and a pair who disagree on it are penalised twice for one disagreement.
Redundancy also spends the scarcest resource in the system: a member's willingness to answer more questions.

The test is predictive, not lexical. Two prompts can share no words and still be redundant: if knowing a
member's answer to Q1 lets you guess their answer to Q2 well above chance, Q2 is adding weight without adding
information. Watch for the three usual shapes:

- **Restatements** — the snapshot carries four separate items on partner intelligence ("How much can
  intelligence turn you on?", "How important is it that a partner be capable of intelligent intercourse?",
  "How important is it that your partner be willing and able to participate in meaningful philosophical
  conversations?", "Which of the following types of intelligence do you value most?"). Only the last asks
  something the other three don't.
- **A construct asked at several intensities** — a cluster of items that all reduce to "how religious are
  you?" or "how much sex do you want?" quietly turns one dimension into a dominant one.
- **Logical implications** — if answering "I don't want children" makes three downstream questions
  meaningless or foregone, those three are consuming slots.

Before adding a prompt, read the nearest existing items in its domain and ask whether you could predict the
new answer from them. If you could, either cut the new one or replace the old one with it — the set should
stay a spanning set of distinct dimensions, not a dense sampling of a few. After shipping, the same check runs
on data: cross-tabulate `multiple_choice` for candidate pairs, and retire one of any pair that agrees far
above chance.

### 7. Options must be mutually exclusive, jointly exhaustive, and single-barrelled

Members pick exactly one option for themselves, so overlapping options force an arbitrary choice and corrupt
the data. Two failure modes to check for:

- **Double-barrelled** — "I need space and I hate texting" bundles two constructs; a person who wants space
  but texts constantly has nowhere to go. Split into two questions ([NN/g on survey
  wording](https://www.nngroup.com/articles/survey-best-practices/)).
- **Missing middle / missing exit** — if a real position isn't listed, people either skip (the item scores
  nothing) or pick the nearest wrong answer (worse: it scores falsely). Include the honest "it depends" or
  "I'm still working this out" option when one genuinely exists — but see #4: it must be a position, not a
  dodge for people who didn't read the question.

Four options is a good default. The corpus runs 2–12; the 2-option items skew toward the yes/no shape that
guideline #3 warns about, and above about five the preference screen becomes tedious to fill in.

### 8. Use item-specific wording, never agree/disagree

Agree–disagree formats invite acquiescence bias — a drift toward "yes" independent of content — and the fix
is to ask about the dimension directly with a balanced set of substantive options. Where options are ordered
(frequency, importance, intensity), keep them balanced around a genuine midpoint and label every point;
don't offer three degrees of "yes" and one "no."

| Prefer                                                                                         | Avoid                                              |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| "How often do you want to see a serious partner?" → Daily / A few times a week / Weekly / Less | "I like seeing my partner often." → Agree/Disagree |

### 9. Write it so it reads correctly in both directions

The member answers "this is me", then "these are acceptable in you." Second-person, behaviourally concrete
phrasing survives both passes; first-person statements and hypotheticals about the _asker_ do not.

- Good: "How do you handle conflict in a relationship?" → works as a self-description and as "these are the
  conflict styles I can live with."
- Bad: "Would you date someone who X?" — this is _already_ a preference question. As a self-report it means
  nothing, and its preference screen ("which answers to 'would you date an atheist' do I accept?") is
  incoherent. The corpus is full of these; they should be re-cast as attribute questions ("What is your
  relationship to religion?"), which then produce the preference behaviour for free.

That last point matters more than it looks: the `pref_choices` mechanism means **every attribute question is
automatically also a preference question**. Writing an explicit "would you date…" item duplicates the
mechanism and halves the information.

### 10. Write for translation and for a small screen

Prompts are translated per locale (`compatibility_prompts_translations`) and rendered in a list on mobile.
Hard cap is 240 characters (`MAX_COMPATIBILITY_QUESTION_LENGTH`); the corpus median is 45 and that is a good
target. Avoid idiom, wordplay, culture-specific references and units that don't survive translation, and keep
options short — the median option is 14 characters, and anything past ~45 wraps badly in the preference
picker.

---

## Coverage: what the set should span

Screening value comes from covering the domains where mismatch is structural. Four categories could not be
filled from the source banks at all and had to be written — `friendship_social`, `work`, `money` and
`interests_leisure`. That is the most useful thing the last pass established: **writing beat mining by
roughly eight to one.** The 230 rewritten prompts produced 79 scoring 7+, a 34% hit rate, against 4% for
the 2770 mined originals. Live counts:

| Category             | Live | Core | Note                                                 |
| -------------------- | ---- | ---- | ---------------------------------------------------- |
| `relationship_style` | 81   | 17   | Largest by design — it absorbed conflict and growth  |
| `values_worldview`   | 55   | 5    | Also carries care and obligation                     |
| `politics`           | 36   | 4    |                                                      |
| `kids_family`        | 34   | 6    | Highest dealbreaker value                            |
| `interests_leisure`  | 33   | 3    | Low screening value; capped deliberately             |
| `money`              | 21   | 4    |                                                      |
| `daily_rhythm`       | 21   | 3    |                                                      |
| `work`               | 20   | 5    |                                                      |
| `location_mobility`  | 18   | 4    | A pure structural dealbreaker                        |
| `religion`           | 17   | 4    |                                                      |
| `friendship_social`  | 17   | 5    | Had to be written, not mined — the banks had nothing |
| `sex_intimacy`       | 15   | 4    |                                                      |
| `health`             | 15   | 3    |                                                      |
| _(none)_             | 6    | 0    | Fit no domain; retirement candidates                 |

389 prompts live as of 2026-09-10; 67 of them carry a non-zero `importance_score` and form the ramp.
The live number exceeds the 277 that were selected because prompts predating the selection are still
there — `redundancy_review.md` lists which of those duplicate something better.

Two notes on shape:

- **Order the set by escalation.** Aron's procedure works because disclosure escalates; a member's first ten
  questions should be low-stakes and high-coverage, and the vulnerable items should come later, once they
  have something invested. `importance_score` is the lever, and it carries two things: non-zero marks a
  prompt as **core** (0 is everything outside the core set), and among the core prompts the number is the
  serving priority, **highest first** — the largest score opens the run, and the scores descend as the
  questions get more vulnerable. The answering dialog serves the core prompts in that order with no sort control, then
  shuffles the
  rest; `get-compatibility-questions.ts` orders the same way.
- **The `category` column is now populated**, from one fixed vocabulary:
  `COMPATIBILITY_CATEGORIES` in [
  `common/src/profiles/compatibility-categories.ts`](../common/src/profiles/compatibility-categories.ts).
  Every prompt gets exactly one key, and a new prompt should be filed under one when it is added —
  that is what makes the coverage table above measurable instead of a keyword guess, and it is a
  prerequisite for balanced serving. Members see it as a tag and can filter the list by it.

  | Key                  | Covers                                                                                                                          |
  | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
  | `kids_family`        | Wanting children, raising them, marriage, family obligations                                                                    |
  | `relationship_style` | Monogamy, pace of intimacy, what a working relationship looks like — and how you argue, repair and regulate yourself inside one |
  | `money`              | Spending, saving, debt, consumption, minimalism, what things are worth                                                          |
  | `work`               | Ambition, hours, career, what work is for                                                                                       |
  | `politics`           | Political position, policy attitudes, social norms                                                                              |
  | `religion`           | Religious position and practice, the metaphysical commitments behind it                                                         |
  | `values_worldview`   | Ethics in practice and what you owe people: honesty, transgression, meaning, animals, climate — and showing up in a crisis      |
  | `sex_intimacy`       | Sex and physical intimacy                                                                                                       |
  | `location_mobility`  | Where you live, moving, distance, travel                                                                                        |
  | `health`             | Substances, exercise, diet, physical health                                                                                     |
  | `daily_rhythm`       | Sleep, routine, tidiness, the shape of an ordinary day                                                                          |
  | `friendship_social`  | Solitude, social load, few-deep vs many-casual ties                                                                             |
  | `interests_leisure`  | Hobbies, sport, art, media, taste                                                                                               |
  | `trivia`             | The retire bucket — see guideline #4, not a domain to grow                                                                      |

  Four of the merges and splits are deliberate and worth stating, because the obvious taxonomy is
  the other one. **Conflict and communication is not separate from `relationship_style`** — how two
  people argue and repair is the largest part of what their relationship is, and split out it just
  produced two categories competing for the same item. **Self-regulation and growth went the same
  way**, since they only reach a partner through that channel; growth that is really about work
  files under `work`. **Care and obligation is inside `values_worldview`**, being that same question
  asked about someone specific. And **health is split from daily rhythm** because they do different
  jobs: substances and fitness screen (an unhealthy lifestyle is a top measured dealbreaker), while
  sleep and routine predict daily friction — merged, the dealbreakers lose slots to the logistics.

---

## Checklist before adding a prompt

1. Do I have a clear answer?
2. Can I predict the modal answer with >80% confidence? (If yes — rewrite.)
3. Could I predict a member's answer here from their answers to existing prompts in the same domain? (If yes
   — cut it, or replace the older item with this one.)
4. Is it substantive wording, not agree/disagree, with a balanced scale if ordered?
5. Under 240 characters (target ~50), translatable, options under ~45 characters?
6. Does it fill an under-covered domain rather than adding a twentieth sex question?
7. Does the answer have at least a small chance to predict compatibility for long-term partners?

## Maintaining the set

The set should shrink as often as it grows. Retire a prompt when the answer distribution is degenerate
(>85–90% on one option — usually a social-desirability item that guideline #3 should have caught), when the
accepted-set distribution is degenerate (nearly everyone accepts nearly everything — usually an "it depends"
item, guideline #2), when its answers are predicted far above chance by another prompt (guideline #6 — keep
the better-worded one), when the skip rate is high relative to its exposure, or when `answer_count` stays low
after sustained exposure. Members mark importance themselves, so `community_importance_score` is a direct
read on which items people think are load-bearing — an item that is widely answered but universally marked
"Not Important" is a conversation piece, not a matching signal, and should be judged on that basis rather
than kept for the score.

## How the current set was chosen

_Done as of 2026-09-10. Kept because the next pass will face the same problem, and because most of the
numbers below are arguments about method rather than facts about one corpus._

The pool was 2620 OKC items (`okcupid_questions_all.xlsx`), 220 live prompts, 144 from datefirefly and
293 from Manifold — 3103 after merging questions whose text matched. 277 were selected, 67 of them core.
Everything below ran out of `martin/compatibility_prompts/`: `build_candidates.py` pooled and
deduplicated, `cluster_candidates.py` scored and grouped, `build_selected.py` produced the final sheet
and the escalation ramp, and `2026-09-10-import-selected-compatibility-prompts.ts` wrote it to the
database.

### Two facts that set the shape of the job

**Mechanical filters barely dent it.** Dropping the 14 flagged IQ items, the 86 malformed ones, everything
under 5000 OKC respondents, the "would you date…" shapes and the agree/disagree options takes 2620 to
**1936** — a 26% cut. Getting from there to 300 is a judgement problem, not a filtering one, and no amount
of regex will do it.

**The first 50 questions do nearly all the work.** `getCompatibilityScore` shrinks a pair's score toward
50% by `max(25 - 2.5·√n, 0)`. A pair who have each answered 40 questions is scored on a shrunk number no
matter how good questions 200–300 are, and in practice almost nobody reaches the far end of the set. So
the 300 is really **a core 50 that must be excellent and a tail of 250 that must merely be harmless**,
and effort should be spent in that ratio.

Two consequences of stopping the core at 50 rather than at the shrinkage constant. The penalty term is
still **7.3 points** at 50 shared answers, against 0 at 100 — whether that matters depends on how members
weight importance, since the term is in points and `maxScore` runs from 50 (all "Somewhat Important") to
1250 (all "Very Important") over the same 50 answers. And a pair who finish the core still read as
`medium` confidence, because `getCompatibilityScore` only returns `high` at 100. If the core is the
intended finish line, that threshold is worth moving to match it.

### Budget first, selection second

Fix the per-category allocation before reading a single candidate, otherwise the shape of the final set is
decided by whatever the source bank happened to be heavy on — which is sex, politics and religion, in that
order, in every source here. 300 slots against `COMPATIBILITY_CATEGORIES`:

| Category                                                                       | Slots   | Candidates available     |
| ------------------------------------------------------------------------------ | ------- | ------------------------ |
| `relationship_style`                                                           | 60      | 454                      |
| `values_worldview`                                                             | 35      | 195                      |
| `kids_family`                                                                  | 30      | 239                      |
| `money`, `work`, `politics`, `sex_intimacy`, `friendship_social`               | 20 each | 96 / 51 / 172 / 347 / 38 |
| `religion`, `health`, `daily_rhythm`, `location_mobility`, `interests_leisure` | 15 each | 93 / 83 / 66 / 74 / 378  |
| `trivia`                                                                       | 0       | 15                       |

`relationship_style` takes the largest share because it absorbed conflict, communication and
self-regulation, which together are most of what a long-term relationship consists of.

The candidate counts come from `candidates.xlsx`, and two of them are a problem rather than a
reassurance: **`friendship_social` has 38 candidates for 20 slots and `work` has 51**, so those quotas
cannot be filled selectively — the shortlist is barely longer than the quota, and those questions have to
be written rather than chosen. At the other end `interests_leisure` offers 378 candidates for 15 slots
and `sex_intimacy` 347 for 20, which is what the budget exists to hold back.

### The passes, in order

Scripts for all of it live in `martin/compatibility_prompts/`.

1. **Pool and deduplicate by text** — `build_candidates.py`. Reads the live export, the OKC bank,
   datefirefly and Manifold, merges questions whose text normalises identically into one row that
   records every source it came from, flags near-identical wordings without merging them, and seeds a
   category. Output is `candidates.xlsx` / `.csv`. There is deliberately **no mechanical filter pass**:
   a filter that drops a question on respondent count or option count is guessing at the thing the next
   pass measures directly, and it drops rows nobody ever looked at.
2. **Score every candidate 0–10** against `scoring/RUBRIC.md`, which is the eleven-point checklist with
   anchors at 0, 2, 4, 6, 8 and 10. The score answers one question — _how well does this belong on
   Compass, assuming it is not redundant_ — because redundancy is the next pass's job and mixing the two
   makes both unreliable. Scorers also assign a category to every row, including the quarter the regex
   could not place.
3. **Rewrite rather than reject, where the wording is the only problem.** A question worth asking whose
   framing is agree/disagree, or "would you date…", or double-barrelled, scores **0** and the scorer
   emits a **new row** with better wording and its own score. Both stay in the file, so the rewrite is
   auditable against what it replaced and wins on score rather than by assertion.
4. **Cluster by construct, not by distance** — `cluster_candidates.py`, over rows scoring **6 or
   above** only. Clustering is compute spent to choose between things worth choosing between, and a
   cluster of 2s decides nothing; everything below the floor stays in the file unclustered.

   Embedding distance was tried first and does not work for this. On eleven hand-built pairs, static
   embeddings scored _different_-construct pairs **higher** than same-construct ones (0.71 vs 0.55 —
   the signal points the wrong way), and doubling the dimensions from 256 to 512 changed the
   separation by exactly nothing. OpenAI's `text-embedding-3-large` gets the direction right (0.61 vs
   0.52) but never separates cleanly: "Do you have a child or children?" and "Do you want to have
   children?" sit at 0.66, above four genuine restatements. That is not a tuning problem. Whether two
   prompts measure the same thing is a judgement, and lexical near-identity with opposite meaning is
   exactly the case a distance cannot see.

   So an LLM labels each prompt with the construct it measures — `desired_number_of_children`,
   `alcohol_frequency` — and rows are grouped by that tag. The hard cases resolve by construction:
   `has_children` and `wants_children` are simply different strings. Embeddings still run, but over
   the **tags**, which are short and canonical, and only to merge vocabulary that drifted between
   labelling agents (`wants_kids` vs `desired_children`).

5. **One pick per construct, and nothing is deleted.** The highest-scoring member is marked
   `clustered = TRUE`. Every other row stays, so a pick can be overruled by seeing what it beat. The
   sheet sorts picks first, then category, then score, so the shortlist is the top block and reads one
   category at a time. `include` is the column for the human pass: `x` to take a prompt into the 300,
   `c` to take it into the core 50.
6. **Fill each quota from the top of its category, core 50 first.** The core 50 must cover every
   screening domain and lead with low-stakes items — Aron's escalation, via `importance_score` ordering.
   Fifty slots against fourteen categories is roughly three or four each, so the core is the budget in
   miniature and the thin domains have to be represented in it rather than deferred to the tail.

Two things the scores cannot do. They cannot predict **modal-answer share**, which is guideline #5's
real test — an LLM has no idea what fraction of members will pick each option, so every share estimate
stays a guess until `/admin/compatibility-questions` settles it from live answers. And they carry the
scorer's judgement, not measurement: treat the ranking as a way to read 3000 candidates in a sensible
order, not as a verdict.

### Removing the existing ones is a different decision

Deleting a live prompt destroys every answer to it, so the bar for **removing** something that already
exists is higher than the bar for **not adding** a candidate — a mediocre prompt with 300 answers is worth
more than an unproven better one. Delete only for cause: it is `trivia`, it is degenerate on the numbers
in `/admin/compatibility-questions`, or a strictly better-worded item covers the same construct. Anything
else that is merely unexciting can stay until the 300 is otherwise full, and then lose its slot on rank.

Sequence the execution so the destructive part happens once: assemble the target set as a single pass over
the union rather than "remove, then add"; add the new prompts; then do **all** deletions in one batch and
press _Rebuild all pair scores_ once at the end. Every deletion before that leaves cached scores stale on
purpose, which is what makes batching safe.

### What is left

- [x] Clear proposal
- [x] Write blog article
- [ ] **Settle the shares that are still guesses.** Every modal-answer estimate in the scoring pass was
      an LLM's judgement; `/admin/compatibility-questions` measures the real thing once members answer.
      That is guideline #5's actual test, and nothing before it substitutes.
