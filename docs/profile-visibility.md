# Profile visibility: what is shown, and to whom

> **Status: built** (migration `20261115120000_profile_field_visibility.sql`). This is the reference for
> how it works. Where the build differs from the plan below, the "As built" section at the end says
> so and wins.

## Today

A profile is all-or-nothing. Three switches exist, and none of them is per field:

| Column                     | Values                  | Meaning                                        |
| -------------------------- | ----------------------- | ---------------------------------------------- |
| `profiles.visibility`      | `public`, `member`      | Who may read the whole profile page            |
| `profiles.feed_visibility` | `none`, `basic`, `full` | How much is republished off-site (now retired) |
| `profiles.disabled`        | boolean                 | Whether the member is on the site at all       |

A viewer who fails the gate gets `user_id`, `visibility`, `disabled` and the display name
(`common/src/profiles/visibility.ts`). A viewer who passes gets every column.

The consequence: someone who would happily show their bio and interests to the open web, but not their
photos or their neurotype, has to pick members-only for everything. Since `member` is the default, most
of the site is invisible from outside for reasons that apply to only a few fields.

## Model

Two axes: **fields** of the profile (what) and **audiences** (who). The member picks one audience per
field. Sections exist only in the form, as a shortcut that sets every field in a section at once; they
are never stored.

### Audiences

An ordered ladder, each rung a subset of the one above. Ordering is what keeps the rule to one line:
_a viewer sees a field if their rung is at or below the field's rung._

| Audience    | Who                                                | Depends on the viewer? |
| ----------- | -------------------------------------------------- | ---------------------- |
| `public`    | Anyone, signed in or not, including search engines | No                     |
| `member`    | Signed-in members                                  | Only signed in or not  |
| `connected` | Members the owner has approved, one by one (below) | Yes, per pair          |
| `only_me`   | The owner (and admins, for moderation)             | Yes                    |

In the interface this audience is called **"My circle"** (approving someone is "adding them to my
circle", a request is "asking to join their circle"); the stored value and the code keep `connected`.

**`connected`** means: the owner has manually approved this member to see more of their profile.
Nothing else grants it: not messaging, not mutual interest, not a like.

- **One-directional.** A approving B shows A's `connected` fields to B. It shows nothing of B's to A.
- **Two ways in.** The owner approves someone directly (from that person's profile or from a
  conversation), or a member asks and the owner approves the request.
- **Revocable at any time**, with immediate effect and no notification to the other person.
- **A block in either direction deletes the approval** and any pending request.
- **Declining is silent.** The requester is not told; the request just stays unanswered from their side,
  so saying no carries no social cost.

Blocked, banned and disabled keep working as today and override everything.

### Fields

A field is **one control in the profile form, as the member sees it**, not one database column. Location
is one field although it is six columns (city, region, country, latitude, longitude, geodb id); the Big
Five is one field although it is five. A choice and its free-text "Details" companion
(`political_beliefs` + `political_details`, `gender` + `gender_details`) are one field: hiding the
checkboxes while showing the sentence that explains them protects nothing.

Each field has a stable key, which is what gets stored. Indicative list, grouped by the form's existing
section headings (the full map is written in phase 1):

| Form section        | Field keys (indicative)                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| Basics              | `age`, `gender`, `location`, `headline`, `keywords`                                            |
| Photos              | `photos` (`pinned_url`, `photo_urls`, `image_descriptions`, avatar)                            |
| Bio                 | `bio`                                                                                          |
| Who I'm looking for | `pref_gender`, `pref_age`, `pref_max_distance`, `pref_relation_styles`, `pref_romantic_styles` |
| Work                | `occupation`, `company`, `work`                                                                |
| Education           | `education_level`, `university`                                                                |
| Relationships       | `relationship_status`, `orientation`                                                           |
| Family              | `has_kids`, `wants_kids`                                                                       |
| Political beliefs   | `political_beliefs`                                                                            |
| Religious beliefs   | `religion`                                                                                     |
| Interests           | `interests`, `causes`, `online_communities`                                                    |
| Lifestyle           | `diet`, `exercise`                                                                             |
| Substances          | `drinking`, `smoking`, `cannabis`, `psychedelics`                                              |
| Psychology          | `mbti`, `big5`, `neurotype`                                                                    |
| Demographics        | `ethnicity`                                                                                    |
| Background          | `raised_in`                                                                                    |
| Languages           | `languages`                                                                                    |
| Socials             | `links`                                                                                        |
| Accessibility       | `accessibility_notes`                                                                          |

Two things are not in the form and get one key each, with the picker on the page where they are
managed: `answers` (compatibility answers) and `endorsements` (comments left on the profile).

Display name and username are always shown and have no picker.

A field with no stored choice follows `profiles.visibility`, so an existing profile behaves exactly as
it does now until its owner changes something.

### How the two existing switches fit

- `visibility` stays, as the **profile-wide default, not a ceiling**. A field with no choice of its own
  follows it; a field with one may be narrower _or wider_. So a members-only profile can show a
  signed-out visitor its headline, and a public profile can keep its photos for members. The
  whole-profile gate for a visitor is "does this profile have any public field": if not, they get the
  identity columns as before.
- `feed_visibility` is retired. The public feed carries whichever of headline, location, keywords,
  gender and bio are public, and never photos (see feed.md). The column is left in the table, unread.
- `disabled` stays separate (see the earlier discussion: it is on/off, not an audience).

## Storage

One column:

```sql
alter table profiles
    add column field_visibility jsonb not null default '{}'::jsonb;
-- {"photos": "member", "neurotype": "connected", "political_beliefs": "only_me"}
-- an absent key follows `visibility`
```

Only per-field choices are stored. There is no section value anywhere in the database: the section
control in the form writes one entry per field in that section and nothing else.

- **Only differences are stored.** Picking the audience that equals the profile-wide one removes the
  key, so the map holds exceptions only and stays small.
- **Never rewritten when the profile-wide setting changes.** A field's own choice stands whatever
  `visibility` becomes; only the fields without one move with it. The confirmation modal for switching
  says so in both directions.
- Validated by Zod on write (known field keys, known audiences). It is saved by `update-profile` with
  the rest of the form, in the same call.

And one table for approvals:

```sql
create table profile_access (
  owner_id text not null references users (id) on delete cascade,
  viewer_id text not null references users (id) on delete cascade,
  status text not null check (status in ('requested', 'approved')),
  created_time timestamptz not null default now (),
  decided_time timestamptz,
  primary key (owner_id, viewer_id)
);

create index profile_access_viewer_idx on profile_access (viewer_id)
where
  status = 'approved';
```

A direct approval inserts `approved`; a request inserts `requested` and the owner's approval updates
it. Revoking or declining deletes the row. No `anon` / `authenticated` grants: it says who trusts whom,
so it is read only through the API.

Endpoints: `request-profile-access` (viewer), `set-profile-access` (owner: approve or revoke),
`get-profile-access` (owner: approved list and pending requests, in one call). A request and an
approval each raise a notification; a decline or a revoke does not.

The field map (field key → its columns, and its form section) lives in
`common/src/profiles/visibility.ts` as the single source for the server's redaction and the form's
pickers, with two safety properties:

- **Fails closed.** A column that is not in the map is treated as `only_me`.
- **A unit test asserts every `profiles` column is mapped**, so adding a field forces the choice instead
  of leaking it or silently hiding it. `docs/profile-fields.md` gets a step for this.

## Enforcement

The rule from the members-only work carries over unchanged: **hidden means not sent**, never "sent and
not rendered". One function in `common`:

```ts
redactProfileFor(profile, viewer: {id?: string; isOwner: boolean; isConnected: boolean; isAdmin: boolean})
```

Every place a profile leaves the server calls it:

| Exit                                          | Viewer known?   | Note                                                              |
| --------------------------------------------- | --------------- | ----------------------------------------------------------------- |
| `get-user-and-profile`, `get-profile`         | Yes             | Replaces the current all-or-nothing redaction                     |
| `get-profiles` (search, authed)               | Yes             | See "Search" below; `isConnected` is a join on `profile_access`   |
| `get-profile-answers`, `get-profile-comments` | Yes             | `canReadProfileContent` gains the field check                     |
| `get_profile_by_user_id` RPC (anon key)       | No              | Can only ever return `public` fields                              |
| SSG page props, OG tags, OG image             | No              | `public` fields only                                              |
| Feed (`get-profile-feed`)                     | No              | `public` fields only; no feed setting of its own                  |
| Emails that quote a profile                   | Yes (recipient) | Same function, recipient as viewer                                |
| Compatibility score                           | Per pair        | Computed on full profiles; only the breakdown is redacted (below) |

The RPC is the awkward one: it is SQL, so it would need its own copy of the field map.
Preferred: stop returning profile content from it at all (it keeps the three identity columns) and move
its two callers (`web/hooks/use-profile.tsx`, `common/src/profiles/profile.ts`) to the API, which
already serves anonymous viewers.

This is also where the three slightly different "may this viewer see this profile" rules get folded into
one.

## Search, filters and the compatibility score

This is the part that decides whether the feature is honest. `docs/feature-ideas.md` already rejects
"hidden from the profile, visible to the filter", because it lets people be screened on something they
cannot see being applied. The same holds in reverse: a filter that matches on a hidden field reveals it.

Rule: **a field a viewer cannot see is treated as unset for that viewer, in filters and search.** The
compatibility score is the one deliberate exception.

- **Filters.** A hidden value is null to the filter. Array filters already let null through; scalar
  filters exclude it. So hiding your politics means you no longer appear when someone filters by
  politics, and the settings page should say so in plain words.
- **Keyword search.** `search_text` / `search_tsv` are precomputed from the bio and tags. They are
  rebuilt from fields at `member` or wider only.
- **Compatibility score.** Stays computed on the **full** profiles of both members, whatever either
  hides. It is one number aggregated over many factors and the prompt answers, so little can be read
  back out of it, and a score that ignored hidden fields would rank people worse precisely for being
  careful. Nothing changes in `compatibility_scores` or in the recompute. Sorting by compatibility is
  unaffected.
- **Score breakdown.** The exception to the exception. The breakdown modal shows one row per factor
  (politics, religion, ...), and a single factor's score does give away a hidden field. It is also
  recomputed in the browser from the two profiles (`docs/compatibility-score.md`), and the browser will
  no longer hold the hidden fields. So the modal shows the stored overall score, the factors it can
  compute from what the viewer may see, and one unlabelled remainder line, "Other parts of their
  profile", when anything is hidden. No per-factor number for a hidden field is ever sent.

`public` and `member` cost nothing here: search is `authed`, so every searcher is a member and sees the
same thing. Only `connected` and `only_me` touch search and the breakdown, which is the reason for the
phasing below.

## Reciprocity

None. Hiding a field of your own does not stop you filtering other people on that field: they chose to
show theirs to members, and that is their choice to make. An earlier version dropped a filter on a field
the searcher hid themselves (after `docs/feature-ideas.md` §2, "if you hide a signal, you can't see it on
others"); it was removed.

## Settings UI

The choice sits **next to each field in the profile form**, not on a separate settings page: the member
decides who sees a thing at the moment they write it.

### The audience chip

One small component, `AudienceChip`, used for fields and for section headings. It shows an icon and a
label, and opens the four choices, each with one line of explanation:

| Audience    | Icon        | Label     | Explanation in the menu                              |
| ----------- | ----------- | --------- | ---------------------------------------------------- |
| `public`    | globe       | Everyone  | Anyone on the web, signed in or not                  |
| `member`    | people      | Members   | People signed in to Compass                          |
| `connected` | person-tick | My circle | Only members you added to your circle                |
| `only_me`   | lock        | Only me   | Nobody else. Still used for your compatibility score |

- All four choices are always offered: a field may be wider than the profile-wide setting.
- A field following the profile default has a quiet chip (`text-ink-500`, no fill). A field the member
  has narrowed has a filled chip. Scanning the form for exceptions is then a matter of looking for
  filled chips.
- Never colour alone: every state has its icon and a text label or `aria-label`
  ("Who can see Gender: Members").

### Large screens (`sm` and up)

The chip sits on the field's label row, right-aligned to the edge of the form column, with icon and
label. It opens a dropdown anchored to the chip.

```
Basics ──────────────────────────────────────  Whole section: [👥 Members ▾]

Gender                                                      [👥 Members ▾]
( Woman ) ( Man ) ( More… )

Location                                                    [🌐 Everyone ▾]
[ Brussels, Belgium                    ]

Psychology ──────────────────────────────────  Whole section: [ Mixed ▾ ]

Neurotype                                              [✓ My circle ▾]
[ ] ADHD  [x] Autism  [ ] Dyslexia …
```

### Mobile (below `sm`)

Same row, but the chip collapses to its icon plus a chevron in a 44px tap target, so a long translated
label never pushes the field label onto two lines. Tapping opens a bottom sheet titled with the field
name ("Who can see Gender?") listing the four choices with their explanations; the sheet is where the
words are.

```
Basics ─────────────── All [👥▾]

Gender                     [👥▾]
( Woman ) ( Man ) ( More… )

Location                   [🌐▾]
[ Brussels, Belgium      ]
```

### Section control (UI only)

Each `Category` heading gets a chip on its rule line, labelled "Whole section" (`sm` and up) or "All"
(mobile).

- Picking a value sets every field in that section to it, in form state. Nothing about the section is
  saved; reloading the form derives the section chip from its fields.
- It shows the common audience when all its fields agree, and **Mixed** when they differ.
- A section with a single unlabelled field (Political beliefs, Religious beliefs, Bio, Photos) shows
  the section chip only, which then _is_ the field's chip, instead of two identical controls stacked.
- The field-to-section grouping comes from the same field map the server uses, so the form cannot
  drift from what is enforced.

### Around the form

1. The profile-wide choice (`public` / `member`) moves from the last section of the form to the
   **first**, above Basics, and "Who can see this" becomes the first entry in `ProfileFormNav`. It sets
   the default every chip below starts from, so a new member can change it before typing anything.
   The feed choice that used to sit beside it is gone.
2. `ProfileFormNav` (the section index) marks sections that contain a narrowed field with a small lock.
3. **"View as"**: preview your own profile as a visitor, a member, or an approved member. This is what
   makes the settings trustworthy, and it is cheap because it is the same `redactProfileFor` call.
4. **Approved people**: the list of members you have approved, with a remove button, and pending
   requests with approve / ignore.
5. Signup step 0 (`required-profile-form.tsx`) asks only for name and username, which are always
   shown, so it needs no chip. Everything a member can hide is entered in the full form (step 1), below
   the profile-wide choice.

### Defaults at signup

- **Every field starts as `public`.** Concretely: the profile-wide choice starts on `public` (signup
  already sends `visibility: 'public'` from `initialRequiredState`; the column's own default of
  `member` only applies to rows created outside signup) and `field_visibility` starts as `{}`, so every
  chip reads "Everyone". No field is pre-narrowed.
- **One switch before any data.** The profile-wide choice is the first thing in the form. Setting it to
  members-only turns every chip to "Members" in place, before the member has entered anything.
- The hint under it says both things: what the default is, and that each field below can be narrowed
  on its own.

### On the rendered profile

The owner sees the same icon beside each field that is narrower than the profile default. A viewer sees
nothing for a hidden field, not a "hidden" placeholder: whether someone hides their neurotype is itself
information. Exception to decide: photos (see Decisions).

Requesting needs the viewer to know there is something to ask for. So a profile with at least one
`connected` field shows members one generic line, "Shares more with people they approve", with a
**Request access** button. It does not say which fields or how many. When the owner views someone
else's profile, the menu gains **Let them see my full profile**.

## Phasing

1. **Groundwork, no behaviour change.** The field map, the mapping test, `redactProfileFor`,
   one shared read rule, RPC reduced to identity columns. Everything inherits, so output is identical;
   the existing `profile-access` and `anon-access` integration tests pin that.
2. **`public` / `member` per field.** The column, `AudienceChip` on every field and section heading in
   the form (both layouts), "View as". No search or scoring changes. This alone covers the common case
   (public profile, members-only photos or sensitive fields) and makes going public a much smaller ask.
3. **`connected` and `only_me`.** The `profile_access` table, its three endpoints and notifications,
   the request button and approved-people list, the join in search, `search_text` rebuild, the breakdown
   remainder line.

Not planned: approving someone for some fields and not others ("show Alex my photos but not my
neurotype"). Approval is all-or-nothing per person; the per-field choice is which fields are
`connected` in the first place.

## As built

Where the code is:

| What                                    | Where                                                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Audiences, field map, redaction         | `common/src/profiles/visibility.ts` (`PROFILE_FIELDS`, `redactProfileFor`)                                           |
| Who is reading (owner, admin, approved) | `backend/api/src/helpers/profile-visibility.ts` (`getProfileViewer`)                                                 |
| Search filters and row redaction        | `backend/api/src/get-profiles.ts` (`fieldWhere`, `whenVisible`)                                                      |
| Approvals                               | `request-profile-access.ts`, `set-profile-access.ts`, `get-profile-access.ts`                                        |
| Chip, labels, section control           | `web/components/profile/audience-chip.tsx`, `field-visibility.tsx`                                                   |
| Own-profile summary, approvals UI       | `web/components/profile/profile-access.tsx`                                                                          |
| Tests                                   | `common/tests/unit/profile-visibility.test.ts`, `backend/api/tests/integration/field-visibility.integration.test.ts` |

The field list in "Fields" above was indicative. The real one is `PROFILE_FIELDS`; a unit test fails when
a `profiles` column is in no field and in neither `ALWAYS_SHOWN_COLUMNS` nor `OWNER_ONLY_COLUMNS`.

Differences from the plan:

- **The anon RPC keeps returning whole rows for profiles with no exception.** `get_profile_by_user_id`
  returns the full row only when the profile is public, enabled, not banned and `field_visibility` is
  `{}`; anything else gets the identity columns. The signed-out profile page moved to the API
  (`get-user-and-profile`), which redacts field by field. Avatar lookups (`useProfileByUserId`) stay on
  the RPC and fall back to the user's avatar.
- **The option join tables are gated in the database.** `profile_interests`, `profile_causes` and
  `profile_work` were readable with the anon key for any profile id, and ids are sequential. Their
  `public read` policy now goes through `profile_field_is_public()`, so they answer only where that field is
  public (its own choice, else the profile-wide default) on an enabled, unbanned profile. This also
  closes the same hole for members-only profiles.
- **Search treats an approved member like any other member.** A field set to `connected` or `only_me`
  is unset to every filter and to keyword search, approved people included. They still read the field
  on the rows they get back. This keeps the filters free of a per-row approval lookup.
- **Two-way search uses whole profiles**, like the compatibility score and its dealbreakers: whether
  the searcher fits a candidate's stated preferences is decided on what the candidate entered, hidden
  or not.
- **The breakdown modal shows the stored score and a standing note**, not a remainder line. A hidden
  field must look the same as an unset one in the browser, so a line that appeared only when something
  was hidden would itself be the leak. Rows are computed from what the reader can see; the number at
  the top is the stored one; the note says the two may differ.
- **"View as" is a rendered preview.** On your own profile, the "..." menu in the top bar offers View as
  a visitor / a member / someone in my circle; while a preview is running, a bar above it switches audience
  or returns to "Me". The public / members-only toggle that used to be in that menu is gone: it lives
  in the profile form. A choice fetches the profile through `get-profile` with `viewAs`, which runs the
  owner's request through the same gates and redaction as that audience, and renders the ordinary
  profile page from the result. `ViewAsContext` (`web/hooks/use-user.ts`) makes `useUser()` answer as
  that reader inside the preview, and the preview is `inert`. Answers and endorsements are still
  fetched with the owner's session, so their sections are left out when that audience would not get
  them, and the compatibility block is always left out.
- **No per-field icon on the rendered profile.** The owner gets one notice at the top of their own
  profile (how many fields have their own audience, the approvals list) instead of an icon per field.
- **No reciprocity.** A member can filter on a field they hide themselves (see "Reciprocity").
- **Declining and removing keep the row.** "Ignore" sets `decided_time` and leaves the row as `requested`,
  which is what lets the requester see no change and stops an immediate second request. Removing someone
  sets the row to `removed` rather than deleting it, so a re-add within 30 days does not notify them
  again and add/remove cannot be looped into a stream of messages. Only blocking deletes the row.
- **Adding needs a reason.** An owner can add someone who asked, who was in the circle before, or with
  whom they have a conversation (either direction). A stranger cannot be added, and so cannot be notified.
- **Administrators read everything.** `getProfileViewer` marks an admin (`isAdminId`), and
  `redactProfileFor` hides nothing from one: fields set to `only_me`, answers, endorsements, and the same
  for a paused or banned member. Moderators who are not admins get a member's view. The privacy policy says this in so many
  words; the "Only me" option itself is described as "Nobody else."
- **Notifications are in-app plus push** (web push and mobile), for a request and for an approval.
  They follow the recipient's global opt-outs; there is no separate preference for them, and no email.

Not covered:

- **The small avatar.** `users.avatar_url` is the same picture as `pinned_url`. It is blanked on the
  profile page and on search rows when `photos` is hidden from the reader, but it still appears where
  avatars come from the `users` row: conversations, comments, notifications, `get_display_users`.
  Members-only profiles have always behaved this way.
- **The three "may this viewer read this profile" rules are not folded into one** (who besides the
  owner sees a disabled profile still differs between the profile endpoint, the content endpoints and
  the page).
- **Emails** do not quote hideable fields today, so nothing was changed there.

## Decisions

1. **Field granularity.** A choice and its "Details" text share one key. `photos` covers the profile's
   photos (see "Not covered" for the avatar). `answers` and `endorsements` are one key each; their pickers sit in the
   form's "Who can see this" section, since neither is written in the form.
2. **`connected`.** Manual approval by the owner. A member may request access only once the owner has
   written to them in a conversation between just the two of them (`hasWrittenTo`): no requests to
   strangers, and neither a group conversation nor the requester writing first opens it. Until then
   the profile still says that more is shared with approved people, and that they can ask once a
   conversation is going. A declined request can be repeated after 30 days
   (`REQUEST_AGAIN_AFTER_DAYS`).
3. **Hidden photos.** Nothing is shown: the default avatar, no placeholder.
4. **Minimum shown to members.** None. Any field can be hidden; a profile whose bio and headline are
   both hidden from members drops out of the default search like any profile without them.
5. **Reciprocity.** None: hiding a field does not limit what you can filter on.
6. **Defaults for new members.** Every field starts `public`, with the profile-wide choice first in
   the form.
7. **Scope.** All three phases were built.
8. **Profile-wide setting.** Kept in the database as the default for fields without their own choice
   (including fields added later), not as a ceiling: a field may be wider than it.
9. **Feed.** No setting of its own. Whatever is public is syndicated, except photos.
