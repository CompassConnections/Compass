# Proposal: make Compass exclusive to altruists

**Status: draft proposal, nothing decided.** This document states the idea, the trade-off it creates, and
what has to be measured before deciding. The numbers in the worked examples are placeholders, not
measurements.

## 1. The proposal

Restrict Compass to people for whom helping others is a central part of their life and identity, and who
are mostly looking for someone who shares that:

- **Non-profit and impact workers** — people whose job is chosen for its benefit to others.
- **Effective altruists** — and neighbouring communities organised around doing good.
- **Ethical vegans** — vegan for the animals or for the environment (not for health alone).

The common trait is not a label but a disposition: compassion acted on, at a real personal cost, and seen
as core to who they are. The three groups above are the places where that disposition is easiest to find
and to reach.

## 2. Why

The goal of Compass is to maximise the number of deep connections. Exclusivity could raise it in two ways:

1. **More sign-ups inside the community.** "An app for people like me" is a stronger reason to join, and to
   tell friends, than "an app for everyone who wants depth". These communities are tightly networked, so
   word of mouth travels further per member.
2. **A higher chance that any two members fit.** If everyone shares the value that matters most to them,
   each profile viewed is more likely to be a real candidate, so the same member count yields more
   connections.

It also sharpens the answer to "who is here?", which [`marketing-copy.md`](marketing-copy.md) identifies as
the thing the current pages fail to say. The existing population already leans this way (EA-adjacent, 44%
vegetarian or vegan among those who answered), so this would be naming and committing to a lean that
exists, not inventing one.

## 3. The cost

Everyone outside the definition stops signing up, or is turned away. That loses:

- the connections those people would have formed with each other,
- the connections between them and altruist members who are open to a non-altruist partner,
- local density, which is already the binding constraint in most cities.

So this is a trade: a larger, better-matched altruist pool against the loss of the rest of the world.

## 4. A rough model of the trade-off

Let `A` be altruist members and `O` everyone else. Let `p_aa`, `p_ao`, `p_oo` be the chance that a pair of
each kind becomes a deep connection. Ignoring geography, connections scale roughly as:

```text
open app:       p_aa·A²/2  +  p_ao·A·O  +  p_oo·O²/2
exclusive app:  p_aa·(k·A)²/2
```

where `k` is the **lift**: how many times more altruists join once the app is clearly theirs. Exclusivity
wins when the second line exceeds the first.

An illustrative case. Count only **involved** members: those with a full profile who are likely to check
when they get a message, since the rest form no connections either way. Assume altruists are 20% of them
(`A = 0.2`, `O = 0.8`, as shares of the involved pool), and that an altruist pair is three times as likely
to connect as any other pair (`p_aa = 3p`, `p_ao = p_oo = p`):

```text
open app:       3p·0.2²/2  +  p·0.2·0.8  +  p·0.8²/2  =  0.06p + 0.16p + 0.32p  =  0.54p
exclusive app:  3p·(k·0.2)²/2                         =  0.06p·k²
break-even:     0.06·k² = 0.54   →   k = 3
```

So exclusivity has to **triple** the number of involved altruists just to match the open app.

What the model says to measure:

- **The current altruist share.** The higher it already is, the less there is to lose.
- **`p_ao` relative to `p_aa`.** This is the central question (section 5). If altruists rarely want
  non-altruists, the mixed pairs being given up were never worth much.
- **The lift `k`.** The only term that can make exclusivity a net gain rather than a smaller loss.

Two things the model leaves out, pulling in opposite directions:

- **Geography.** Connections need two people in the same place. Altruist communities cluster in a few
  hubs, which helps there, but an exclusive app may be empty everywhere else.
- **Whose connections count.** The model values an other–other connection the same as an altruist one. If
  the mission is specifically to serve this community, the `p_oo` term matters less and the case for
  exclusivity strengthens. That is a values decision, not a measurement.

## 5. The main assessment: how many altruists want an altruist partner exclusively?

Everything hinges on this. If most altruists treat shared altruism as a requirement, exclusivity removes
only noise for them. If most treat it as a nice-to-have, exclusivity removes real candidates and the appeal
of "an app for us" is weaker than it looks.

Split the answer into three levels, since they imply different products:

| Level             | Meaning                                               | Implies                             |
| ----------------- | ----------------------------------------------------- | ----------------------------------- |
| Requirement       | Would not date someone who does not share it          | Exclusivity is a feature            |
| Strong preference | Would, but strongly prefers and searches for it first | Positioning + filters may be enough |
| Indifferent       | Does not weigh it much                                | Exclusivity only costs              |

Expect the answer to differ by group. Ethical vegans plausibly sit highest (shared meals, shared household,
a moral disagreement at every dinner). EAs and non-profit workers may value shared ambition to do good
without requiring the same label. Measure each group separately.

### 5.1 Evidence already in the database (revealed preference)

Cheapest, and more trustworthy than what people say. Classify members as altruist from existing fields
(`diet` vegan, causes / work / interests options such as effective altruism, animal welfare, non-profit
work), then:

- **Share of members who qualify** — gives `A` and `O`.
- **Who altruists message.** Share of an altruist's first messages that go to other altruists, compared
  with the share of altruists among the profiles they could have written to. A ratio well above 1 is
  preference; near 1 is indifference.
- **Reply and conversation depth by pair type** (altruist–altruist, mixed, other–other) — a direct estimate
  of `p_aa`, `p_ao`, `p_oo` up to a constant.
- **Filter and weight usage.** How many altruists filter on diet or causes, or mark the related
  compatibility questions as very important or as dealbreakers.

Caveat: the sample is small (about a thousand members, fewer with these fields filled) and self-selected,
so treat results as direction, not precision.

### 5.2 Survey (stated preference)

To current altruist members and to the outside communities (EA groups and forum, vegan and animal-advocacy
groups, non-profit networks). Keep it to a handful of questions:

1. Would you date someone who does not share your commitment to helping others? (no / reluctantly / yes)
2. For vegans: would you date a non-vegan? Someone vegetarian? Someone open to changing?
3. Have past partners shared it? Was the lack of it a reason a relationship ended?
4. Would you rather use a dating app only for people who share it, or a general app with a filter?
5. Would you join such an app today? Would you recommend it to friends in the community?

Question 4 separates "I want an altruist partner" from "I want an altruists-only app", which are not the
same thing. Stated preferences overstate strictness, so read them against 5.1.

### 5.3 Landing-page test (measures the lift `k`)

Two versions of the logged-out home page, same traffic source, compare sign-up rate:

- **Exclusive framing** — "for people who dedicate their lives to others".
- **Current framing.**

Run it on traffic from inside the communities (to estimate the lift) and on general traffic (to estimate
the loss). No gate needs to be built for this; only the copy changes.

## 6. How exclusive? Options, from reversible to not

| Option               | What changes                                                                  | Reversible |
| -------------------- | ----------------------------------------------------------------------------- | ---------- |
| **Positioning only** | Copy and outreach say who Compass is for. Anyone can still join.              | Fully      |
| **Self-declared**    | Onboarding states the premise and asks members to confirm it applies to them. | Mostly     |
| **Gated**            | Sign-up requires an answer or short text on how they act on it; reviewed.     | Hard       |

Positioning alone may capture most of the sign-up lift while losing few of the others, since people who do
not recognise themselves in the description tend to leave on their own. A hard gate adds review work, the
problem of judging who is "altruist enough", and resentment from those refused.

**Suggested path:** run the section 5 assessment, then start with positioning only, and tighten only if
the data shows altruists want the stricter version.

## 7. Risks and open questions

- **Definition.** Where is the line? A nurse, a teacher, a volunteer, a large donor with an ordinary job, a
  vegetarian? A narrow definition keeps the promise; a wide one keeps the density.
- **Existing members** who do not fit: keep them (simplest, and fair), hide them from new members, or ask
  them to leave? Keep them but hide them from members who marked altruism as a requirement.
- **Tone.** "Only for compassionate people" can read as self-congratulating, and may put off the very
  people it targets. The copy has to describe a way of living, not award a moral rank.
- **Pool size.** How many single altruists exist per city, in total? If the ceiling in a typical hub is a
  few hundred, exclusivity caps Compass at a small size even if everything works.
- **Homogeneity.** These communities are already socially dense; some members may want an app precisely to
  meet people outside their circle, or to avoid dating within a small professional network.
- **Friendship and collaboration.** Half of members look for friendship. Does exclusivity apply equally
  there, where shared values may matter even more? Deep friendships would stay but collab would probably be removed.
- **Existing niche apps.** Vegan dating apps and EA dating channels already exist. What do their size and
  retention say about demand?
- **Reversal cost.** Reopening after going exclusive would disappoint the members who joined for it.

## 8. Decision rule (to be filled in before looking at the data)

Agree on thresholds first, so the result is not rationalised afterwards. For example:

- Go exclusive (at some level) if at least **X%** of altruists state it as a requirement, **and** altruists
  message other altruists at least **Y×** the base rate, **and** the landing-page lift is at least the
  break-even `k` from section 4 computed with the measured share.
- Stay open with sharper positioning if preference is strong but not a requirement.
- Drop the idea if altruists message across the line at close to the base rate.
