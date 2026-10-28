# First messages

What a first message on Compass has to meet, where each rule is enforced, and how to tune it. The
rules exist because generic openers and comments on looks are what members report most, and a
bulk-messager's cost per opener is the one thing that reliably changes their behaviour: a message
that must anchor on something the recipient wrote cannot be pasted twenty times.

The constants and the pure checks live in `common/src/moderation/first-message.ts`, shared by the
composer (live feedback) and the API (the floor that is actually enforced). The rules themselves are
stated to members in `web/components/house-rules.tsx`, shown on the home page, the about page and
the last onboarding screen, in the same words everywhere.

## The rules

| Rule                                          | Where it is enforced                                                                                                               | What happens                                                                                |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Your own profile first                        | `create-private-user-message-channel.ts`, before a new channel is created; previewed by `get-profile-gate` when a composer opens   | 403 tagged `PROFILE_INCOMPLETE_CODE`; the client shows `ProfileIncompleteNotice` with links |
| At least `MIN_FIRST_MESSAGE_CHARS` characters | `api/helpers/first-message.ts`, on the first message of a 1:1 channel                                                              | 400 tagged `FIRST_MESSAGE_REJECTED_CODE`; the composer never lets it get this far           |
| Says something about the recipient            | advisory: `referencesProfile()` in the composer (a warning once the button unlocks) and in `api/helpers/first-message.ts` (logged) | nothing is refused for this alone; the model review decides whether an opener is generic    |
| Not a copy of an earlier opener               | same place, `findDuplicateOpener()` against the sender's recent openers                                                            | `auto_rate_limit` hold, #reports post, 403 tagged `AUTO_BAN_UNDER_REVIEW_CODE`              |
| Too many new conversations                    | `create-private-user-message-channel.ts` (burst and daily limits, `common/src/moderation/ban.ts`)                                  | `auto_rate_limit` hold, #reports post                                                       |
| Model review                                  | `shared/moderation/opener-review.ts`, after everything above passes                                                                | reject with the model's sentence, `auto_rate_limit` hold, or a #reports note; see below     |

Staff (admins and mod usernames) are exempt from all of them: support and moderation legitimately
open many near-identical conversations. Group channels skip the opener rules, since there is no one
profile for an opener to anchor to. Replies are never checked; only the first message in a channel is.

### The profile gate

A member needs a bio of `MIN_BIO_CHARS_TO_MESSAGE` characters (measured on the trigger-maintained
`profiles.bio_text`) and `MIN_ANSWERS_TO_MESSAGE` rows in `compatibility_answers` before they can
start a conversation. It runs after the existing-channel lookup, so a conversation that already
exists is never cut off, and it does not apply to replies.

The query lives in `api/helpers/profile-gate.ts` and is shared with `get-profile-gate`, which both
composers (`send-message-button.tsx` on a profile, `new-message-button.tsx` in the inbox) call the
moment they open, and again on every open. A member whose profile is not written yet therefore sees
`ProfileIncompleteNotice` in place of the editor before typing a word, not after writing a message
and pressing send. The create-channel check is still the floor: the composer only falls back to its
error-handling path if the preview and the real check disagree.

### "Says something about the recipient"

`profileVocabulary()` builds the recipient's distinctive words from headline, keywords and bio text:
five letters or more, not in the stopword list, and never the recipient's own name or username ("Hi
Julie" is not evidence of reading). `profileReferences()` counts the profile words the message picks
up, with prefix matching standing in for stemming ("climb" / "climbing"). `requiredReferences()`
asks for nothing when the profile has fewer than five such words (that is the recipient's doing)
and one otherwise: a single shared keyword is enough to keep the warning quiet.

This check is advisory on both sides. Word matching is too blunt to refuse a message on: a paraphrase
of the bio, or a reply to a photo caption, shares none of its words. The composer unlocks the send
button on length alone and shows a warning under the message once it is long enough and still picks
up nothing; the API logs the same result ("Opener references nothing from the profile") and leaves
the verdict to the model review. Whether to make it a hard gate again is a tuning question: compare
the warning rate with the model's rejection rate first.

The stopword list carries the looks vocabulary on purpose: "beautiful" matching a profile that
happens to contain it must not count as having read it.

The composer runs the same function on the same inputs. A profile card hands the composer the `card`
projection (a truncated `bio_snippet`), so the composer fetches the full profile with `get-profile`
when the modal opens; otherwise it could refuse a message about something further down than the
snippet reaches.

### Copy-pasted openers

`previousOpeners()` decrypts the first message of each conversation the sender opened in the last
`DUPLICATE_OPENER_LOOKBACK_DAYS`, up to `DUPLICATE_OPENER_SAMPLE` of them. `openerSimilarity()` is
Jaccard over the word sets (three letters or more): a forty-word template with the name and one
keyword swapped lands around 0.9, two genuinely separate messages rarely pass 0.3, and the threshold
`DUPLICATE_OPENER_SIMILARITY` sits at 0.6. A hit places the same `auto_rate_limit` hold the
conversation limits use (the `users.ban_reason` check constraint only allows the three existing
values) and posts `duplicateOpenerDiscordMessage` to #reports with the similarity, so a reviewer can
tell a verbatim paste from a borderline case.

### Model review

After the deterministic checks, `reviewOpener()` sends the opener, the sender's profile (with
account age) and the recipient's profile to the model in `shared/llm/gemini.ts` and asks for a
JSON verdict: an engagement score, a looks-based flag, a scam score, a boundary flag, a
contradicts-own-profile flag, and one sentence addressed to the sender. The message is fenced and
the prompt says not to follow instructions inside it.

`decideOpener()` maps the verdict to one of four actions, and the thresholds live beside it:

- **hold** on a scam score at or above `SCAM_HOLD_THRESHOLD`, or a looks-based opener. Same
  `auto_rate_limit` hold and #reports post as the other automatic holds; the sender is told their
  message was flagged, not what gave it away.
- **reject** when engagement is under `ENGAGEMENT_REJECT_THRESHOLD`: a 400 tagged
  `FIRST_MESSAGE_REJECTED_CODE` carrying the model's sentence, which the sender can act on.
- **flag** on a moderate scam score, a boundary the recipient stated, or a claim that contradicts
  the sender's own profile: delivered, with a note in #reports. Honesty has no ground truth and
  "what the recipient is looking for" is the recipient's call, so neither ever blocks on its own.
- **approve** otherwise.

No verdict (key not configured, model down, slower than `OPENER_REVIEW_TIMEOUT_MS`, or an answer
that does not parse) delivers the message: the deterministic checks still ran, and a model outage
must not stop every first message. `OPENER_REVIEW_MODE` switches between `off`, `shadow` (verdicts
logged and posted, nothing applied) and `enforce`. Run `shadow` for a few weeks after any prompt
or threshold change and compare the posts with the reports that come in.

### The sender does not wait

The review runs inside the request, because a Cloud Run continuation gets almost no CPU. So the
composer records the message in `web/lib/pending-openers.ts`, moves to the conversation at once,
and lets the API call finish behind it. The conversation page draws the pending message in the
sender's own bubble (`PendingOpenerBubble`), then either fetches the stored message and drops the
bubble, or shows the refusal under it with an "Edit and try again" that puts the text back in the
composer. The recipient is only notified by `createPrivateUserMessageMain`, which runs after every
check has passed, so a refused message never reaches them.

## Reports

`ReportUser` offers "Generic or copy-pasted first message" and "Commented on my looks" as the first
two reasons, so the counts are usable: a pattern across reports is what gets an account removed, and
"Other" hides the pattern. The confirmation tells the reporter that reports like theirs are how most
removals start.

## Tuning

- **The profile-reference warning firing on genuine messages**: lower the thresholds in
  `requiredReferences()`, or add to the stopword list if a specific common word keeps counting as a
  reference. The API logs every opener it fires on, so the rate is measurable without a UI change.
- **Copy-paste holds landing on real people**: raise `DUPLICATE_OPENER_SIMILARITY`. The hold is
  provisional and reviewed within `AUTO_BAN_REVIEW_HOURS`; the Discord post shows the similarity so
  the review is quick. Watch the hold-to-unban ratio.
- **The profile gate blocking too many existing members**: the thresholds are deliberately low (a
  short paragraph and three answers). Lowering them further defeats the point; a better fix is a
  nudge on the profile page.

Measure before and after any change: reports per hundred first messages, the share of first messages
that reference the profile, and the hold-to-unban ratio.

## Tests

- `common/tests/unit/first-message.test.ts` for the pure checks.
- `backend/api/tests/unit/first-message-helper.unit.test.ts` for the opener helper, the
  `create-private-user-message*.unit.test.ts` files for how the handlers call it, and
  `get-profile-gate.unit.test.ts` for the composer's preview of the profile gate.
- `backend/shared/tests/unit/opener-review.unit.test.ts` for the verdict-to-action mapping, the
  prompt and the model's failure modes.
- E2E: `seedDbUser()` answers three prompts for every seeded member so they pass the gate, the
  sign-in fixtures expose the seeded headline so a spec can write an opener that refers to it, and
  the onboarding flow has one more `Continue` for the house-rules screen.
