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

Most of your profile is **public by design**: the whole point of an open directory is that people can find each
other without an algorithm deciding for them. What is visible is under your control in
[settings](/settings).

## How we use it

Your data is used to operate the platform, to show you to the people looking for someone like you, and to work
out what to improve next.

- We **do not sell your personal information**, and we do not run ads.
- We do not share your precise location with other members without your explicit consent.
- We do not train any model on your content, and we do not sell or share it for anyone else's advertising.
  Compass does send material to AI providers for two optional features you trigger yourself — see
  [AI features](/privacy#ai-features-and-what-we-send-them) below, which spells out exactly what goes where.
- Aggregate, non-identifying numbers — member counts, growth, activity — are published openly on
  [/stats](/stats), because a platform asking you to trust it should show its own figures.

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
  **[OpenAI](https://openai.com/policies/privacy-policy/)** — the optional profile assistant, described in
  full in the next section.
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

Two features send your material to an external AI provider. Both are things you start yourself — nothing here
runs over your profile, your answers or your messages in the background — but they are the point at which your
words leave our infrastructure, so here is the whole of it.

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

**Nothing else goes to a model.** Your bio, compatibility answers, search history and private messages are not
sent to any AI provider as part of running Compass. The compatibility score is arithmetic, and
[its code is public](https://github.com/CompassConnections/Compass/blob/main/common/src/profiles/compatibility-score.ts).
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
