import {debug} from 'common/logger'
import {tryCatch} from 'common/util/try-catch'
import {PrivateUser} from 'common/user'
import {getDefaultNotificationPreferences} from 'common/user-notification-preferences'
import {randomString} from 'common/util/random'
import {createHash} from 'crypto'
import {existsSync} from 'fs'
import {join} from 'path'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'
import {insert} from 'shared/supabase/utils'
import {getUser} from 'shared/utils'

import {
  SHOWCASE_PROFILES,
  SHOWCASE_VIEWER,
  SHOWCASE_VIEWER_PASSWORD,
  ShowcaseProfile,
} from './showcase-profiles'

/**
 * Seeds the hand-authored showcase personas (see `showcase-profiles.ts`).
 *
 * Separate from `seedDbUser()` because the goals differ: that path randomises everything so e2e tests get
 * varied input, this one keeps every field exactly as written so marketing captures are reproducible.
 *
 * Deliberately does NOT create Firebase auth accounts. `seedUser()` does, because e2e tests sign in as
 * those users; nobody ever signs in as a showcase persona — they exist to be looked at. Skipping Firebase
 * means this runs against the remote dev DB without the emulator (SPEC_CONFIG hardcodes localhost:9099,
 * so with no emulator every sign-up fails with ECONNREFUSED).
 *
 * The one exception is the viewer account (`seedShowcaseViewer` below), which captures sign in as.
 *
 * Idempotent — ids are derived from the slug, and re-running skips personas that already exist.
 */

/**
 * Deterministic stand-in for a Firebase uid: 28 chars, same shape as the real thing, stable across runs
 * so re-seeding updates nothing and capture scripts can rely on the id.
 */
function showcaseUserId(slug: string) {
  return 'showcase' + createHash('sha256').update(slug).digest('hex').slice(0, 20)
}

/**
 * Firebase Auth emulator admin base. Hardcoded to match `tests/e2e/web/SPEC_CONFIG.ts`, which pins the
 * emulator to this host and project — there is no config to read it from.
 */
const EMULATOR_PROJECT_URL =
  'http://localhost:9099/identitytoolkit.googleapis.com/v1/projects/compass-57c3c'

/** Portraits live in the web app's public dir so dev captures can load them same-origin. */
const PHOTO_PUBLIC_DIR = join(__dirname, '../../../web/public/images/showcase')
const PHOTO_URL_PREFIX = '/images/showcase'
const DEFAULT_AVATAR = '/images/default-avatar.png'

/**
 * Resolves `<slug>-1.jpg` … `<slug>-N.jpg`, keeping only files that actually exist.
 * Missing portraits are not fatal: the profile still seeds, it just wears the default avatar.
 *
 * `pinned_url` and `photo_urls` are disjoint: the pinned photo must NOT also appear in `photo_urls`.
 * `ProfileCarousel` renders `buildArray(pinned_url, photo_urls)` without deduping, so a shared entry
 * shows up twice. (The photo editor wraps the same call in `uniq`, which masks it while editing.)
 */
function resolvePhotos(profile: ShowcaseProfile) {
  const urls: string[] = []
  for (let i = 1; i <= profile.photoCount; i++) {
    const file = `${profile.slug}-${i}.jpg`
    if (existsSync(join(PHOTO_PUBLIC_DIR, file))) urls.push(`${PHOTO_URL_PREFIX}/${file}`)
  }
  if (urls.length === 0) {
    console.warn(
      `[showcase] no portraits found for ${profile.slug} in web/public/images/showcase — ` +
        `falling back to the default avatar. See docs/marketing-visuals.md (W0b).`,
    )
    return {photo_urls: [], pinned_url: DEFAULT_AVATAR}
  }
  return {pinned_url: urls[0], photo_urls: urls.slice(1)}
}

/** Bios are stored as a tiptap doc; one paragraph node per entry. */
function toBioDoc(paragraphs: string[]) {
  return {
    type: 'doc',
    content: paragraphs.map((text) => ({
      type: 'paragraph',
      content: [{type: 'text', text}],
    })),
  }
}

/**
 * `interests` / `causes` / `work` are user-extensible lookup tables keyed by a unique name.
 * Upsert by name and hand back the id, so re-seeding never duplicates an option.
 */
async function upsertOptionIds(
  tx: SupabaseDirectClient,
  table: 'interests' | 'causes' | 'work',
  names: string[],
) {
  const ids: number[] = []
  for (const name of names) {
    const row = await tx.one<{id: number}>(
      `insert into ${table} (name) values ($1)
       on conflict (name) do update set name = excluded.name
       returning id`,
      [name],
    )
    ids.push(row.id)
  }
  return ids
}

async function linkOptions(
  tx: SupabaseDirectClient,
  table: 'profile_interests' | 'profile_causes' | 'profile_work',
  profileId: number,
  optionIds: number[],
) {
  for (const optionId of optionIds) {
    await insert(tx, table, {profile_id: profileId, option_id: optionId})
  }
}

async function seedShowcaseProfile(profile: ShowcaseProfile, userId: string) {
  const pg = createSupabaseDirectClient()
  const {photo_urls, pinned_url} = resolvePhotos(profile)
  const bio = toBioDoc(profile.bio)
  const bioText = profile.bio.join('\n\n')

  const privateUser: PrivateUser = {
    id: userId,
    email: profile.email,
    initialIpAddress: '127.0.0.1',
    initialDeviceToken: randomString(),
    notificationPreferences: getDefaultNotificationPreferences(),
    blockedUserIds: [],
    blockedByUserIds: [],
  }

  return pg.tx(async (tx: any) => {
    if (await getUser(userId, tx)) return false

    await insert(tx, 'users', {
      id: userId,
      name: profile.name,
      username: profile.slug,
      data: {},
    })

    await insert(tx, 'private_users', {id: userId, data: privateUser})

    const inserted = await insert(tx, 'profiles', {
      user_id: userId,
      age: profile.age,
      gender: profile.gender,
      orientation: profile.orientation,
      headline: profile.headline,
      bio,
      bio_length: bioText.length,
      keywords: profile.keywords,
      city: profile.city,
      region_code: profile.region_code,
      country: profile.country,
      city_latitude: profile.city_latitude,
      city_longitude: profile.city_longitude,
      born_in_location: profile.born_in_location,
      occupation_title: profile.occupation_title,
      company: profile.company,
      university: profile.university,
      education_level: profile.education_level,
      languages: profile.languages,
      ethnicity: profile.ethnicity,
      height_in_inches: profile.height_in_inches,
      religion: profile.religion,
      political_beliefs: profile.political_beliefs,
      diet: profile.diet,
      mbti: profile.mbti,
      big5_openness: profile.big5.openness,
      big5_conscientiousness: profile.big5.conscientiousness,
      big5_extraversion: profile.big5.extraversion,
      big5_agreeableness: profile.big5.agreeableness,
      big5_neuroticism: profile.big5.neuroticism,
      relationship_status: profile.relationship_status,
      pref_relation_styles: profile.pref_relation_styles,
      pref_romantic_styles: profile.pref_romantic_styles,
      pref_gender: profile.pref_gender,
      pref_age_min: profile.pref_age_min,
      pref_age_max: profile.pref_age_max,
      has_kids: profile.has_kids,
      wants_kids_strength: profile.wants_kids_strength,
      is_smoker: profile.is_smoker,
      drinks_per_month: profile.drinks_per_month,
      photo_urls,
      pinned_url,
      links: profile.links,
      // Public so captures can run against a logged-out browser.
      visibility: 'public',
    })

    const profileId = inserted.id
    await linkOptions(
      tx,
      'profile_interests',
      profileId,
      await upsertOptionIds(tx, 'interests', profile.interests),
    )
    await linkOptions(
      tx,
      'profile_causes',
      profileId,
      await upsertOptionIds(tx, 'causes', profile.causes),
    )
    await linkOptions(
      tx,
      'profile_work',
      profileId,
      await upsertOptionIds(tx, 'work', profile.work),
    )

    return true
  })
}

/** Seeds every showcase persona. Returns how many were newly created. */
export async function seedShowcaseUsers() {
  let created = 0
  for (const profile of SHOWCASE_PROFILES) {
    if (await seedShowcaseProfile(profile, showcaseUserId(profile.slug))) {
      created++
      debug('Showcase profile created:', profile.slug)
    }
  }
  console.log(`[showcase] ${created}/${SHOWCASE_PROFILES.length} personas created`)

  await seedShowcaseViewer()
  return created
}

/**
 * Seeds the one account captures sign in as.
 *
 * Created through the Auth emulator's admin endpoint rather than the public sign-up API, because that
 * is the only way to choose the uid. That matters more than it sounds:
 *
 *  - The emulator's auth store is in-memory and does not survive a restart, while Postgres does. With a
 *    server-assigned uid, a restart left the DB row orphaned under an id no Firebase account had, and
 *    the next seed tried to insert a second row with the same username — a unique-constraint failure.
 *    A uid derived from the slug is stable across restarts, so re-seeding always converges.
 *  - The same call sets emailVerified, so messaging is unlocked without the separate oobCode dance.
 *    Messaging is gated on a verified email, and without it the capture's payoff shot would be the
 *    "You must verify your email" error state.
 *
 * A stale row under a different id is deleted first; `users` cascades to `profiles` and `private_users`,
 * and the viewer is disposable infrastructure, so replacing it wholesale is safe.
 *
 * Non-fatal if the emulator is down — the personas still seed and are still viewable logged-out; only
 * the signed-in captures (search, filters, grid) would be blocked.
 */
export async function seedShowcaseViewer() {
  const uid = showcaseUserId(SHOWCASE_VIEWER.slug)

  const {error} = await tryCatch(
    createEmulatorUser(uid, SHOWCASE_VIEWER.email, SHOWCASE_VIEWER_PASSWORD),
  )
  if (error) {
    console.warn(
      `[showcase] could not create the viewer account ${SHOWCASE_VIEWER.email} (${error.message}). ` +
        `Is the Firebase emulator running on localhost:9099 ('yarn dev:isolated')? Personas are ` +
        `seeded; signed-in captures will not work until this succeeds.`,
    )
    return false
  }

  // Rebuild the row from scratch every run. It clears anything left under a server-assigned uid from
  // before this was deterministic (which would otherwise trip the username unique index), and it means
  // edits to the SHOWCASE_VIEWER persona actually take effect on re-seed instead of being skipped as
  // "already exists". Safe because the viewer is disposable infrastructure, and `users` cascades.
  const pg = createSupabaseDirectClient()
  await pg.none(`delete from users where username = $1`, [SHOWCASE_VIEWER.slug])

  const created = await seedShowcaseProfile(SHOWCASE_VIEWER, uid)
  console.log(`[showcase] viewer account ready: ${SHOWCASE_VIEWER.email} (${uid})`)
  return created
}

/**
 * Creates (or leaves in place) a Firebase Auth emulator account with an exact uid.
 *
 * The emulator accepts `Bearer owner` for admin endpoints. EMAIL_EXISTS means a previous run already
 * created it with this same deterministic uid, which is success, not failure.
 */
async function createEmulatorUser(uid: string, email: string, password: string) {
  const res = await fetch(`${EMULATOR_PROJECT_URL}/accounts`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: 'Bearer owner'},
    body: JSON.stringify({localId: uid, email, password, emailVerified: true}),
  })
  if (res.ok) return
  const body = await res.text()
  if (body.includes('EMAIL_EXISTS') || body.includes('DUPLICATE_LOCAL_ID')) return
  throw new Error(`${res.status}: ${body.slice(0, 200)}`)
}
