Here are four high-leverage ideas to build a reputation system specifically engineered to make a user feel a strong,
immediate itch to invite 2+ more people.

## 1. The "Unfinished Triad" (UI-Driven Psychology)

Humans naturally seek closure. A pair feels like a closed circuit, but a **triad (a group of 3)** is the foundational
building block of a real community.

- **The Hook:** When a user signs up,hen someone likes, matches with, or m their profile dashboard prominently features
  an empty, glowing geometric shape—a
  triangle. The user sits at the top vertex. The two bottom vertices are grayed out, labeled _"Awaiting your
  Foundations."_
- **The Incitation:** The UI explicitly states that a single profile is isolated. To activate their "Community Node" and
  get a permanent _Founding Anchor_ badge, they must fill those two slots by inviting two trusted friends.
- **Why it works:** It leverages **Zeigarnik Effect** (the psychological tendency to remember uncompleted tasks better
  than completed ones). That incomplete triangle bugs the user until they fill it.

## 2. "Social Ripple" Tracking (The MLM Downline, But Ethical)

In an MLM, people obsess over their "downline" because they get a cut of their sales. On Compass, users will obsess over
their downline because they see their **human impact**.

- **The Hook:** Create a visual "connection Lineage / invitation Tree" (picture a constellation). When they invite 2
  people, and those 2
  people invite 2 people, the tree grows.
- **The Incitation:** the dashboard displays data-driven ripples:

> _"Because of your 2 invites, your network ripple has reached **14 people**. "_

- **Why it works:** It triggers a profound sense of legacy and digital ownership. The user realizes, _"If I hadn't
  brought in my 2, these 14 amazing people wouldn't be here."_

Also add a public denser (name/username only) invite tree for accountability and moderation (Lobsters model) where we
can see all users (root
users on the left, their descendants spaced on the right like nested bullet points):

- Martin
  - Julie
    - Lily
  - Frank
- James

## 3. Democratic Governance Tiers

Since Compass is a democratic platform run by its constitution, use **voting weight and proposal power** as the ultimate
progression system.

| Reputation Tier      | Requirements                        | What It Unlocks                                                          |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| **Member**           | Create an account                   |                                                                          |
| L1: **Steward**      | Get invited by a current member     | Submit proposals, organize events, render L1 badge                       |
| L2: **Root**         | Invite 2 Members                    | Ability to vote, discoverable through reputation filter, render L2 badge |
| L3: **Trusted Root** | Your 2 invites hit "Steward" status | Double voting weight, render L3 badge                                    |

The **"Trusted Root"** status acts like a
verification checkmark, letting others know that this user brings good energy into the ecosystem, making their own
profile more discoverable through the "trusted people" filter.

Show L1-3 badges in profiles and profile cards

## Designing the Loop

To make this feel effortless and urgent, the onboarding flow itself should set up the expectation.

```
[User Joins] ➔ [Fills Profile] ➔ [UI Shows: "Your Node is incomplete"]
                                       ⬇
                         [Prompt: "Vouch for 2 people to
                          anchor your community space."]
                                       ⬇
                         [User Invites 2 people]
                                       ⬇
                     [Triangle Closes ➔ Steward Tier Unlocked]

```

## Ranking

Show root score for each user which reflects the number of people they brought in. In other words, the number of people
the app would miss if they weren't there.
Every time a user joins, it delivers 1 point to the people who brought them in: 1/2 to the person above, 1/4 to the
second person above, etc. Once they reach the root (someone not invited by anyone), that root gets the remaining points.

So, if you invite 2 people and they both invite 1 person, you get 2 + 1/2 + 1/2 = 3 points. That's the contribution you
provided to Compass. Clearly show the users that their score will increase down the line as their invitees bring more
people.
Also show the percentile if they are in the top (1%, 5%, 10%, 20%)

Show a public ranking page / leaderboard that shows the top users by root score. Explain clearly that it's not a numbers
game, but a paramount help and recognition that those people made the community grow and sustainable.

## Double-sided benefits

For both the inviter and invitee.
Double-sided benefits framed as gifts (giving a friend access),

For the invitee:
Why-I-thought-of-you note — the invite carries a short personal message from the inviter explaining why this person
belongs here.
Submit proposals
organize events
render L1 badge (for trust)

For the inviter:
A connection you actually wanted — the honest core reward: you bring people you genuinely want in your life, so you
increase the chances to get like-minded people
Ability to vote
discoverable through reputation filter
Adjust card display in profiles grid
render L2 badge

# TODO

- Referrals in the DB: kept in profiles table or another one? Cache root score? Where to store level per user?
- Update constitutionL voting rights, etc.
