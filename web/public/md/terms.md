# Terms & Conditions

These are the rules for using Compass. They are written to be read, not to be survived — if a clause here is
unclear, that is a defect and you should [tell us](/contact). By creating an account or using the site you
agree to what follows, alongside the [Privacy Policy](/privacy), which explains what happens to your data.

Compass is a free, open-source, community-governed project rather than a company selling you something. That
shapes most of what is below: there is no subscription to cancel, no ads to opt out of, and the rules are
changed by [a vote](/vote) rather than by an announcement.

## Who can use Compass

- **You must be 18 or older.** Compass is for adults; the profile form will not accept an age below 18, and an
  account found to belong to a minor is removed.
- **One account per person**, with information that is actually about you. Impersonating someone else, or
  running a profile for a business, is not allowed.
- **You are responsible for your account** — keep your sign-in secure and tell us if you think someone else
  has access to it.

## Your content stays yours

You keep ownership of everything you write and upload: your bio, photos, prompt answers, compatibility
answers, messages, comments, events and testimonials.

By posting it, you give Compass permission to store it and to show it where you have chosen for it to appear.
That permission exists so the site can function, and it ends when you delete the content or your account.

Two things follow from how Compass works, and are worth being blunt about:

- **Most of your profile is public.** An open directory is the point of the product — anyone, including people
  who are not signed in and search engines, can read what your profile shows. What is visible is under your
  control in [settings](/settings), and you should treat anything you put on a public profile as public.
- **A message you send can be read, kept, screenshotted or reported by the person you sent it to.** Compass
  encrypts messages at rest and does not sell them, but no platform can control what a recipient does.

Being featured on the home page is separate and opt-in: Compass only quotes your profile in a
[spotlight](/) if you have turned that on in settings, and turning it off removes it.

## AI features, and what leaves the platform

Compass uses third-party AI services for a small number of features. They are all things you start yourself —
none of them run over your profile or your messages in the background — but you should know exactly what is
sent where before you use them.

### Filling in a profile from a document, a link or your voice

If you paste text, give a link, or dictate an answer while building your profile, that material is sent to
external providers to be read and turned into profile fields:

- **Text you paste, or the contents of a page you link to**, goes to **Google's Gemini API**, which returns
  structured fields the form pre-fills for you. You then review and edit everything before anything is saved.
- **If you link to a page**, Compass fetches that page — including Notion pages and Google Docs — and reads
  its text. Only give links to pages you are happy for us to read.
- **If you dictate**, the recording goes to **OpenAI** for transcription first, and the transcript then goes
  to Gemini as above.
- The result is cached on our server for up to 24 hours, so that repeating the same request does not repeat
  the work.

The fields Compass extracts include sensitive ones — religion, political views,
sexual orientation, ethnicity, neurotype, health-related notes and substance use — because those are fields
the profile form offers. If you paste a document containing them, you are sending that information to a
third-party AI provider. If you would rather not, fill the form in by hand: every field is editable directly
and the AI features are entirely optional.

### What is not sent to an AI provider

As part of running the platform, Compass does **not** feed your bio, your compatibility answers, your search
history or your private messages to any AI model. The compatibility score is arithmetic on your own answers —
the [code is public](https://github.com/CompassConnections/Compass/blob/main/common/src/profiles/compatibility-score.ts)
and there is no model involved.

Administrators moderating the site or preparing an introduction may use assistive tools, including AI
assistants, on profile content and on conversations they are themselves a party to. They do not use them on
private conversations between other people.

The current list of every external provider that touches your data is kept in the
[Privacy Policy](/privacy#third-parties-we-rely-on).

## Community standards

Compass exists for people who want depth rather than volume, and the rules follow from that.

**Treat people as people.** Engage respectfully. Harassment, hate speech, threats, and repeated unwanted
contact after someone has disengaged are all grounds for removal.

**No spam or solicitation.** Do not use Compass to advertise, recruit, promote a business, or run scams. Mass
identical messages are the clearest signal of this and are limited automatically — see below.

**No nudity or sexually explicit content.** Compass does not permit public sharing of nudity, sexual acts, or
sexually suggestive material. Such content is removed and may lead to suspension.

**Zero tolerance for child sexual abuse and exploitation (CSAE).** This includes grooming, sextortion,
trafficking, and any content or behaviour that sexually exploits, abuses or endangers a child. Suspected CSAE
results in immediate account termination and may be reported to law enforcement and to the National Center for
Missing and Exploited Children (NCMEC) as required by law.

**No graphic violence.** Real-world graphic violence outside a newsworthy, contextual or educational purpose
is not allowed, and content promoting or glorifying violence is removed.

**Do not post other people's information.** Sharing someone's private details, photos, or conversations
without their consent is not allowed. This includes screenshots of Compass conversations.

**Location.** Compass does not share your precise location with other members. Profiles show a city, at the
granularity you choose.

## Safety tools, moderation, and holds

You can [block](/settings) a member, hide a profile, report a person or a piece of content, and leave any
conversation. Reports go to human moderators.

Some limits are enforced automatically:

- **Starting more than 5 new conversations in 24 hours puts your account on hold.** This is a spam guard, not
  a judgement — it catches scripted accounts, and it catches an occasional genuine member having an
  enthusiastic day. A human reviews every hold, normally within 24 hours, and restores accounts that look
  genuine. Nothing you have written is lost while a hold is in place.
- **Accounts under review** are limited until a moderator has looked at them.
- **Confirmed abuse — scams, spam, harassment — is permanent.** There is no review, and we do not explain
  which signal identified the account.

Moderators can remove content, hide comments, and suspend or terminate accounts that break these rules. Where
a decision is a judgement call rather than a clear violation, you can contest it by
[writing to us](/contact).

## Compass is free, and stays free

There is nothing to buy. No subscriptions, no paid tiers, no in-app purchases, no advertising, and no selling
of your personal information. Every feature is available to every member.

Donations are voluntary, fund hosting and running costs, and buy no advantage on the platform whatsoever — not
visibility, not features, not moderation outcomes. Where the money goes is published on
[/financials](/financials).

These are not just promises in a document: under the governance model below, introducing advertising, paid
features, or data monetisation would require a community vote.

## Open source and licensing

Compass is developed in the open. Unless stated otherwise, the source code, designs and related materials are
licensed under **AGPL-3.0**; some components are under permissive licences, marked as such in the repository.
Subject to those licence terms you may use, copy, modify, publish and distribute the materials.

**Contributions.** By submitting code, designs, documentation or other contributions, you agree they are
licensed under the same licence that governs the project at the time you contribute, and you confirm you have
the right to grant that licence and that your contribution does not infringe anyone else's rights.

**Your profile content is not covered by that licence.** The AGPL applies to the software, not to what members
write.

## Community governance

Material changes — to licensing, to monetisation, to these Terms, or to how the platform is governed — go
through the [governance process](/constitution): proposals are published, discussed and
[voted on](/vote), and the decisions are public.

This is the mechanism behind the promises above. A commitment that one person can reverse quietly is not much
of a commitment; these can only be reversed by a vote you get to take part in.

## Availability and liability

Compass is provided as it is, by a small volunteer project, without any warranty. We do not guarantee that the
service will be uninterrupted, that data will never be lost, or that every member is who they claim to be.

**Compass is not responsible for disputes between members, or for what happens when you meet someone.** Use
your judgement, meet in public the first time, and tell someone where you are going. To the extent the law
allows, Compass is not liable for indirect or consequential damages arising from your use of the platform.

Nothing here limits rights you have that cannot be limited by agreement — including your rights under the
GDPR, which are set out in the [Privacy Policy](/privacy).

## Ending your use

You can delete your account at any time from [/delete-account](/delete-account). Deletion removes your
profile, your content and your messages, and clears the analytics identity stored on your device.

We may suspend or terminate an account that breaks these Terms, as described under moderation above.

## Changes to these Terms

These Terms live in the
[repository](https://github.com/CompassConnections/Compass/blob/main/web/public/md/terms.md) like the rest of
the site, so every change is a public commit with a date and a diff — you can read exactly what changed and
when. Material changes go through governance and are announced in [/news](/news). Continuing to use Compass
after a change means you accept the updated Terms.

## Contact

Questions about these Terms: [hello@compassmeet.com](mailto:hello@compassmeet.com), or
[/contact](/contact). Security issues have their own route — see [/security](/security).
