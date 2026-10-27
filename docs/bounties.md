# Bounties

## Proposal

Most members tell me Compass is the best dating app structure they have seen, but that it's useless without more
like-minded people on it. Yet few of them promote it. I guess promoting
takes effort, and since Compass has no revenue, I can't buy that
growth either. On the other side, I have talked to plenty of people who would rather pay to be introduced to one
like-minded person of their age in their area than for one more coffee, and some would pay a lot more than a coffee.
So why not give members a reason to bring more people in and to set each other up, knowing that other members would
gladly reward them for it? That is what I'm proposing here, in an attempt to make the platform more useful for
everyone on it.

**The idea.** Members can post an optional **bounty**: a reward for whoever introduces them to someone they turn out to
want to meet, with the terms written in their own words (an age range, where the person lives, how involved they are
in a community the dater cares about, and whatever else counts). Nothing is paid unless both people accept the
introduction. The bounty is then split between the
**matchmaker** who proposed the pair, the **referrer** who brought the member onto the platform, and a **referral
fund** (my starting point is 60/20/20, to be tuned). Compass keeps nothing: the fund's share is used in full to pay
the sign-up reward (say $1) to whoever brings a new member in, so every cent of a bounty goes to members. Any member
can act as matchmaker, so they compete and can't sit on a good match. Everything that is free today stays free,
including search and reading profiles. Members who post no bounty keep that full experience; they only attract less
matchmaker attention.

**What is bought.** Not a life partner, and not a prediction of compatibility: nobody, human or algorithm, can tell from
profiles whether two people will be happy together, because most of what matters only shows up in person. What a
matchmaker sells is discoverability: a plausible candidate the dater would not have found through Compass's own feed
or their own circle. If a lasting partnership is worth, say, 10,000 to someone and roughly one plausible introduction
in a thousand turns into one, each introduction is worth about 10 to them. So the bounty is paid many times in small
amounts, for candidates, and the dater does the actual judging in person. Paying per accepted introduction, rather
than for a subscription or a retainer, ties the price to that value. I also believe a market of matchmakers beats a
single one, human or AI, because most matchmakers personally know at least one of the two people they pair. The same
incentives bring new members in: the people who know many singles become the platform's best recruiters.

**Pay for discovery, not for repeating the algorithm.** A bot could otherwise claim bounties by proposing every
high-scoring profile the moment it appears. So the payout is set automatically and shown to the matchmaker before they
propose:

- someone brought onto Compass from outside earns the full bounty (plus the referrer share);
- an existing member earns a payout that decreases continuously with the compatibility score Compass already computes
  for the pair: near zero for someone at the top of the dater's feed, near full for someone the algorithm would never
  surface;
- a profile the dater already viewed earns nothing, unless it has materially changed since;
- new and newly completed profiles have a one-week cooling-off period, during which Compass's own alerts get the first
  look.

**Keep quality up.** Every proposal carries a small stake, forfeited to the daters if both reject or ignore it and
refunded if at least one accepts. Proposals are capped per matchmaker, require a written reason, and build a visible
track record. Incomplete profiles and inactive daters cannot be proposed to. Payouts are held for two weeks after
acceptance so that fake or no-show introductions can be reported and refunded. The exact qualification threshold is
the make-or-break of the whole model, so I specify several designs to test.

**Roll out in steps, with members' consent.** I won't ship anything before a survey and a vote available to all members.
Phase 0
then runs the whole mechanism in _compasses_, a play currency with no cash value: every member gets an allowance,
posts bounties in compasses, and earns compasses by matchmaking that they can spend on their own bounty. This tests
demand, proposal quality and how the feature feels before any payment infrastructure or legal work. Phase 1 opens real
money to an opt-in cohort with explicit kill criteria, after a payments partner, VAT and platform reporting
obligations are in place.

**Choices I'm leaving open, to test with members:** whether bounties are free amounts, fixed tiers or one Compass-set
price; whether money is escrowed when the bounty is posted or charged at acceptance; whether the referral fund's share
decays over time; whether the tip ladder for a great match (section 5) is enough or a larger, later-paid, enforced
bounty for a lasting relationship is also wanted; and whether matchmakers push proposals or daters pull them by
asking for help.

## Detailed Proposal

### Why I'm proposing this

Most members told me Compass has the best structure they have seen in a dating
app, with its transparency, its long profiles and its compatibility questions, and they tell me its one problem is
that there aren't enough like-minded people on it yet. At the same time, almost nobody promotes it. I don't blame
them: inviting friends onto a dating platform takes effort and a bit of courage, and the only reward is the hope
that the people you bring will bring others who will one day bring someone compatible with you. With no revenue, I
can't pay for growth either, and I don't want ads or subscriptions that are so misaligned with getting people off the
platform asap.

The other thing I keep hearing is from the people I talk to about what they'd pay for. Many would happily pay to be
introduced to one like-minded person in their age range and area, rather than spend the same on one more coffee. Some
would pay a lot more than a coffee. What they refuse to pay for is a subscription that promises nothing, or a
matchmaker's retainer. They want to pay for a result.

Put those together and the question asks itself: why wouldn't I give members an incentive to bring people in and to
set each other up, when other members would gladly reward them for it? That is the whole proposal. The rest of this
document is my attempt to work out how it could be done without breaking what people like about Compass, and to lay
out the parts I'm unsure about so that members can tell me where I'm wrong.

### 1. What the dater pays for

Let me define compatibility narrowly: the ability of two people to have a happy long-term relationship. It is rare by
definition, and there is little evidence that it can be inferred from profiles, because profiles show stated traits
and preferences while most of what matters is revealed in person. So the accuracy of any matchmaker, human or
algorithmic, measured as the share of suggestions that lead to a lasting partnership, is small: perhaps one in a
thousand, depending on how picky and how easy-going the person is. That is still a thousand times better than
chance. Picking at random from the population might need a million tries; filtering on age, location, gender, diet,
religion and a few correlated values and interests gets to the thousand. The hard part is getting much below that,
and I don't think any algorithm is close.

A bounty therefore does not buy a compatible person. It buys discoverability: candidates that pass the filters and
that the dater would not have found through Compass's feed or their own surroundings, for example a vegan EA woman of
the right age in the matchmaker's neighbourhood. The economics follow from that. If a lasting partnership is worth
10,000 to someone and a plausible introduction converts one time in a thousand, each introduction is worth about 10,
and a rational dater keeps paying 10 per introduction for as long as the matchmaker's hit rate holds, as one would
keep buying lottery tickets with a positive expected return. Many small payments for candidates, with the dater
judging in person which one is the match. This is why I make the payout rise as the algorithm's ranking falls
(section 3): the dater pays only for discovery that Compass could not provide for free.

### 2. How it works in practice

1. **Posting.** From their profile, a dater sets a bounty for matchmakers (who can also be daters), and writes its
   terms in a free-text box: what an introduction has to be for the bounty to be paid. Age range, where the person
   has to live, how involved they are in a community that matters to the dater (EA, a church, a climbing gym), a
   language, kids or no kids, anything the dater would otherwise have to explain to a friend doing the introducing.
   The terms are shown to matchmakers next to the amount, and they are the yardstick when an introduction is
   disputed. Members without a bounty are unaffected.
2. **Proposing.** A matchmaker opens B's profile, picks "propose to" and selects A (or the reverse). Matchmakers see
   exactly what they can already see as members, so members-only visibility is respected. The form shows the payout
   for this pair, the stake, the dater's terms, and a required reason field ("why these two", which is also where
   the matchmaker says how B meets the terms). Submitting locks the price and takes the stake.
3. **Reviewing.** Both daters get a proposal card: the other person's profile, the matchmaker's reason, the
   matchmaker's pseudonym and track record. Each answers accept or decline. Neither sees the other's answer, bounty or
   payment. Cards expire after 30 days.
4. **Introduction.** When both accept, a private conversation opens between A and B, as for any other match on
   Compass. This is the moment that counts as "introduced". The conversation carries two buttons for each dater: thank
   the matchmaker (should not be based on money, but should incite them to tip if they thank him), with an optional
   note, usable again at any time; and reject the match, with a note, which closes
   the chat. Both go on the dater's public payment record (section 5).
5. **Payout.** Each dater's bounty is split and released after a 14-day hold. During the hold, either dater can report
   the introduction (fake, no-show, profile misrepresented, or plainly outside the terms the dater wrote); a
   confirmed report refunds the dater and costs the matchmaker the payout and the stake. The terms are what the
   report is judged against, which is why they are written down before anyone proposes rather than argued about
   after. A ban forfeits all pending earnings.
6. **Bringing someone in.** A matchmaker who invites B from outside with a referral link earns the full bounty from A
   if the pair accepts, plus the referrer share on everything B pays later.

### 3. Pricing an introduction

The payout for an existing member is `bounty × f(rank)`, where `rank` is B's percentile in A's compatibility ranking
at proposal time (and symmetrically for B's bounty). `f` is continuous and decreasing, for example `f = (1 − p)²`
where `p` is the percentile: a pair in the top 5% pays almost nothing, a pair in the middle about a quarter, a pair
the algorithm ranks low almost everything. The shape is a tunable I want to test; the properties that matter are no
steps (nothing to game at a threshold) and a payout the matchmaker sees before proposing.

Views are stored with the compatibility score at the time. A view only blocks a bounty if B was already a visible
match then; a material profile change (completeness or score crossing a threshold) makes earlier views stale, restarts
the one-week cooling-off period, and triggers a re-notification to earlier viewers. Incomplete profiles are not
eligible at all, so the cooling-off period starts when a profile is complete, not at sign-up. A matchmaker who nudged
B into completing their profile is not rewarded at first; a "sponsored completion" earning the referrer share is a
later option.

### 4. Keeping quality up: three designs to evaluate

If proposals are too cheap, scripts flood daters with low-effort pairs; if they are too costly, nobody matchmakes.
I specify three designs so they can be tested against each other. All share the guardrails above: written reason,
incomplete and inactive profiles excluded, payout hold, visible track record, and a per-matchmaker cap on open
proposals (say 10).

- **A. Stake per proposal.** A fixed amount or a few percent of the bounty. Settlement: refunded if both accept or if
  one accepts and the other declines or never answers; forfeited to the reviewing daters if both decline, if one
  declines and the other ignores it, or if both open it and ignore it; refunded if neither opened it (the daters were
  inactive). Simple, immediate, and it makes bad proposals pay the people whose time they cost. Weakness: a flat
  stake is noise for a well-funded bot and a barrier for a cautious first-time matchmaker.
- **B. Earned allowance.** New matchmakers get a small weekly budget of proposals (say 3). Each accepted proposal
  raises the budget, each double decline lowers it, and a sustained acceptance rate below a floor (say 20%) pauses
  proposing until a human review. No money changes hands up front, so it is friendlier to newcomers and harder for
  bots to buy their way through. Weakness: slower to react, and needs a reputation system from day one.
- **C. Pull instead of push.** Daters with a bounty choose to open it: they publish a brief ("what I'm looking for
  beyond my profile") and matchmakers apply or are invited. Unsolicited proposals are not possible. This removes the
  flooding problem entirely and fits a community feel, at the cost of volume and of the serendipity the whitepaper
  relies on.

Need to check with the members who report the "ick" most strongly.

### 5. Money, norms and trust

**Who gets the money.** The bounty goes to the people without whom the introduction would not have happened, in
proportion to what each one contributed:

- **The matchmaker, 60%.** They did the work the dater is paying for: they saw that these two people fit, which neither
  the algorithm nor the dater had, and they put their stake and their track record behind it. They get the largest
  share because without them nothing happens, and because the discovery discount (section 3) already scales their
  payout to how much they really added.
- **The referrer, 20%.** They brought the dater onto Compass in the first place. Every introduction the dater ever
  pays for was made possible by that one act, so the referrer earns a share of each of them for as long as the dater
  uses the platform. This is the reward for growing the pool, which is the thing members say Compass needs most.
- **The pool, 20%.** The remaining share pays the people who make the pool exist: it goes to a referral fund that is
  spent in full on sign-up rewards to whoever brings new members in, whether or not those members ever post a bounty.
  Compass itself provides the profiles, the ranking, the escrow and the moderation, but keeps none of the money; its
  costs stay covered by donations.

Nobody is paid for anything they did not make possible. A matchmaker who also referred the person they are
introducing receives both shares, because they did both things. A friend who wants no money can waive their share,
and the dater keeps it.

**Price setting.** Three options to test. (i) Free amounts: the market finds its level but invites "pay-to-win" and
makes daters do price thinking. (ii) Fixed tiers, for example 20 / 50 / 100: simple, caps the spread between rich and
poor members, and still lets matchmakers prioritise. (iii) One Compass-set price, reviewed periodically from
acceptance and matchmaking data: the least thinking for daters, the most responsibility for me. I'd start Phase 1
with fixed tiers. Whatever the option, I'd frame the bounty as "thank whoever finds them", and a dater can always add
to it; how is the next paragraph.

**Tips above the bounty.** The bounty pays for the introduction. A great match is worth more than that, and a dater
can say so in advance: next to the bounty they set a tip ladder, the most they would pay and what each step is for.
For example: 5 for a proper introduction, one where a meaningful connection could at least be attempted; 10 for a
good conversation; 50 for a durable friend, a relationship, a date in person, or a working connection. The bounty is
enforced; tips are not. They are a promise, kept or not at the dater's discretion, and they only matter because the
record of keeping them is public (below). From inside the conversation, at any point, the dater can press a button
to send money to the matchmaker, with an optional note explaining why, and can do so again later: the amount granted
only ever goes up. The dater can also reject the match from the same place, with a note, which closes the chat and
sends no tip. Rejecting does not undo the bounty, since the introduction did happen; it only ends it. Make sure money
/ tips info doesn't pollute the experience of the two daters in the chat or viewing each other's profiles. What should
be visible is buttons for one of the dates to thank the matchmaker or rate the match. Only after daters take action that
they should see tips info.

**The payment record is public.** On the dater's profile: each match they were introduced to by a matchmaker, whether
they accepted or rejected it, the amount granted so far, their note, and who the matchmaker was. This is what makes
an unenforced ladder work. A dater who posts "50 for a date in person" and whose record shows three in-person dates
and three 50s will have matchmakers lining up; one whose record shows good conversations and nothing paid will not,
and that is the enforcement. The same record on the matchmaker's profile, listing each introduction they made with
the dater's verdict, the amount and the note, is their credibility: a matchmaker whose introductions keep getting
rejected is visible before anyone accepts a proposal from them. Amounts and notes are public; the two daters still
never see each other's side of it, and the ladder is the one place where the "no money between the daters" norm
(below) is stretched, since a dater's ladder is readable by anyone, including people they are later introduced to.
That is a cost of the transparency, and the survey in section 6 should ask about it.

**When money moves.** Escrow at posting guarantees payment and keeps out fake bounties, but asks people to pay before
they trust the product and turns Compass into a custodian. Charging at acceptance is lighter but allows failed
payments after a matchmaker has done the work. I'd charge right after acceptance, before the chat opens.

**The referral fund, not Compass's revenue.** The pool's 20% is accounted for separately and published. Its balance is
spent entirely on sign-up rewards; if it runs a surplus the share drops or the reward rises, and if it runs short the
reward is capped at what the fund can pay rather than topped up from donations. I could make the fund's share decay
over time as a trust signal; if so, the decayed portion is refunded to the dater, not passed to the
matchmaker, and the price is locked at proposal time so that nobody gains by delaying an acceptance.

**Promoting versus hoarding.** A member who knows many singles faces two financial pulls. For bringing people onto
Compass: the sign-up reward and the referrer share of every bounty they ever pay. Against: keeping a friend outside
the platform to bring them in only when a specific bounty makes it worth it, which earns the matchmaker share at the
undiscounted outsider rate. With a 10 bounty, 60/20/20 split and a 1 sign-up reward, bringing someone in pays 1 plus
2 per bounty they later pay, while holding them back for one introduction pays 1 plus 6: the two break even at three
bounties, and introductions are meant to be many and cheap, so promoting wins for anyone who expects their friend to
use the platform. The hoarder also carries the risk that someone else refers the friend first, and delays their own
referral income. I have to keep this inequality true: sign-up reward plus referrer share times expected bounties per
member must exceed the matchmaker share of one bounty. A simpler fix removes the pull entirely: a referrer keeps the
undiscounted outsider rate on their own referees for a window after sign-up (say six months), so bringing someone in
never costs the referrer anything they could have earned by waiting.

**Norms.** (No money is ever visible between the two daters, but need to review if that’s really useful or the lack of
transparency is making it worse) Algorithmic suggestions and matchmaker proposals are labelled differently. (Matchmakers
cannot contact daters outside the proposal card), daters can block a matchmaker, and a friend can propose a match and
waive their share.

### 6. Rollout and experiments

**Gate.** I'll survey members and put the feature to a vote of all of them before building anything. I'll publish the
outcome, including a decision not to proceed. Everything that is free today stays free whatever happens, including
search and reading profiles.

**Phase 0: compasses.** Every member receives an allowance of 100 compasses on sign-up and a small weekly top-up (10);
bounties, stakes and payouts all run in compasses, with no purchase and no cash-out. Matchmakers can spend what they
earn on their own bounty. This exercises every mechanism above (pricing function, stakes, holds, reporting,
labelling) and measures what matters before any legal work: how many members post a bounty, how many proposals are
made and accepted, acceptance rate per matchmaker, and how members describe the feature in interviews. It does not
measure willingness to pay, and play money invites farming, so caps and the quality designs apply from day one.

**Phase 1: real money, opt-in.** Price setting option X, design Y, a payments partner that
holds funds and pays out, VAT on whatever the tax authority treats as Compass's fee even though it is passed on in
full as sign-up rewards, and the EU DAC7 reporting of matchmaker earnings. I'll set kill
criteria in advance, for example: retention of non-bounty members in the cohort drops, acceptance rate of proposals
stays below 15%, or the number of members calling the feature a reason to leave exceeds the number of new sign-ups who
like it.

**Phase 2** only if Phase 1 holds: test the pull model and the later-paid relationship bounty, and revisit the split
and the decay.

### 7. FAQ

**Isn't this pay-to-win?** With free amounts it would be: a larger bounty attracts more matchmaker effort. Fixed tiers
bound the gap, and every other part of Compass (feed, ranking, messaging, visibility) stays identical for everyone.
Bounties only affect how much attention matchmakers give you, not who you can see or contact. Even a small bounty is
valuable when you are a good match for someone who posted a large one.

**Doesn't money poison a free, community-based platform?** This is the biggest risk and the reason for Phase 0 and the
kill criteria. Behavioural research on social versus market norms shows that pricing a favour changes how people feel
about it, and that the feeling is hard to undo. My design keeps money between daters and matchmakers only, never
between the two daters, and keeps the paid path separate from the free one rather than making the free one worse, as
paid tiers on Hinge or Tinder do. Making it optional is not enough on its own; the test is whether non-bounty members
feel their experience got worse, which Phase 1 measures directly.

**Why does it feel like a scam?** Because paying for introductions has historically been a scam. The protections are
that nothing is paid before both people accept, payouts are held for two weeks and refundable on report, matchmakers
are accountable through a persistent track record, and a dater can see the payout rule before posting. There is no
contract, no instalment plan and no obligation beyond the amount the dater chose.

**Won't bots flood it?** Only if proposing is free. Section 4 sets out three designs whose purpose is exactly that
threshold, with the order I'd try them in. AI-assisted matchmakers are welcome; low-acceptance matchmakers, human or
not, are throttled and then reviewed.

**Why not let Compass's own AI do all the matching?** It already does the first pass, for free. The bounty pays for
what the algorithm cannot see: the matchmaker's knowledge of at least one of the two people. That is why payout rises
as the algorithm's ranking falls.

**Doesn't a decaying share encourage delays?** Only if the matchmaker's share grows as the fund's shrinks, so a
matchmaker with a unique match gains by waiting. Here the decayed portion goes back to the dater and the price is
locked at proposal, so neither matchmakers nor daters gain from delay. Decay is optional and mostly a trust signal,
since Compass earns nothing from bounties in the first place and so has no reason to keep anyone unmatched.

**Why not a marriage bounty, like Keeper?** Keeper charges men a "marriage bounty" under a binding contract, with
per-date fees along the way. Informal bounties on social media (usually a few thousand dollars) show real demand, but
they rely on trust between acquaintances and on outcomes months away. An introduction bounty is small, immediate and
verifiable; a lasting-relationship bounty is a later experiment, paid only when both confirm the relationship. It's
what people aim for, so it would be better to price it instead of an introduction. As we scale and I'm able to make a
marriage bounty more verifiable and enforceable, I'll also provide it.

**Hasn't this been tried?** Friend-assisted matching has: Tinder Matchmaker (2023), Hinge's Friend's Take, and a decade
of friend-swiping apps (Wingman, Cheers, Loop, Blindmate) let friends recommend profiles, with no reward for the
matchmaker, and none reached scale. Rivet (2025, ex-Tinder founder, reported $10M raised) is the nearest experiment:
anyone can be a Matcher and earns a play currency, Karma, for matching pairs the system proposes. Keeper is the only
product with a real bounty, but centralised and contractual. Nobody has paid the person who made the match, per
accepted introduction, at a price tied to what the algorithm could not have found.

**Is it legal?** Matchmakers earn for their own work, so the arrangement does not resemble a security, but I'll have a
lawyer confirm this before Phase 1. Escrow and payouts require a licensed payments partner. VAT may apply to the fund's
share even though Compass passes it on, platform reporting (DAC7 in the EU) applies to matchmaker earnings, and
matchmakers owe income tax on what they
receive. Profiles are shown to matchmakers only within the visibility the member already chose, so no new data flow is
created.

**Will anything that is free today become paid?** No. Search, reading profiles, the feed, compatibility scores and
messaging stay free and identical for everyone. Bounties just add a path on top.

**Does Compass make money from this?** No. The 20% that is not paid to the matchmaker or the referrer goes to a
referral fund that is spent entirely on sign-up rewards for people who bring new members in. Compass's own costs stay
covered by donations, as today. The fund's balance and payouts are published so that members can check this.

**Won't members hoard their single friends to sell introductions instead of promoting Compass?** Only if holding a
friend back pays more than referring them, and I set the terms so it does not (section 5). Referring pays a sign-up
reward plus a share of every bounty the friend ever posts; holding back pays the matchmaker share of one bounty and
risks someone else referring them first.

**What stops a matchmaker colluding with the other dater?** the other dater can accept anything, but you only pay if you
also accept,
and you can report within the hold. A fake or misrepresented other dater costs the matchmaker the payout, the stake and,
on
repetition, their account. Verification of daters makes this rarer still.

Sources: [Keeper (Wikipedia)](<https://en.wikipedia.org/wiki/Keeper_(matchmaking_website)>),
[Tinder Matchmaker (TechCrunch)](https://techcrunch.com/2023/10/23/tinders-app-gets-more-social-by-letting-friends-play-matchmaker),
[$10,000 wife bounty (NBC Bay Area)](https://www.nbcbayarea.com/news/local/find-this-guy-a-wife-get-10000/1912476/),
[S$2,000 bounty (SCMP)](https://www.scmp.com/week-asia/lifestyle-culture/article/3301293/bounty-love-singapore-woman-offers-s2000-if-you-can-find-her-life-partner),
[Hinge roses pricing (Fortune)](https://fortune.com/2024/01/18/hinge-ceo-justin-mcleod-interview-attractiveness-score-algorithm-rose-jail),
[Ariely, social vs market norms (NPR excerpt)](https://www.npr.org/19216880).

## Literature review

Friend-assisted matching is well trodden; paying the matchmaker per accepted introduction is not. The closest
precedents, from nearest to farthest:

| Product                                                                                                                | Who matches                                                                                                           | What the matchmaker gets                                                                                                       | Status and scale                                                                                                                                             | Relevance                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rivet** (US, 2025)                                                                                                   | Anyone, as "Matcher": friends, strangers, and vetted "Elite Matchers"; people in relationships can join only to match | **Karma** points for matching pairs or calling mismatches, redeemable for unspecified rewards                                  | Founded by ex-Tinder/Match exec Taru Kapoor, reported $10M raised, nationwide US launch, free app; site shows ~55k members and ~27 pairs matched by matchers | Closest to our Phase 0: a play currency for matchmaking, "give-to-get" framing, no cash. Matchers vote on pairs the system proposes rather than proposing their own.       |
| **cuties.app** (2024–)                                                                                                 | Members vouch for each other; the directory is the product                                                            | Nothing; "lightly monetised" via classifieds                                                                                   | ~2k users, 120+ self-reported meet-ups incl. relationships and engagements; rationalist/tpot communities; Surplus fellowship funded                          | A high-trust vouch network with no money and no algorithm. Shows that small, trusted communities will set each other up for free.                                          |
| **Keeper** (US, 2023–)                                                                                                 | The company's AI plus human matchmakers                                                                               | n/a (firm-side); the user pays a $50,000 "marriage bounty" under contract, $5,000 per date deducted from it; women pay nothing | ~$4M raised; small, high-end                                                                                                                                 | The only product with a real bounty, but centralised, contractual, one-size-fits-all, paid for outcomes months away. Our model is the decentralised, small-ticket inverse. |
| **Informal bounties**                                                                                                  | Whoever introduces                                                                                                    | $5,000–$100,000 on marriage or a lasting relationship, posted on TikTok, X or a personal site                                  | Recurring individual stunts (2012–2025)                                                                                                                      | Proof of willingness to pay for introductions; also of the trust and verification problems a platform must solve.                                                          |
| **Tinder Matchmaker** (2023), **Hinge Friend's Take**, **Bumble Recommend to a Friend**                                | Invited friends, no account needed, recommend profiles for 24h                                                        | Nothing                                                                                                                        | Features inside incumbents                                                                                                                                   | Validates demand for friend input; no incentive, no stranger matchmaking, no payment.                                                                                      |
| **Cheers** (NYC, 2024), **Wingman**, **Loop**, **Blindmate**, **Reco**, **Frnds of Frnds**, **Vouch**, **Ship** (2019) | Friends swipe, share profiles or vouch for their single friends; Blindmate hides the matchmaker's profile             | Nothing                                                                                                                        | Mostly small, invite-only or defunct                                                                                                                         | A decade of friend-matching apps with no reward for the matchmaker. None reached scale, which suggests goodwill alone does not sustain matchmaking effort.                 |
| **M8** (2017)                                                                                                          | Friends pick matches                                                                                                  | Gifts on a successful match                                                                                                    | No evidence it launched at scale                                                                                                                             | The one earlier attempt at rewarding friends; too little public record to learn from.                                                                                      |

**What the research says.** Rosenfeld, Thomas and Hausen (PNAS, 2019) show that meeting online has displaced meeting
through friends and family as the main way couples meet in the US, a process they call "disintermediating your
friends". A paid matchmaker market is an attempt to re-intermediate them at internet scale. Ariely's social-versus-
market-norms experiments (_Predictably Irrational_, 2008) are the basis for the norms section: small payments can
reduce effort compared with no payment, and once a favour is priced it is hard to make it a favour again. Both point
the same way as the feedback: rewards must be large enough to be a real reason to matchmake, and must never appear
between the two daters.

**What this leaves open.** No product has combined (1) anyone can matchmake, (2) a cash reward per accepted
introduction, (3) a price that depends on what the algorithm could not have found, and (4) daters who choose their
own amount. Rivet is running the nearest experiment with a play currency, so its retention and matcher activity over
2026 are the best external signal for our Phase 0.

Sources: [Rivet](https://www.rivetdating.com/), [Rivet launch (PR Newswire)](https://www.prnewswire.com/news-releases/rivet-launches-nationwide-introducing-a-new-approach-to-dating-social-matching-302888326.html),
[Rivet funding (Inc.)](https://www.inc.com/victoria-salves/former-tinder-executive-raised-10-million-dollars-new-dating-app-rivet/91410109),
[Rivet (Digital Trends)](https://www.digitaltrends.com/social-media/rivet-is-a-new-kind-of-dating-app-where-strangers-play-the-matchmaker/),
[cuties (Manifund)](https://manifund.org/projects/cuties), [Keeper (Wikipedia)](<https://en.wikipedia.org/wiki/Keeper_(matchmaking_website)>),
[Cheers (TechCrunch)](https://techcrunch.com/2024/10/24/cheers-lets-you-play-matchmaker-with-friends),
[Tinder Matchmaker (TechCrunch)](https://techcrunch.com/2023/10/23/tinders-app-gets-more-social-by-letting-friends-play-matchmaker),
[Wingman](https://www.wingmanapp.com/), [M8 (Trend Hunter)](https://www.trendhunter.com/trends/m8-dating-app),
[Rosenfeld et al. 2019](https://www.pnas.org/doi/10.1073/pnas.1908630116).

## Ideas from the one-sheet not in my draft (for the record)

Source: "A One-Sheet Whitepaper for a Next-Generation Dating Platform" by "Nephew Jonathan"
(@nephew_jonathan on Twitter, nephewjonathan.84 on Signal). The author is not building it and offers it freely,
but would welcome a consulting fee (cash or equity) if someone does.

### Decaying platform commission

- The platform's cut starts at 50% on day zero and decays by ~2% per week until it reaches zero (roughly 25 weeks).
  The author admits 2%/week is probably too steep but about right early on while trust is low.
- Rationale: incumbents (Match Group, Bumble) have poisoned trust. A decaying cut makes it obvious the platform wants
  you matched as fast as possible, since waiting costs it money. "If we cannot find you an introduction within a set
  amount of time, we make no money from you."
- Worked example: Alice and Bob each post $20. Matched on day zero, platform makes $20 total. Matched at week five,
  matchmaker gets 60% ($24 of the $40), platform 40% ($16).
- Noted "white lie": until a member is matched, their posted bounty is working capital for the company. The interest
  on it is small compared to the value of matching them fast.

### Introduction bounties, not marriage bounties

- Keeper.ai quoted the author $50,000 for a marriage bounty in 2025 (payable in instalments over three years) and
  requires legally binding contracts. The author argues this scares people off and that a one-size-fits-all price is a
  conceit: the firm cannot know what a match is worth to each person.
- Only the members themselves can judge whether it's a real match; a matchmaker can only make an educated guess. If a
  good match exists in the database, finding them should take a couple of hours of work, which is what the
  introduction bounty pays for.
- Members set their own bounty size, and the market clears on its own. A $5 bounty can still be valuable if that
  person is a great match for someone who posted $150. If you're not getting matches, raise your bounty.

### Matching rights (the big one)

- When Danielle invites Esther with an invite code, Danielle receives **matching rights** to Esther's profile. These
  rights are a tradeable asset: matchmakers can buy and sell them on an open market.
- Crucially, the onboarding matchmaker **cannot** propose matches for people in their own portfolio. Rights must be
  transferred at least once (via open auction, presumably a Vickrey/second-price auction) before any match can be
  proposed, and buyback by the original onboarder is forbidden.
- Worked example: Esther posts $100. Fiona buys matching rights to Esther from Danielle for $10 one week later and sets
  her up with George. Payout from Esther's $100: $48 to the platform (50% minus 2%/week), $10 to Danielle, $42 to
  Fiona.
- Rights may be resold multiple times. The author explicitly does not know, and claims not to need to know, what they
  will be worth (maybe a low single-digit percentage of the bounty, maybe more than 10%).
- This replaces my fixed "20% referrer" share with a market price for the referral, set by the matchmakers themselves.
- "Power matchmakers" could end up with hundreds of profiles in their portfolio.

### Firewall between daters and matchmakers

- An account is either a dater or a matchmaker, never both.
- Daters never need to understand the market: they post a bounty, enter a credit card, and the system shows them
  candidate profiles. The analogy is coffee futures and the person buying a latte.
- A small number of people who are good at both matchmaking and markets are expected to do most of the trading.
- Use hard currency, not crypto tokens, because the underlying bounty is a credit-card payment from a normal person.

### Anti-abuse and anti-trafficking design

- Profiles are pseudonymised when traded ("Margaret" appears to matchmakers as "Claire").
- Matchmakers cannot communicate with each other on-platform. Bids are sealed; the current rights-holder's identity can
  be hidden too.
- Contact information is visible only to the dater, the daters they accept a match with, and their onboarding
  matchmaker (who cannot propose matches for them).
- Consequences: setting up a trafficking victim with a client requires at least two colluding accounts and shows up as
  a detectable pattern (same onboarder for both, or two onboarders repeatedly buying each other's rights and
  instantly matching). Vickrey auctions add signal: consistently winning bids far above the second-highest bid flags a
  profile for human review.
- Banned accounts forfeit their bounty. Dozens of matchmakers see each profile and can report it.
- An AI screening/triage layer plus human reviewers is still needed, but should be "comparatively underworked".
- Verification of both daters and matchmakers makes abuse harder still.

### Other product details

- Members fill in a "dating doc" or open-ended list of wants and interests, with photos and contact info. No need to
  play the Tinder/Hinge engagement games: write whatever you like, however niche.
- Members tell matchmakers how far away they are willing to look, and only pay for introductions to people they are
  actually interested in (both parties must accept). In the detailed proposal above this is the free-text terms box
  on the bounty: distance, age, community involvement and whatever else counts, in the dater's own words.
- Matchmakers could be given MCP integration so that AI assists them: "the best of both worlds" between a central AI
  matchmaker and a human market.

### Legal and regulatory notes (author's unqualified opinion, informed in part by Claude)

- SEC: the author believes matching rights are not "investment contracts" because they fail the fourth prong of the
  Howey test (profit must come from the efforts of others; here the matchmakers do the work themselves). He insists on
  consulting a good securities lawyer before launching.
- Credit card companies and US regulators are aggressive about anything resembling a prostitution platform. The forced
  first transfer of matching rights is one bulwark: a "matchmaker" who is really a pimp loses control of the profile
  and cannot have a sockpuppet outbid everyone to keep it.
- Money transmission: escrow and payouts almost certainly require partnering with a bank or licensed money transmitter,
  who will want evidence of serious anti-trafficking procedures.
- Recommended reading: Patrick McKenzie's blog _Bits About Money_.

### Market context cited

- As of early July 2026: Match Group down more than 75% from peak, Bumble down over 95%. The author reads this as public
  contempt for the incumbents and good timing for a new entrant.

## Paying for introductions the dater would have found anyway

### The problem

Quoted from an early reader:

> I'm more than willing to pay large amounts of money to be introduced to someone that's a good fit for me. But I would
> be pretty annoyed if I were contractually obligated to pay large amounts of money to be introduced to someone who I
> very likely would have met myself. (This was one of my main concerns with Keeper, actually. It's pretty likely that
> they suggest someone that I already met myself.)
>
> Like, consider if someone new signs up to Compass, and an AI bot immediately suggests her to me. If we have a high
> match rating, I would have discovered this person myself the next time I logged in. That would be annoying.

### Approach 1: Compass gets a first pass at a small fee

Same reader:

> I would be less annoyed if Compass itself got the opportunity to suggest matches before anyone else did, and charged
> a smaller fee for that. If someone signs up, and they have a high match percentage, maybe Compass should notify me,
> and I pay 5% of my standing bounty or something. Other people and other bots can claim a bounty for an introduction
> only after Compass itself has taken that first pass.

### Approach 2: three tiers by when B arrived, with a self-set fraction for new signups

My own proposal:

Person A signs up, checks existing people, matches for free with the ones already on the app. Then A sets a bounty for
any new introduction.

- If B was already on the app before A set the bounty (i.e. a matchmaker found them a match within the existing user
  base that both A and B missed), and assuming A agrees to pay for being matched with existing members (e.g. lack of
  time or too many profiles to search), A (and B) pay the full bounty.
- If B joined the app after A set the bounty, A may have found them at their next login (depending on how active they
  are on the app), so A pays only a fraction of the bounty, which they set themselves. If A is an active user,
  checking new sign-ups frequently and receiving email alerts from Compass for new compatible members, A would likely
  want to offer close to 0% of the full bounty. If A isn't active and would rather have matchmakers work for them, A
  would likely want to pay close to 100%.
- If B wasn't on the app at all (i.e. brought in by the matchmaker), A wouldn't likely have found B themselves, so A
  pays the full bounty.

The review of these two approaches, the other options considered (ranking-based pricing, viewed-profile exclusion,
cooling-off period, proposal stake, dater-set payout, two-stage bounty, bounty outside the dater's filters) and
the resulting recommendation are folded into the detailed proposal above.

## My draft

Align incentives.
Would grow fast even if everyone acts according to their self-interest.
People are usually willing to give some money to find their life partner. But they prefer to give only once they find
them, or at least when they get introduced to someone with high likelihood of being their life partner. They don't want
to pay for vague products like subscriptions or matchmaker services. A market works best when the price is aligned with
the value of the product.

Suggestion: add a bounty for finding a life partner. Decentralized market.

Each person can put bounties on their profile, one for finding a life partner and one for an introduction. The bounty is
paid only when completed and is split based on who provided the value: the person who introduced them (matchmaker), the
platform which provides the pool of people (Compass), and the person who brought them to the platform (referrer).
Without those three, the pair would likely never have met. The split can be dynamic, but it can for example be 50%
matchmaker, 30% platform, 20% referrer.

Since the platform now earns a revenue, it can also provide a reward for every referral (e.g., $1 per new signup).

Thanks to bounties, users are now incentivized to bring new people to the platform and matchmake other members. This
creates a self-sustaining, growing market leveraging decentralization (as opposed to a centralized matchmaker; human or
AI) for efficient matchmaking. Since it has general matchmaking knowledge, a centralized matchmaker is usually better
able to find a good match than any single human. But since a decentralized market has plenty of users who each have
local knowledge that's not available on a profile (usually the matchmaker knows at least one of the people in the pair
they are matching), it tends to provide better matches than the centralized, general matchmaker.

People are free not to put bounties, but they'll be less likely to be helped by others.

Implementation caveats

We need to:

- clearly define what counts as an introduction or life partner. The terms box the dater fills in when posting the
  bounty (age, location, community involvement, and so on) is the per-bounty half of this; the platform-wide half
  is what counts as "introduced" (both accept, a conversation opens)
- enforce payment when those criteria are met

They pay the bounty to the platform at signup or introduction?
