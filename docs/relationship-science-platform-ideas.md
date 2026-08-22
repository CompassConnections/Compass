# Platform ideas from _Bonded by Evolution_

Derived from Paul Eastwick, _Bonded by Evolution_ (Crown, 2026). The full text and a long summary are in
[`martin/resources/bonded_by_evolution.md`](../martin/resources/bonded_by_evolution.md); the companion
member-facing curriculum is
[`docs/relationship-science-learning-module.md`](relationship-science-learning-module.md).

This is a design argument, not a backlog. It follows the same conventions as
[`feature-ideas.md`](feature-ideas.md) — idea, why it fits, sketch against the current codebase, effort —
but every entry is anchored to a measured finding, and each says plainly where the finding stops and the
extrapolation starts. Nothing here is scheduled.

**Status: draft. Nothing here is in the app.**

---

## The brief, restated

Compass's stated mission is transparent, intentional 1-on-1 connection. The book's contribution is a
specific, evidenced claim about _which mechanism_ produces that, and it is not the one almost every dating
product is built around:

| The mechanism most products assume            | What the evidence supports                                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| People have a desirability level; sort by it. | Agreement about desirability falls to **53%** — barely above chance — among people who actually know someone.    |
| State criteria, filter, meet the survivors.   | Criteria predict excitement about a **profile** and predict **nothing** after five minutes face-to-face.         |
| A better algorithm finds better pairs.        | Machine learning on rich pre-meeting data predicted compatible speed-dating pairs at **0%**; **≤2%** in couples. |
| Efficient evaluation of many candidates.      | Sequential browsing induces a **rejection mindset**; more options → less satisfaction, more deferral.            |
| Meeting is the product.                       | **>80%** of relationships among under-30s and LGBTQ people are friends-first; the median gap is **~a year**.     |

Two consequences run through everything below.

**First: the profile is a weak instrument and the platform should say so.** Not because Compass's profiles
are bad — they are the richest in the industry — but because _no_ pre-meeting representation of a person
predicts compatibility. The differentiated move available to Compass is not a better profile. It is being
the one platform honest enough to tell members what a profile can and cannot do, and to design the funnel
around getting past it quickly.

**Second: the highest-leverage thing Compass can do for a member is change who is around them, not who is
shown to them.** The book's own summary of the only lever an individual has: _"the decision about who fits
within your field of eligibles is your primary avenue for exerting control over how your romantic life will
unfold."_ A search engine over 726 dispersed people optimises the _shown-to_ problem. A product that helps a
member acquire a denser, more gender-diverse local network attacks the _around-them_ problem, which is
where the effect sizes actually are.

---

## What Compass already gets right

Worth stating, because several of these are things the book argues for and nobody else ships, and because
the ideas below should not accidentally undo them.

- **No swiping, no gamification.** The book blames the mid-2010s collapse of friend-mediated meeting on
  gamified app interfaces specifically — "you're not supposed to make a choice and log off; you're supposed
  to keep playing." Compass has no swipe loop, no streaks, no boosts, nothing to pay for.
- **One like per day.** Scarcity makes a like informative. This is the single most book-aligned mechanic
  already in the product.
- **200-character minimum first message.** Forces the sender to say something specific about the
  recipient — which is the behaviour the "be an audience, don't require an audience" finding recommends.
- **Search over ranking.** No hidden desirability ordering means no engine that reifies mate value.
- **Friendship and collaboration as first-class `RELATIONSHIP_CHOICES`** (`common/src/choices.ts`). The book
  says this is not a consolation prize; it is the highest-yield path to romance _and_ the actual treatment
  for loneliness.
- **Free-text search over bios.** Traits are elastic and subjective ("exciting" means energising or reckless
  depending on whether you like the person); prose about behaviour is the better signal, and Compass already
  searches it.
- **Published stats and financials.** The credibility needed for several ideas below already exists.

---

## The ideas, by leverage

### 1. Reframe filters from screens to lenses — and show what they cost

**Finding.** In Eastwick's experiment, participants saw a profile written to match or mismatch their own
stated ideal traits. On the profile, the matching version produced a **medium-sized** boost in excitement.
After a **five-minute** face-to-face interaction, the two groups were **statistically identical**. Separately:
your three "must-haves" predict your happiness no better than a _stranger's_ three must-haves; all
ideal-partner preferences across 35 traits explain maybe **3–4%** of compatibility, and only in aggregate.
Meanwhile filters don't merely narrow the pool, they _raise expectations about the survivors_, which is the
mechanism behind choice-overload dissatisfaction.

**Why it fits.** Compass has ~25 filters ([`filters.md`](filters.md)) and this is a genuine strength for
_discovery_. The problem is that the UI presents all 25 as equivalent gates, when the book distinguishes two
categories that behave completely differently:

- **Structural criteria** — location, age, `RELATIONSHIP_CHOICES`, relationship style, wants-kids. These
  encode life-goal trade-offs that the book explicitly says filtering _is_ the right tool for: _"if you are
  certain you don't want kids, don't surround yourself with people who are certain they do."_
- **Taste criteria** — MBTI, Big Five ranges, diet, drinks, education, politics, religion, interests. These
  are exactly the dimensions where similarity-matching and preference-matching were measured at ~zero.

**Sketch.**

- Group the filter panel into **"Things you can't compromise on"** and **"Things you're curious about,"**
  with the second group visually lighter and collapsed by default. This is a re-ordering of
  `web/components/filters/`, not new data.
- Next to each active taste filter, render the count it removed: _"Politics: excluded 41 profiles."_ The
  count already has to be computed to render results; surfacing it converts an invisible decision into a
  visible one.
- A single honest line at the top of the panel, i18n'd like everything else: _"Filters are good at finding
  people. They're bad at predicting who you'll click with — in one study, matching someone's stated ideals
  raised interest in their profile and made no difference at all after five minutes in person."_
- A **"loosen my search"** button that drops the taste filters in one click and shows what appears.

**Effort.** Small-to-medium — UI grouping, one count per filter, copy and translations.

**Risk.** Members may read it as the platform second-guessing them. Mitigate by never removing a filter
automatically; show the cost, let them decide.

---

### 2. Publish honest calibration of the compatibility score — then measure it

**Finding.** Trait-and-preference matching has a measured ceiling: 0% success predicting compatible
speed-dating pairs from rich pre-meeting data, ≤2% in established couples, 3–4% for full 35-trait ideal
matching. Single-trait matching contributes essentially nothing. Love-language matching — the most famous
matching claim in popular culture — has **no** effect on satisfaction when measured properly.

**Why it fits.** `common/src/profiles/compatibility-score.ts` is preference matching. It is honestly built
(it already shrinks toward 50% when few questions are answered, uses a geometric mean of both directions, and
exposes `confidence: 'low' | 'medium' | 'high'`), and the marketing position — _"you set the weights and you
can read the source"_ — is already the right one. But it has one property the book flags: `importance: 3`
weights a **single** question at 25 points, i.e. 25× a `1`. A member can make one question dominate their
score, which is precisely the "must-have" pattern shown not to work.

This is Compass's single best opportunity to do something no competitor can. Every platform claims a great
algorithm; none publishes evidence. Compass publishes `/stats` and `/financials` already.

**Sketch.**

- **Say the size.** Wherever the score renders, one line: _"Compatibility scores are a discovery tool, not a
  prediction. The best research finds that matching on stated preferences explains only a few percent of who
  actually clicks."_ This is more persuasive than a bigger claim, on a platform whose thesis is honesty.
- **Reward breadth over intensity.** Keep `importance: 3` but surface a gentle counter — _"you've marked 14
  questions as essential; scores get more meaningful from breadth than from weight."_ The evidence supports
  aggregate matching and not single-trait matching, so nudging breadth is nudging toward the only version
  that works.
- **Run the study.** Log, with consent, `(score at first contact, confidence) → (did a conversation continue
past N exchanges, did both parties confirm they met, is either still active with the other)`. After enough
  pairs, publish the correlation on `/stats` whatever it turns out to be. If the score explains 3% of
  outcomes, saying so publicly is a stronger marketing asset than any claim a VC-funded competitor can make —
  and it is a genuine, publishable contribution to a literature where the book notes commercial platforms
  _never_ share data.

**Effort.** Small for the copy and the nudge. Medium-to-large for the measurement, and it needs a consent and
privacy design (aggregate-only, opt-in, no per-member exposure) — plausibly a governance question.

**Risk.** The result might be that the score predicts nothing. That is a real risk and it is also the point:
a platform whose constitution is about transparency should be able to publish a null result about its own
feature. Decide before running whether you'd ship the null.

---

### 3. Make "introduce two members" a first-class action

**Finding.** ~30% of couples met through mutual friends for half a century, until apps overtook it around
2013; **65% of people still say meeting through friends is the best way and 1% say online is**. Eastwick's
concrete proposal is a "used date party": everyone brings someone they matched with but didn't click with,
because _"your 'meh' is surely someone else's 'mm-hmm.'"_ Online dating's defining novelty, in his framing, is
that it **disintermediates your friends** — it made pairing a solitary activity for the first time in the
history of the species.

**Why it fits.** This is the highest-leverage idea in this document and, as far as I can tell, nobody ships
it. It converts the network effect Compass most needs (density) from a growth problem into a _member
behaviour_, and it is the one mechanic that structurally advantages a small, values-aligned, community-owned
platform over a large market: introductions require that members care about each other, which is exactly what
Compass has and Tinder does not. Compass already has the raw material — profile comments, a referrals page, a
membership small enough that people actually know each other.

**Sketch.**

- A **"suggest to a friend"** action on a profile, opening a short note field: _"I thought of you because…"_
  Sends a notification to the recipient with the suggested profile and the note. Requires the suggester to
  write something (reuse the 200-character floor's rationale, though a lower bar is fine here).
- **Consent is the whole design.** A `allow_introductions` profile flag alongside `allow_direct_messaging`
  and `allow_interest_indicating`, and reciprocity per the principle already established in
  [`feature-ideas.md` §2.4](feature-ideas.md): if you opt out of being introduced, you don't get to introduce.
  Never expose to the introduced person that they were "passed on" — the note is about the _recipient_, not
  the subject, and the subject is never told an introduction happened unless the recipient acts.
- **Rate-limit hard.** Introductions must stay expensive to be meaningful, exactly like the one-like-a-day
  rule. One or two a week.
- **Credit it.** A visible count of introductions that led to a conversation, on the member's own profile if
  they want it — the one reputation signal on the platform that rewards generosity rather than desirability.
  Aligns with [`reputation.md`](reputation.md).
- **Then the offline version:** a page and an email template for members to host a local "bring someone you
  didn't click with" evening. Costs nothing to build and is the highest-conviction recommendation in the book.

**Effort.** Medium. One table, one API endpoint, one notification type, one settings flag, moderation reach.

**Risk.** Introductions can be creepy or coercive if the subject can be traded around without knowing.
The consent flag and the never-notify-the-subject rule are load-bearing, not polish.

---

### 4. Design the funnel around three impressions, not one

**Finding.** In the thousand-crushes dataset, first impressions are only modestly predictive of later
feelings. Stability **jumps enormously at the second impression** and improves again at the third; after that,
diminishing returns. Eastwick's operational advice: decide after the **third** impression, and make the three
_different activities_, at most one of them a short coffee. His definition of an impression is worth quoting
because it is not "did I like them": physical attraction, how they make you feel, how much you enjoy being
around them, and **how you feel about yourself when you're with them** — "someone whose positive qualities
feel contagious, not someone who makes you feel small."

**Why it fits.** Compass has no swipe loop, so the discard decision happens quietly — a conversation dies, a
member archives a thread. The platform currently has no opinion about when that decision should be made. The
book has a specific, evidenced one.

**Sketch.**

- When a member ends or archives a thread after a single exchange, a **dismissible** card: _"You've had one
  impression. Research on how feelings actually change says the second tells you far more than the first."_
  Never blocking, never nagging — offered once per thread.
- A lightweight, private **impression log** on a conversation: after each meeting, the member records how it
  went — with the prompt being _"how did you feel about yourself?"_, not _"rate them."_ Private to the member,
  never shown to the other person, never aggregated into a score. This is a journaling affordance, and it is
  the one place the book's fourth criterion can actually be surfaced.
- **Activity suggestions, not venue suggestions**, on a thread that has agreed to meet: cooking class, dance
  class, skating, tasting, karaoke, a match — drawn from the pair's shared interests. Complements
  [`feature-ideas.md` §1.4](feature-ideas.md) directly. Eastwick's line is usable verbatim in the copy:
  _"Don't schedule your dates on Tuesdays — when nothing in town is open — and then wonder why your dates
  are boring."_

**Effort.** Small for the card. Small-to-medium for the private log (one table, one UI panel).

**Risk.** Telling someone to give a second chance to a person they didn't like is patronising at best and
unsafe at worst. The copy must be about _your own predictions being noisy_, never about the other person
deserving another shot, and it must never appear on a thread that was blocked or reported.

---

### 5. Build recurring local groups, not events

**Finding.** What works against loneliness at population scale, per the interventions Eastwick reviews, is
**groups that meet consistently and events that recur** — because the mechanism is familiarity-breeds-liking,
which requires repetition. (Randomly assigned classroom seating produced ~20× more liking on day one and more
friendships by year's end; randomly assigned repeated conversations increase liking each time.) One-off events
don't have this property. Also: in-person beats video and text for well-being, and anything mutual beats
passive scrolling.

**Why it fits.** `web/pages/events.tsx` exists with RSVP support, and [`marketing-copy.md`](marketing-copy.md)
notes `upcomingEvents` is 0 — so there's a shipped surface with no supply, which is the cheapest possible place
to change the model. And the dispersion problem is Compass's central structural weakness: 55 countries across
~726 members means "nobody near you" for most members. Recurring groups are how a thin, dispersed membership
becomes a thick local one.

**Sketch.**

- Add **recurrence** to the events model (weekly/fortnightly/monthly), and make a recurring series the
  default creation flow rather than a one-off.
- **Two-person minimum, not twenty.** A recurring walk between two members in the same city is a valid group.
  The threshold that kills community features is requiring a crowd.
- **Non-romantic by default.** A group is for the activity. The book's finding is that being around people is
  what produces relationships; the mechanism breaks if the group is framed as a singles mixer.
- Wire to the local-density work already described in [`feature-ideas.md` §4.1](feature-ideas.md): when a
  member's city has ≥N members, prompt _one_ of them to start something recurring, rather than waiting for a
  volunteer.
- **Service-to-others** as an explicit event category — the interventions that work at scale gather people
  _in the service of others_, not just around a shared hobby.

**Effort.** Medium — recurrence on the events table, series UI, a prompt keyed off `getLocalDensity`.

---

### 6. Name mixed-gender friendship as an outcome the platform is for

**Finding.** People with more gender-diverse friendship networks are **more likely to find a romantic
partner over time** — and for straight people the number of _same_-gender friends is **irrelevant** to
romantic prospects. Straight men with more female friends are measurably less sexist and less likely to
objectify women. Friends-first characterises >80% of relationships among under-30s and LGBTQ people, and even
app-initiated relationships follow a friendship-then-romance sequence most of the time. The base rate is
sobering and worth stating: only **1–5%** of cross-gender acquaintances ever turn romantic, and when they do
it takes about a year.

**Why it fits.** `RELATIONSHIP_CHOICES.Friendship` already exists and, per
[`marketing-copy.md`](marketing-copy.md), around half of members select it. But the product's centre of
gravity, its copy and its name still read as a dating platform where friendship is the fallback. The evidence
says friendship is the **main road**, and saying so converts Compass's biggest apparent weakness (a small,
dispersed pool where romantic matches are rare) into its actual strength (a values-aligned pool where making a
friend is easy and high-value on its own terms).

**Sketch.**

- **Honest expectation-setting in onboarding** (`web/pages/onboarding/index.tsx`), stated as base rates
  rather than encouragement: how rare romantic pairings are per acquaintance, how long friends-first takes,
  and therefore why the platform is built the way it is. This is exactly the register
  [`marketing-copy.md`](marketing-copy.md) already argues for with the early-stage-honesty section, extended
  from "how big we are" to "how this actually works."
- A member's own **network view**: how many people they've had a real exchange with, not how many matches
  they have. The book's counter-metric to popularity.
- Copy discipline everywhere: never describe friendship connections as "just" friends or as a lesser tier.
- The one caveat the book insists on, and the copy must carry it: **don't befriend someone with ulterior
  motives.** Mutual gradual attraction is about twice as common as one person successfully wooing the other
  out of a friendship. Friendship-as-strategy is both dishonest and a bad bet.

**Effort.** Small — mostly copy, translations, and one stat.

---

### 7. Prompt for behaviour and green flags, not adjectives

**Finding.** Traits are "abstract and flexible" — believing "exciting" matters is by itself enough to make you
see your partner as exciting, and the same word means _energising_ or _reckless_ depending on whether you
already like the person. Eastwick's replacement: _"it's more useful to focus on the way a person's behaviors
make you feel."_ And on evaluation: _"rather than worrying about whether someone has red flags, focus on
whether their green flags are a draw… do they have two or three qualities that you would want to build a
relationship around?"_

**Why it fits.** Compass already searches bio prose, already has prompt answers, and already has bio-writing
help (`/tips-bio`, the bio editor, `llm-extract-profile`). This is a change to _what the prompts ask for_, not
new machinery — and it makes free-text search materially better, because searching prose about behaviour
returns something searching adjectives cannot.

**Sketch.**

- Rewrite the prompt set toward specifics and stories: _"Describe an ordinary Saturday you were happy with,"_
  _"What's something you changed your mind about?"_, _"What would someone notice about you in the first hour
  that they wouldn't guess from this page?"_ Reuse the existing prompts pipeline.
- Add one deliberate field: **"Two or three things someone could build a relationship around."** It is the
  green-flag question, it is answerable honestly, and it reads better than any adjective list.
- Update `/tips-bio` guidance: adjectives are unsearchable and unfalsifiable; concrete behaviour is both.

**Effort.** Small. Prompt copy, one optional field, translations.

---

### 8. Measure meetings and friendships, not messages

**Finding.** The book's whole account says the outcome that matters is a bond that formed — and that the
predictors of it are invisible until people meet. Message volume measures the phase where mate value still
dominates.

**Why it fits.** [`feature-ideas.md` §3.4](feature-ideas.md) already proposes a mutual "we've met"
confirmation, and this book is the strongest possible argument for it. Extend it: Compass is the only platform
that could publish **"connections that became friendships"** alongside **"dates that happened."** Given that
half the membership selects friendship, and given that friendship is the evidenced main road to romance,
publishing only romantic outcomes would misdescribe the platform's own value.

**Sketch.** As in §3.4 — double opt-in, aggregate-only on `/stats`, never public per member, dismissible —
plus a second confirmation type for a friendship that formed. Both feed §2's calibration study.

**Effort.** Medium.

---

### 9. Anti-rejection-mindset ergonomics

**Finding.** People are **most open-minded at the moment they start browsing** and become progressively more
rejecting: each reason to rule one person out is added to the list applied to everyone after. More options →
less satisfaction with the eventual choice and more deferral of choosing at all. Tinder users report elevated
appearance concerns and body shame relative to non-users. Users spend ~90 minutes a day being looked at for
5–10 seconds each. And the interface effect is enormous: at speed-dating events men say yes ~50% and women
~35% (a small gap), while on Tinder men swipe right ~50% and women ~5% — the same species, a tenfold
difference, produced by the medium.

**Why it fits.** Compass has no swipe loop, but it _does_ have long result lists, and long sequential
result lists are the mechanism, not swiping specifically.

**Sketch.**

- **Short result pages** with an explicit "show more" rather than infinite scroll — the rejection mindset
  builds over a session, and a break in the sequence interrupts it.
- A **soft roster cap** matching the book's advice: _"date fewer people from a wider pool."_ Surfaced not as a
  rule but as a status the member sets — "focused on a few right now" — and reciprocal, per the general
  principle in [`feature-ideas.md` §2.4](feature-ideas.md). Overlaps §2.1/§2.2 there; this book supplies the
  evidence those entries were missing.
- **Never ship a popularity signal.** No like counts, no view counts, no "most viewed" ranking, no
  desirability-ordered feed. Given that agreement about desirability among people who know you is 53%, any
  such number is close to noise presented as a verdict, and the body-shame finding says what it costs. Worth
  writing into the constitution's transparency language explicitly — the _absence_ of a metric is a design
  commitment that should be as legible as its presence.
- **A text-first browsing mode**, opt-in, where photos load on request. Justification is mechanical, not
  moral: photographs are the one context where consensus about attractiveness is at its maximum, and it decays
  from there. Offering members a mode that starts them further along the curve is defensible; imposing it is
  not.

**Effort.** Small each.

---

### 10. Norms and moderation as a designed feature, not a policy page

**Finding.** The most consequential natural experiment in the book: Alana's 1997 forum for people struggling
to date had explicit norms — repetitive complaining discouraged, misogyny banned outright, growth through
self-reflection, connect over loneliness rather than anger. It worked. When she left and the angry users moved
to **unmoderated** forums, the same population and the same label produced an ideology now linked to mass
violence; the share of mass shootings motivated by misogyny has quadrupled since 2014. Same people, different
norms, opposite outcome.

**Why it fits.** Compass has a constitution, governance votes, and a small membership — the conditions under
which norms are actually enforceable. And a platform explicitly about intentional connection will attract
exactly the people who are struggling, which is the population Alana was serving. This is an opportunity as
much as a risk: Compass could host the thing that has been missing since 1997.

**Sketch.**

- A **moderated, opt-in space for people finding this hard** — rejection, loneliness, long dry spells — with
  Alana's rules adopted more or less verbatim as the posted norms. The failure mode is well documented and
  the antidote is known: active moderation and a growth-oriented rather than grievance-oriented frame.
- **Audit the platform's own language** for EvoScript framing — "your match value," "top picks," anything
  implying a ranking or a market. The book's finding that plain, uncaveated evolutionary framing makes
  ordinary readers more fatalistic applies to product copy too.
- Fold the myth-busting into the safety page proposed in [`feature-ideas.md` §3.2](feature-ideas.md), and
  point at the learning module.

**Effort.** Small to build, ongoing to moderate. The moderation cost is the real cost and should be decided
deliberately — an under-moderated space is worse than none, which is precisely the lesson.

---

### 11. Surface the dispersal option honestly

**Finding.** Ancestral bands of 35–80 people randomly went sex-ratio-lopsided, and humans are unusual in
dispersing **flexibly in both directions** to fix it — the Savannah Pumé study tracked young people moving
between groups toward wherever partners were more numerous, over a half-day's walk. Eastwick's own move from
New York to Chicago improved his dating life while his "mate value" went _down_ (he was poorer), purely
because the network was new. And: _"friends are mirrors that reflect a particular version of ourselves back
at us."_ He states plainly that moving is a privilege.

**Why it fits.** Compass already computes local density and emails members their city number. The book turns
that number from a growth metric into _advice_, and it is advice no commercial platform will ever give,
because it points members away from the product.

**Sketch.**

- On the member's own home page, alongside their city number: **which cities have the most members**, and how
  many members are open to relocating. This is arithmetic on existing data.
- An optional profile field for **relocation openness** and **travel frequency** — genuinely structural
  information for a membership spread over 55 countries, and currently invisible.
- Frame it in the honest register the rest of the site uses: _"Members in your city: 3. If your networks feel
  fossilised, changing them is a real option — and it's the one humans have used for a very long time."_

**Effort.** Small-to-medium.

---

## What the book argues _against_ building

Recorded so these don't get proposed later on intuition.

- **A better matching algorithm.** The measured ceiling for trait-based matching is 0–4%. Effort spent here
  has a known, tiny upper bound. (This does not condemn the existing compatibility score, whose job is
  discovery and conversation-starting; it condemns _investing more_ in it as a prediction engine.)
- **Personality-typology matching** (MBTI complementarity, Big Five fit, love-language matching, "opposites
  attract"). All measured at approximately zero. Keep MBTI and Big Five as _search_ fields people enjoy; never
  build matching logic on them.
- **Similarity-weighted ranking.** The similarity in real couples is proximity, not preference — once you
  control for the local pool, the similarity among a person's own exes disappears entirely.
- **Anything that ranks members by desirability**, including implicitly: engagement-ordered feeds, "popular
  this week," reply-rate scores shown to members.
- **Gendered product logic** — different defaults, prompts or funnels for men and women. Revealed preferences
  are the same; the one real difference (women's wariness of strangers) is a _safety_ problem, which Compass
  should address as safety, not as a preference model.
- **Optimising for messages sent.** It measures the phase the book says is least predictive of anything.

---

## Sequencing, if any of this gets picked up

Roughly by (evidence strength × leverage) ÷ effort:

1. **§1 filters as lenses** and **§7 behaviour prompts** — small, purely additive, and they move the product
   toward the mechanism that actually works.
2. **§9 anti-rejection ergonomics** and the never-ship-a-popularity-metric commitment — cheap, and much
   cheaper now than after such a metric exists.
3. **§3 introductions** — the highest-leverage single feature here, and the one that most distinguishes a
   community-owned platform from a market.
4. **§5 recurring groups** — attacks the structural weakness (dispersion) with the mechanism with the best
   evidence (repetition).
5. **§2 calibration and the outcome study** — needs a governance conversation and a decision, in advance,
   about publishing a null result.
