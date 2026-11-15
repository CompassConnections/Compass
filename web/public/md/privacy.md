# Privacy Policy

Compass is built on the idea that you should be able to see how it works. That applies to your data too, so
this page tries to be an accurate description of what actually happens rather than a legal disclaimer — down to
naming every cookie and every third party. If you find something here that does not match what the app does,
that is a bug: [tell us](/contact) and we will fix the page or the code.

## What we collect

- **Account details** — your email address, and whatever you put in your profile: name, age, location, photos,
  bio, prompt answers, and compatibility answers.
- **Content you create** — messages, comments, events, testimonials, and votes.
- **Usage data** — which pages you open and which features you use, so we can tell what is worth building.
  See [cookies and local storage](/privacy#cookies-and-local-storage) below for exactly how this is collected.
- **Technical data** — the IP address and browser your requests arrive with, which any web server necessarily
  sees, plus error reports when something breaks.

Your profile is **yours to show or keep back, field by field**. An open directory is still the point —
people find each other without an algorithm deciding for them — but how much of you is in it is your choice.

## Who sees your profile

Every part of your profile has its own audience, which you choose in the [profile editor](/profile): your
photos, age, location, bio, what you are looking for, your beliefs, your health and lifestyle answers, your
links, your compatibility answers, and the endorsements other people leave on your page.

- **Everyone**: anyone on the web, signed in or not, including search engines.
- **Members**: people signed in to Compass.
- **My circle**: only the members you have added to your circle, one by one.
- **Only me**: no one (besides Compasss moderators).

A profile-wide setting, Everyone or Members, is the default for every field you have not set yourself. A
single field can be wider or narrower than that default. New profiles start on Everyone, and that choice is
the first thing in the profile form, so you can change it before you write anything.

What this does, and what it does not:

- **Hidden means not sent.** The choice is enforced on our servers. A field someone is not allowed to see is
  not delivered to their browser at all: it is not in the page, not in the page's source, and not in the link
  preview. No one can read it, not even a clever hacker.
- **Hidden fields are not searchable.** A field you keep from members is not matched by search filters or by
  keyword search. Hiding one of your own fields does not limit your own searches: you can still filter
  other people on a field they show.
- **Your compatibility score still uses your whole profile.** The score, and the check of whether you fit
  what someone said they are looking for, are computed on everything you filled in, hidden or not. Only the
  resulting number is shown; a breakdown never shows a row for a field the reader cannot see.
- **Your display name is always shown, and your profile picture travels with you.** The name is what makes a
  link to your page make sense. Your main photo is also the small picture shown next to your messages,
  comments and notifications, so the people you interact with see it there even if you hide your photos on
  your profile.
- **Your circle works one way.** Adding someone shows them the fields you set to "My circle" and shows you
  nothing more of theirs. You can remove anyone at any time and they are not told. Someone can only ask to
  join your circle after you have written to them, and ignoring a request is not reported back to them.
- **What you show to Everyone is public in the full sense.** It can be read without an account, indexed by
  search engines, and included in our public [feed of new profiles](/feed.xml), which other sites and feed
  readers can republish. The feed carries your name and whichever of your headline, location, keywords,
  gender and a short bio excerpt are public, and never your photos. Narrowing a field later removes it from
  Compass at once, but we cannot recall copies that were already indexed, republished or saved by someone.
- **Compass administrators can read your whole profile, including fields set to "Only me".** They do so to
  moderate: handling a report, investigating abuse or a suspected fake account, or helping you when you ask.
  "Only me" therefore means no other member, not nobody at Compass. Moderators who are not administrators
  see only what any member sees.
- **Pausing hides all of it.** A paused profile is out of search and cannot be opened by other members. Your
  conversations and everything you wrote stay, and you can resume at any time from [settings](/settings).

## How we use it

Your data is used to operate the platform, to show you to the people looking for someone like you, and to work
out what to improve next.

- We **do not sell your personal information**, and we do not run ads.
- We do not share your precise location with other members without your explicit consent.
- We do not train any model on your content, and we do not sell or share it for anyone else's advertising.
  Compass does send material to AI providers for two optional features you trigger yourself, and to screen the
  first message of every new conversation for spam, scams and bots — see
  [AI features](/privacy#ai-features-and-what-we-send-them) below, which spells out exactly what goes where.
- Aggregate, non-identifying numbers — member counts, growth, activity — are published openly on
  [/stats](/stats), because a platform asking you to trust it should show its own figures.

## Emails we send, and sign-ups that stop halfway

Every email from Compass is one of two kinds. Most are things you asked to hear about — a new message, a
match, a saved search that found someone — and each kind can be switched off on its own in
[settings](/settings#1). Emails about your circle (someone asking to join it, or adding you to theirs) do not
have a switch of their own yet; they stop when you turn off all email. A few are about the account itself: confirming your address, and the notice
described next. Those are not marketing, and they go out regardless of the notification settings, because
they are how we tell you what we hold about you.

**If you start signing up and stop.** Signing up creates a login first and a profile second. If you create
the login — with an email address, or through Google or Apple — and never finish the profile, we hold that
address and nothing else: no profile, no name, nothing visible to anyone. Three days later we send **one**
email saying so, with a link to finish and a link to delete the login on the spot. If nothing happens within
**30 days** of that email, the login is deleted automatically, address included. Logins left unfinished for
**six months** are deleted without an email, on the view that an unexpected message from a site you do not
remember visiting is worse than none. There is no second reminder: the email exists so that no address sits
with us that you have forgotten giving, not to bring you back.

## Cookies and local storage

Cookies are the part of a privacy policy that is usually vaguest, so here is the complete list. Under EU rules
(GDPR and the ePrivacy Directive) some of this is **strictly necessary** and needs no permission, and some of
it needs your **consent** — each entry says which, and says so honestly.

### `analytics-consent` — necessary

Whether you pressed "Allow" or "No thanks" on the consent prompt. Recording a refusal is the only way to avoid
asking again on every page, which is why a consent cookie is itself exempt from needing consent. Kept for a
year, after which we ask once more rather than assume a decision about an older version of the stack still
holds.

### `lang` — necessary

The language you picked in the language switcher. Stored for a year, `SameSite=Lax`, `Secure` over HTTPS.
Written only when you actually change the language, which is what makes it a preference cookie rather than a
tracking one — no consent required.

### `ph_…_posthog` and `dmn_chk_…` — analytics, consent-based

Set by [PostHog](https://posthog.com), the product analytics we use to count page views and feature usage.
They hold a randomly generated device id and session id — not your name or email, though the id is linked to
your account id once you sign in. The `dmn_chk_` one is a short-lived probe PostHog uses to work out which
domain it may write to. PostHog also mirrors the same values into `localStorage`.

**This is the category that legally requires your consent, so we ask before any of it runs.** PostHog is not
started at all until you press "Allow" on the small prompt in the corner. Press "No thanks" and it is never
loaded — and anything it stored on an earlier visit is deleted then and there. You can change your mind at any
time from [settings](/settings).

### Things stored on your device that are not cookies

The same rules cover any storage on your device, so for completeness:

- **`device-token`** — a random id in `localStorage` that lets us recognise a browser for abuse and
  fraud prevention. Necessary, no consent required.
- **`theme`, `font-preference`, and cached profile data** — your display settings and a copy of your own
  profile so the app can render before the network answers. Preferences and cache; they never leave your
  device.
- **Error and session-replay data** — see [Sentry](/privacy#third-parties-we-rely-on) below.

## Third parties we rely on

Compass is a small project, so it runs on other people's infrastructure. Each of these processes some of your
data on our behalf, and each has its own privacy policy worth reading:

- **[Supabase](https://supabase.com/privacy)** — the Postgres database holding profiles, messages, and events.
  Chat messages are stored encrypted (AES-256).
- **[Firebase](https://firebase.google.com/support/privacy) (Google)** — sign-in and photo storage. If you use
  Google Sign-In, Google sees that you signed in to Compass.
- **[Vercel](https://vercel.com/legal/privacy-policy)** — hosts the website;
  **[Google Cloud](https://cloud.google.com/terms/cloud-privacy-notice)** hosts the API.
- **[Resend](https://resend.com/legal/privacy-policy)** — sends the emails we send you, so it processes your
  email address and the contents of those emails.
- **[Google Gemini](https://ai.google.dev/gemini-api/terms)** and
  **[OpenAI](https://openai.com/policies/privacy-policy/)** — the optional profile assistant, and (Gemini only)
  the automatic check on the first message of a conversation, both described in full in the next section.
- **[Notion](https://www.notion.so/privacy) and [Google Docs](https://policies.google.com/privacy)** — not
  processors of ours, but if you point the profile assistant at a page hosted there, we fetch it, so they see
  a request for it.
- **[PostHog](https://posthog.com/privacy)** — product analytics, as described above.
- **[Sentry](https://sentry.io/privacy/)** — error reporting, plus session replay on about 1 in 10 sessions —
  and on any session where an error occurs — so we can see what a bug looked like. Replay **masks all text, all
  form inputs, and all images by default**, so what we get is the shape of the page and where you clicked, not
  what you wrote. Error reports include your IP address, and start without asking — they put nothing on your
  device and are what keeps the app fixable. The replay recorder sits behind the same prompt as the analytics
  above, and never runs in the Android app at all.
- **Google Fonts** — the site loads its typefaces from Google's servers, which means Google sees the IP address
  of anyone who opens a page. Self-hosting them is a known improvement we have not made yet.

## AI features, and what we send them

Three things send your material to an external AI provider. Two are features you start yourself. The third
runs once per conversation, on its first message, whether you sent it or received it. Nothing else runs over
your profile, your answers or your messages in the background. These are the points at which your words leave
our infrastructure, so here is the whole of it.

**Building a profile from a document, a link, or your voice.** If you paste text, give a link, or dictate an
answer instead of typing it:

- The text — or the text of the page you linked — is sent to **Google's Gemini API**, which returns structured
  fields the form pre-fills. Nothing is saved until you have reviewed and accepted it.
- If you gave a link, we fetch that page ourselves first, including Notion pages and Google Docs.
- If you dictated, the audio goes to **OpenAI** for transcription before the text goes to Gemini.
- The result is cached on our server for up to 24 hours so a repeated request does not repeat the work.

**The fields it extracts include sensitive ones** — religion, political views, sexual orientation, ethnicity,
neurotype, health-related notes, substance use — because those are fields the profile form offers. If your
document mentions them, they go to Gemini along with everything else. The feature is entirely optional: every
field can be typed in directly, and typing loses you nothing but time.

**What these providers do with it is governed by their terms, not ours.** Read Google's
[Gemini API terms](https://ai.google.dev/gemini-api/terms) before using the assistant with anything you would not want
reviewed. As of this writing, content should not be used to improve Google's products:

> When you use Paid Services, including, for example, the paid quota of the Gemini API, Google doesn't use your
> prompts (including associated system instructions, cached content, and files such as images, videos, or documents) or
> responses to improve our products, and will process your prompts and responses in accordance with the Data Processing
> Addendum for Products Where Google is a Data Processor.

**Screening the first message of a conversation.** When you write the first message to someone, or someone
writes their first message to you, that message is sent to **Google's Gemini API** together with both profiles,
and the model is asked whether it is generic, about looks, a likely scam, or ignores something the recipient
asked for. It is the one place where your profile goes to a model without you starting it, and it runs for
both people in the conversation: your profile is sent when you write to someone, and when someone writes to you.

- **What is sent**: the text of the first message, and both profiles as they read on the site — name, headline,
  keywords, bio, interests, causes, work, up to 30 compatibility answers, and every other field you filled in,
  which can include the sensitive ones listed above. The sender's account age goes too. Photos, coordinates,
  email address and settings do not.
- **Only the opening message.** Every later message in that conversation stays between the two of you and is
  not sent anywhere.
- **What the answer does.** A message the model finds generic is sent back to the sender with a one-line reason
  they can act on. A message that reads as a scam or is about the recipient's looks puts the sender's account
  on hold until a person reviews it, within 24 hours. A borderline message is delivered and noted for a
  moderator. The recipient never sees the model's answer, and a refused message never reaches them.
- **What we keep**: the verdict in our server logs, with the sender's account id. When a message is held, sent
  back or flagged, the model's one-line summary is posted to the moderators' private channel together with
  the two usernames, so a person can review the decision. The message text and profiles are not stored by this
  step beyond what Compass already holds.
- **If the model does not answer** within 30 seconds, or is down, the message goes through on our own
  rule-based checks alone. The check cannot be switched off per member: it is what keeps bulk messaging and
  scams out of inboxes, and the alternative is a person reading every first message.

Anything in a message, including the first one, is treated by the model as data to judge, not as instructions
to follow. If a decision seems out of line with [our values](/values), tell us through [/contact](/contact).

**Nothing else goes to a model.** Beyond the first message of a conversation, your private messages are not sent
to any AI provider. Your bio, compatibility answers and search history are not sent to one as part of running
Compass, except as part of that first-message check. The compatibility score is arithmetic on your answers and
profile fields — [how it works](/compatibility-score), and [its code is public](https://github.com/CompassConnections/Compass/blob/main/common/src/profiles/compatibility-factors.ts).
Admins moderating the site or preparing an introduction may use assistive tools, including AI assistants, on
profile content and on conversations they are themselves part of — never on private conversations between
other people.

## Storage and security

We use current encryption and access-control practices, and the entire codebase is
[open source](https://github.com/CompassConnections/Compass) — anyone can audit exactly how data is stored and
who can reach it, which is a stronger guarantee than a paragraph like this one. No online system is completely
secure, so please use the platform accordingly: do not post anything to a public profile you would not want a
stranger to read.

Security issues can be reported privately — see [/security](/security).

## Your rights and your choices

You can do all of this yourself, without asking us:

- **See and edit** everything on your profile in [settings](/settings).
- **Export** your data — settings gives you a download of what we hold.
- **Delete your account**, from [/delete-account](/delete-account). Deletion removes your profile, messages, and
  content, and clears the analytics identity and local storage on your device.
- **Delete an unfinished sign-up** from the link in the notice we send about it, or by emailing us. It goes on
  its own after the period above in any case.

If you are in the EU or UK you also have the right to access, correct, port, or erase your data, to object to
processing, and to complain to your national data protection authority. Email
[hello@compassmeet.com](mailto:hello@compassmeet.com) and a person will answer.

## Changes to this policy

This page lives in the [repository](https://github.com/CompassConnections/Compass/blob/main/web/public/md/privacy.md)
like the rest of the site, so every change to it is a public commit with a date and a diff. Material changes
will also be announced in [/news](/news).

## Contact

Questions about anything on this page: [hello@compassmeet.com](mailto:hello@compassmeet.com), or
[/contact](/contact).
