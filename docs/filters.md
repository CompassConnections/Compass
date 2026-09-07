- Seeking — the type of connection someone is looking for (friendship, relationship, collaboration, etc.).
- Living — where someone currently lives, with a selectable search radius (10-2000 mi, the same ladder
  `profiles.pref_max_distance` offers), plus a country dropdown (the countries members actually live
  in, from `get-countries`) for searches no circle round a single city can express.
- Age — age range.
- Gender — gender identity (multi-select with extended list hidden behind "Show more").
- Orientation — sexual orientation (multi-select with extended list hidden behind "Show more").
- Status — current relationship status (e.g., single, in a relationship).
- Style — preferred romantic relationship structure (e.g., monogamous, polyamorous).
- Has Kids — whether someone currently has children.
- Wants Kids — how strongly someone wants children in the future, as an interval over the five answers
  the profile records (`wants_kids_range_min` / `wants_kids_range_max`).
- Grew Up — the location where someone was raised, with a selectable radius.
- Education — highest level of education completed.
- Work — based on professional field or occupation keywords.
- Interests — hobbies or topics someone is interested in.
- Causes — social, environmental, or ethical causes someone cares about.
- Diet — dietary lifestyle (e.g., vegan, vegetarian, omnivore).
- Drinks — typical alcohol consumption frequency.
- Smoker — smoking status.
- Languages — by languages spoken.
- Politics — political beliefs or ideological alignment.
- Religion — religious belief or affiliation.
- Neurotype — neurodivergence identity (multi-select with extended list hidden behind "Show more").
- MBTI — Myers–Briggs personality type.
- Big Five — ranges of the Big Five personality traits.
- Last Active — how recently they were active on the platform.

Two toggles sit above the list, both of which write a whole search rather than one field:

- **Who I'm looking for** — copies the "Who I'm looking for" section of your own profile into the
  search: gender, age range, connection type, a band of kid-desire answers within 2 of your own (see
  `getWantsKidsRange`), and — when you set a maximum distance — your own city at that radius (see
  `getLookingForLocation`). It also sets the language you are reading the app in, which is the one
  entry not read off the profile. Replaces the current search rather than merging into it. The
  location is its own state rather than a filter field, so anything applying these has to set it
  alongside them or the "Living" section's effect clears `lat`/`lon`/`radius` straight back out.
- **Two-way search** (`twoWay`) — makes the search mutual. On top of everything you asked for, a
  profile also has to accept _you_: their preferred gender has to include yours, your age has to fall
  in their range, your connection types have to overlap theirs, you have to sit inside the maximum
  distance they stated on their profile (`profiles.pref_max_distance`), and their kid desire has to be
  within 2 of yours. Anything a profile left unstated passes — silence is not a rejection — and each
  check is skipped entirely when your own profile has nothing to compare with. Implemented as extra
  WHERE clauses in `backend/api/src/get-profiles.ts` (`twoWayWhereClauses`), which costs one extra
  query to read your own profile and only when the toggle is on.
