# Asking members to share Compass (or donate)

A short video of Martin asking members to bring people to Compass, or to donate to the marketing
budget, shown at the moments a member is most likely to share. When it shows, what it shows, and how
it is built.

It is the sibling of the store review prompt ([`app-store-reviews.md`](app-store-reviews.md)) and
borrows its moments, but it differs in two ways that shape everything below: the dialog is **ours**,
not the store's, so it runs on every platform (web included) and may look at sentiment; and it reports
back, so its yield can actually be measured.

---

## 1. Script

About a minute spoken, to camera, filmed portrait on a phone.

```text
Hey! Martin here. I'm the person behind the app you're looking at right now.
If you're seeing this, you've been using Compass for a while.
I built the platform to push back against the usual apps: the endless swiping, the ads, all the subscriptions. But there's a cost to that. We make no money, so there's no marketing budget.
Which means whether Compass succeeds is really up to us: you, me, and every other member. We are a thousand people right now, and the only way new people find Compass is through all of us.
So if you enjoy what I created, I have just one small ask: do your part. Bring a few people in. Message a friend or just post about it in a group.
Otherwise if you're more comfortable giving money than reaching people, the next best way to help is to donate to our marketing budget. I expect every dollar you give to bring in about five new people.
Thanks so much, and just message me if you have any questions or feedback!
```

Recording notes:

- **Burn in subtitles.** The dialog autoplays muted, and most members will never turn the sound on.
- The same video also sits on `/referrals` permanently, so the "If you're seeing this" line has to read
  naturally there too.

The recorded `share-ask-v1.mp4` is portrait (1080×1920, 66 s, ~50 MB) and ships **uncompressed**:
handheld outdoor footage with moving leaves loses visible quality at any size worth saving (a 9 MB
two-pass encode was tried and rejected). Its `moov` atom is already at the front, so it streams and
starts playing before it has downloaded — no remux needed.

At that size it stays **out of the app bundle** and is played from
`https://www.compassmeet.com/videos/share-ask-v1.mp4` on every platform:

- `web/scripts/fetch-media.mjs` pulls it from R2 into `public/videos/` for the Vercel build, marked
  `webOnly`, so the native build (`NEXT_PUBLIC_WEBVIEW=1`) skips it.
- `scripts/build_web_view.sh` also deletes it from `out/` after the build, in case an earlier web
  build left a copy in `public/`.
- `web/components/share-prompt.tsx` points at `DEPLOYED_WEB_URL` (overridable with
  `NEXT_PUBLIC_MEDIA_BASE_URL`), so web and apps render the same markup.

---

## 2. When it shows

Three of the review prompt's moments — the ones where a member has just felt Compass work. As with
reviews, the client names the _moment_; the server decides whether it qualifies.

| Moment (client)         | Trigger (server) | Qualifies when                                                                 |
| ----------------------- | ---------------- | ------------------------------------------------------------------------------ |
| `conversation-exit`     | `got-reply`      | A conversation reached two-way exchange in the last 7 days (the review's test) |
| `testimonial-submitted` | `testimonial`    | Their testimonial has 4–5 stars, or no rating                                  |
| `quiet`                 | `established`    | Never asked before, and any two-way conversation or testimonial is on record   |

Dropped from the review prompt's list:

- `profile-from-notification` — a notification tap says little about satisfaction, and this ask is
  bigger than a star rating.
- The backfill cutoff date — the share prompt is new for everyone, so `established` looks at all
  history.

**Filtering on the testimonial's rating is fine here.** The store rules against sentiment gating
(`app-store-reviews.md` §3) cover store review cards only; this dialog is ours. The server reads the
rating from the testimonial itself rather than trusting the client.

---

## 3. Suppression rules

| Rule                                                                | Value    | Checked by               |
| ------------------------------------------------------------------- | -------- | ------------------------ |
| Cooldown between showings                                           | 60 days  | Server (`share_prompts`) |
| Lifetime cap                                                        | 3        | Server                   |
| Account on hold or banned                                           | never    | Server                   |
| Signed in                                                           | required | Client                   |
| Sessions on this device before the first ask                        | 3        | Client (`localStorage`)  |
| Calm moment: visible, no dialog, no keyboard, not in a conversation | required | Client                   |
| Prompts per session, review card and video combined                 | 1        | Client                   |

On the web a session is a browser tab (marked in `sessionStorage`), so a reload is not a new session.

**The review card goes first.** In the apps both prompts share the same moments. The store card's
quota is scarce and the iOS launch window is short, so the video waits `REVIEW_HEADSTART_MS` (3 s)
longer and stands down if the card was granted in between. Symmetrically, the review prompt stands down
if the video already played that session. Only a prompt actually _shown_ claims the session — a server
that said no leaves it free for the other.

There is no "don't show this again". The cooldown and cap already bound it to three showings, at most
one every two months.

---

## 4. The dialog, and its permanent home

A modal: title, the video (autoplay muted, controls, `playsInline`), then Martin's avatar and name
linking to his profile (`/Martin`) — "Questions or ideas? Message me on my profile" — so the person who
just spoke is one tap away. Then

- **Share Compass** — primary, the amber CTA, the same share panel as `/about` and `/referrals`
  (copy link, copy message, OS share sheet or X / LinkedIn) with the member's `?referrer=` link. It
  opens over the dialog without closing it.
- **Donate** — secondary, outlined, links to `/support`.
- **Maybe later** — closes.

Tracked: `share prompt shown`, `share prompt donate` and `share prompt founder profile` (both with
`source`), `share prompt dismissed`, and each share from the dialog as `sharecompass` with
`source: 'share-prompt'` and the `method` used. Unlike the store card, the outcome is visible — share
and donate rates per trigger are the numbers to watch.

The video's permanent home is **`/referrals`**: a second column beside the invite section on wide
screens, below it on phones, with the profile link and only the Donate button (the share tools are
in the invite section).

Open question: the iOS app shows Donate like every other platform. `/donate` embeds Open Collective,
and Apple restricts in-app donations for organisations that are not approved nonprofits — check before
the iOS listing goes live, and hide the button on iOS if needed.
