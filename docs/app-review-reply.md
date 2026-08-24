# App Review reply — 1.42.0 (11), guideline 2.1

Apple rejected submission `03f117df-a8e3-46a7-b3a9-e27214324691` (Aug 24, 2026) under **Guideline 2.1 —
Information Needed**. This is not a functional rejection: no bug was found and no build change is
required. Review stopped because the App Review Information section was thin, and they want the seven
items below before continuing.

Companion to [app-store-listing.md](app-store-listing.md) ("App Review Information" section, which this
supersedes as the Notes text) and [ios.md](ios.md) §8 (the guideline risks the notes pre-empt).

## What to do, in order

1. **Screen recording — done.** Recorded on the iPhone 11 (iOS 26.6.1, the current release, which is
   what Apple's "latest operating system" line asks for) against build 1.42.0 (11), and cut to
   `~/Downloads/review-demo.mp4` — 8:56, 29.4 MB, comfortably inside what the attachment field takes.
   Before uploading, watch it once through and check two things: that all eleven rows of the
   [shot list](#screen-recording-shot-list) are visibly on screen, and that none of the four splice
   points (1:23, 6:34, 7:09, 7:48) lands mid-prompt or mid-confirmation. The cut script is
   `cut.sh` in this session's scratchpad if segments need redoing.
2. **Verify the iPad line — it is the one thing in here nobody has read off a device.** It currently
   says **iPad (11th generation), iPadOS 26.6.1**, and both halves are estimates: the 11th generation
   because it is the current base-model iPad, and 26.6.1 because iPadOS ships in lockstep with iOS and
   the iPhone is on 26.6.1. Two taps settle both — Settings → General → About gives **Model Name** and
   **Software Version**. Do it before pasting. This is the one line in a reply whose whole purpose is to
   convince a reviewer you tested on real hardware; naming an iPad you do not own undoes the rest of it.
   If the iPad turns out to be an earlier generation, correct the generation and re-check the OS, since
   an older iPad may not be on the current release. Both halves appear twice — in the reply and in the
   Notes block.

3. **App Store Connect → App Review Information**: paste
   [the Notes version](#notes-field-version-3991-characters) into **Notes** — that field caps at 4,000
   characters, which the full reply below exceeds — and attach `review-demo.mp4`. While in that section,
   confirm the demo account's email and password are in **Sign-In Information** and that its email is
   still verified, and that **Contact Information** has a phone number Apple can reach.
4. **Reply in the Messages thread** ("Reply to App Review") with [the reply](#the-reply-3855-characters),
   which answers Apple's seven items in their numbering. That field caps at 4,000 characters too, so it
   holds a different, tighter text than Notes rather than the same one twice.
5. **Resubmit the version.** The same build (11) can be resubmitted — Apple asked for information, not a
   new binary. Only bump `CURRENT_PROJECT_VERSION` (both Debug _and_ Release in `project.pbxproj`) if
   something in the app actually changes — which it will if you close the blocked-comments gap in
   [Gaps to close](#gaps-to-close-before-resubmitting) first.

## The reply (3,855 characters)

Goes in the **Messages** thread ("Reply to App Review"), which caps at 4,000 characters — the same cap
as the Notes field, so the two texts are different on purpose rather than duplicated. This one answers
Apple's seven items in their numbering and stays inside the cap; the
[Notes version](#notes-field-version-3991-characters) carries the guideline notes this one drops, so
between them both fields are doing work.

```
Thank you. The requested information is below. It is also in App Review Information > Notes, together with notes on guidelines 4.2, 4.8, 5.1.1(v) and 1.2.

1. SCREEN RECORDING
Attached in App Review Information: captured on a physical iPhone 11 running iOS 26.6.1, against build 1.42.0 (11). From app launch it covers registration with the terms checkbox, sign-in by email/password and by Sign in with Apple, profile creation with the microphone and photo-library prompts, the notification prompt, search and filtering, sending a first message, reporting and blocking a member, and account deletion from Settings > General. There is no paid content, subscription or in-app purchase, so no purchase flow appears. It never requests location or contacts and shows no App Tracking Transparency prompt: no cross-app tracking, no advertising identifier.

2. DEVICES AND OS TESTED
iPhone 11 (iOS 26.6.1), physical device: push, Universal Links, both sign-in providers, photo upload, voice input, account deletion. iPad (11th generation, iPadOS 26.6.1), physical device: the Universal layouts. Minimum supported iOS is 15.0.

3. WHAT THE APP DOES AND WHO IT IS FOR
Compass is a free, open-source directory for finding a friend, partner or collaborator by values and personality rather than photos. Members filter by 20+ attributes (location, age, values, causes, politics, religion, diet, languages, education, personality) or search the text of bios. Compatibility scores compare three things the member sets: their own answer, the answers they would accept, and how much it matters. A first message needs 200+ characters and a verified email address. Audience: adults 18+ (signup rejects birth dates under 18) seeking intentional one-to-one connections: platonic, romantic or collaborative. Non-commercial: no ads, subscriptions, in-app purchases or data sales; donation-funded, source public under AGPL-3.0 at github.com/CompassConnections/Compass.

4. SETUP AND ACCESS
Demo credentials are in Sign-In Information; that account has a profile, a saved search, an existing conversation and a verified email. Please sign in with email and password (the social providers work but need an account of your own). Browse tab = the directory; funnel icon = filters; "Message" on a profile = first contact; the "..." menu = report and block (report is also inside conversations); Settings > General = data export and account deletion; Settings > Notifications = push opt-in. No sample files or invite codes needed.

5. EXTERNAL SERVICES
Firebase Authentication (accounts, Google and Apple sign-in), Firebase Cloud Storage (photos), Firebase Cloud Messaging via APNs (push), Supabase managed PostgreSQL (profiles and messages, encrypted at rest), Google Cloud Run (our API), Vercel (the website only; the app loads its bundle from local assets, never a remote page), Resend (transactional email), Sentry (crash reporting), PostHog (analytics; no advertising identifier, no cross-app tracking). AI services: OpenAI gpt-4o-transcribe transcribes the optional voice input on the profile form, and Google Gemini turns that transcript into suggested values for the member's own profile fields, which they edit before saving. Neither is used for matching, ranking or moderation, and neither runs unless the member taps the microphone. No payment processor, ad network or data broker.

6. REGIONAL DIFFERENCES
None. Identical features and content in every region, free everywhere, no geographic gating. Localised in English, French and German, chosen in-app, not by region.

7. REGULATED INDUSTRY / PROTECTED MATERIAL
Not applicable. No financial, health, gambling or similar services, and no protected third-party material: content is ours (AGPL-3.0) or member-created under Terms accepted by checkbox at registration.

The contact in App Review Information is monitored daily.
```

## Screen recording shot list

One continuous recording on a **physical iPhone**, current iOS, of the build under review. Start the
recording before launching the app, from the home screen. Roughly 3–5 minutes; do not narrate over
missing steps — Apple's four bullets are the checklist and each one they asked for must be visibly on
screen.

| #   | Shot                                                                                                                                                          | Why Apple asked for it                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1   | Home screen → tap the Compass Meet icon → app launches to the signed-out state                                                                                | "must begin with launching the app"           |
| 2   | Register: fill the form, show the terms checkbox, submit                                                                                                      | account registration                          |
| 3   | Sign out, then sign in with **email and password** (the demo account)                                                                                         | login flow reviewers will repeat              |
| 4   | Sign out, sign in with **Sign in with Apple**                                                                                                                 | guideline 4.8, and the "registration" bullet  |
| 5   | Profile edit: tap the photo picker → **photo-library prompt**; tap the microphone → **microphone prompt** and one voice answer being transcribed and accepted | "prompts requesting access to sensitive data" |
| 6   | Enable notifications in Settings → **push permission prompt**                                                                                                 | same bullet                                   |
| 7   | Browse: apply two or three filters, run a free-text search, open a result                                                                                     | core feature                                  |
| 8   | Open a profile, show the compatibility breakdown, send a first message (show the 200-character requirement)                                                   | core feature                                  |
| 9   | "⋯" menu on a profile → **Report**, complete the flow; then "⋯" → **Block**, and show the profile leaving the grid                                            | "content reporting and blocking mechanisms"   |
| 10  | Settings → General → export data (share sheet appears)                                                                                                        | iOS-specific behaviour                        |
| 11  | Settings → General → **Delete account**, all the way through the confirmation                                                                                 | 5.1.1(v), and the "account deletion" bullet   |

Do the deletion last, on a throwaway account — not the demo account the reviewer needs. Re-seed the
demo account afterwards if it was the one deleted.

Nothing in the app is paid, so the "accessing paid content or features" bullet has no shot; say so in
the reply (item 1 already does) rather than leaving it silently unaddressed.

## Notes field version (3,991 characters)

The App Review Information → Notes field caps at 4,000 characters, so the full reply does not fit. This
is the same content re-cut to fit, and it is what stays on the version record for every future
submission. Nothing in it is a placeholder any more, but the iPad's generation and iPadOS version are
estimates in here exactly as they are in the reply — correct them in both places if the device says
otherwise.

```
Compass is a free, open-source directory for finding a friend, partner or collaborator based on values and personality rather than photos. Members search and filter the whole directory (20+ attributes plus free-text search of bios), see a compatibility score whose weights they set themselves, and must write 200+ characters, from a verified email address, to open a conversation. Audience: adults 18+ (signup rejects birth dates under 18) seeking intentional one-to-one connections — platonic, romantic or collaborative. Non-commercial: no ads, subscriptions, in-app purchases or data sales; donation-funded, source public under AGPL-3.0 at github.com/CompassConnections/Compass.

DEMO ACCOUNT
Credentials are in Sign-In Information. The account has a completed profile, a saved search, an existing conversation and a verified email, so every feature works without creating content. Please sign in with email and password; the social providers work but need an account of your own. Browse tab = the directory; funnel icon = filters; "Message" on a profile = first contact (200-char minimum); "..." menu on a profile = report and block (report is also inside conversations); Settings > General = data export and account deletion; Settings > Notifications = push opt-in. No sample files or invite codes are needed.

DEVICES TESTED
iPhone 11 (iOS 26.6.1), physical device, covering push, Universal Links, both sign-in providers, photo upload, voice input and deletion; and an iPad (11th generation) on iPadOS 26.6.1. Minimum supported version is iOS 15.0.

EXTERNAL SERVICES
Firebase Authentication (accounts, Google and Apple sign-in), Firebase Cloud Storage (photos), Firebase Cloud Messaging via APNs (push), Supabase managed PostgreSQL (profiles and messages, encrypted at rest), Google Cloud Run (our own API), Vercel (the compassmeet.com website only — the app loads its bundle from local assets, never a remote page), Resend (transactional email), Sentry (crash reporting) and PostHog (analytics; no advertising identifier, no cross-app tracking). AI services: OpenAI gpt-4o-transcribe transcribes the optional voice input on the profile form, and Google Gemini turns that transcript into suggested values for the member's own profile fields, which they edit before saving. Neither is used for matching, ranking or moderation, and neither runs unless the member taps the microphone. No payment processor, ad network or data broker: nothing is sold and no ads are shown.

REGIONAL DIFFERENCES
None. Identical features and content in every region, free everywhere, no geographic gating. Localised in English, French and German, chosen in-app rather than by region.

REGULATED INDUSTRY / THIRD-PARTY MATERIAL
Not applicable. No financial, health, gambling or similar services, and no protected third-party material — content is ours (AGPL-3.0) or member-created under Terms accepted by checkbox at registration.

GUIDELINE NOTES
4.2: not a website wrapper — the whole web bundle ships inside the binary; native push (APNs), Sign in with Apple, native Google Sign-In, iOS share sheet, Universal Links, data export via the share sheet.
4.8: Sign in with Apple is on both the sign-in and registration screens; account deletion also revokes the Apple refresh token.
5.1.1(v): Settings > General > "Delete account", in-app, no support contact needed.
1.2: report and block on every profile's "..." menu, human moderators, moderation policy published at https://compassmeet.com/terms ("Community standards", "Safety tools, moderation, and holds"), 18+ only, and an automatic hold after more than five new conversations in 24 hours.
No paid content, subscriptions or in-app purchases exist, so there is no purchase flow. The app requests microphone, camera and photo-library access (profile photo and optional voice input) and notification permission; it never requests location or contacts and shows no App Tracking Transparency prompt.

The contact in App Review Information is monitored daily.
```

## Gaps to close before resubmitting

Not part of Apple's request, but each is something a reviewer following the notes above could walk into.

- **iPad.** `TARGETED_DEVICE_FAMILY = "1,2"`, so the app is Universal and review may run on iPad. You
  have tested on one — fill its generation and iPadOS version into item 2 rather than leaving the
  placeholders, and re-walk the grid, profile and messaging layouts at iPad width if it has been a while,
  since [ios.md](ios.md)'s on-device checklist only records the iPhone 11. Do not name a device or a
  version in item 2 that you have not actually confirmed on the device itself.
- **Blocked users' comments still render.** [ios.md](ios.md) §8.4's open item: `blockedUserIdSet`
  (`web/hooks/use-user.ts`) exists and is unused, so the thread builders in `profile-comments.tsx` and
  `vote-comments.tsx` still show comments by a blocked member. The reply above tells the reviewer to
  block someone; if they then see that person's comments, the block reads as broken — which is a
  guideline 1.2 finding on a submission already under 2.1.
- **Demo account.** Confirm it still exists, its email is still verified (messaging is gated on
  `firebaseUser?.emailVerified`), and it still has the saved search and the existing conversation the
  notes promise. If the recording's step 11 deletes an account, make sure it was not this one.
- **`IOS_WEB_DEBUG`** is `''` in `.github/workflows/cd-ios.yml` — correct for a shipping build. Leave it.
