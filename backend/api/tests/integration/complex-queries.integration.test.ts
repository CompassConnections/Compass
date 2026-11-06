import {getCompatibleProfiles} from 'api/compatible-profiles'
import {getEvents} from 'api/get-events'
import {getMemberValueRanking} from 'api/get-member-value-ranking'
import {getOutreachQueue} from 'api/get-outreach-queue'
import {getOutreachStats} from 'api/get-outreach-stats'
import {loadProfiles} from 'api/get-profiles'
import {getReferralLeaderboardHandler} from 'api/get-referral-leaderboard'
import {getSpotlights} from 'api/get-spotlights'
import {AuthedUser} from 'api/helpers/endpoint'
import {searchUsers} from 'api/search-users'
import {stats} from 'api/stats'
import {ENV_CONFIG} from 'common/envs/constants'

import {getTestDb, resetDb, seedUser} from './helpers/db'

const VIEWER = 'viewer'
const MATCH = 'match'
const as = (uid: string) => ({uid}) as AuthedUser

// Queries assembled at runtime, which the schema scan cannot see. Running them is the only check they get.
describe('queries built at runtime', () => {
  beforeEach(async () => {
    await resetDb()
    await seedUser(VIEWER, {profile: {gender: 'male', age: 30, pref_gender: ['female']}})
    await seedUser(MATCH, {
      profile: {
        gender: 'female',
        age: 31,
        pref_gender: ['male'],
        pref_age_min: 25,
        pref_age_max: 40,
        headline: 'Loves hiking',
        country: 'France',
        city: 'Paris',
      },
    })
  })

  const search = (props: Record<string, unknown>) =>
    loadProfiles({limit: 20, shortBio: true, userId: VIEWER, skipId: VIEWER, ...props} as any)

  describe('profile search', () => {
    it.each(['last_online_time', 'created_time', 'compatibility_score'])(
      'orders by %s',
      async (orderBy) => {
        const {profiles} = await search({orderBy})
        expect(profiles.map((p) => p.user_id)).toEqual([MATCH])
      },
    )

    it('finds by keyword', async () => {
      expect((await search({name: 'hiking'})).count).toBe(1)
      expect((await search({name: 'sailing'})).count).toBe(0)
    })

    it('filters by a matching and a non-matching value', async () => {
      expect((await search({genders: ['female']})).count).toBe(1)
      expect((await search({genders: ['male']})).count).toBe(0)
      expect((await search({pref_age_min: 30, pref_age_max: 35})).count).toBe(1)
      expect((await search({pref_age_min: 50})).count).toBe(0)
      expect((await search({country: 'France'})).count).toBe(1)
      expect((await search({country: 'Spain'})).count).toBe(0)
    })

    it('honours two-way search', async () => {
      expect((await search({twoWay: true})).count).toBe(1)
      await getTestDb().none(`update profiles set pref_gender = '{female}' where user_id = $1`, [
        MATCH,
      ])
      expect((await search({twoWay: true})).count).toBe(0)
    })

    it('runs with every filter set at once', async () => {
      await search({
        name: 'a,b',
        genders: ['female'],
        hasPhoto: true,
        education_levels: ['bachelors'],
        pref_gender: ['male'],
        pref_age_min: 18,
        pref_age_max: 99,
        drinks_min: 0,
        drinks_max: 10,
        big5_openness_min: 0,
        big5_openness_max: 100,
        big5_conscientiousness_min: 0,
        big5_conscientiousness_max: 100,
        big5_extraversion_min: 0,
        big5_extraversion_max: 100,
        big5_agreeableness_min: 0,
        big5_agreeableness_max: 100,
        big5_neuroticism_min: 0,
        big5_neuroticism_max: 100,
        pref_relation_styles: ['mono'],
        pref_romantic_styles: ['open'],
        diet: ['omnivore'],
        political_beliefs: ['liberal'],
        mbti: ['intj'],
        relationship_status: ['single'],
        languages: ['english'],
        religion: ['atheist'],
        orientation: ['straight'],
        neurotype: ['neurotypical'],
        wants_kids_range_min: 0,
        wants_kids_range_max: 4,
        twoWay: true,
        compatibility_min: 0,
        has_kids: 0,
        interests: ['1'],
        causes: ['1'],
        work: ['1'],
        is_smoker: false,
        exercise: ['weekly'],
        psychedelics: ['never'],
        cannabis: ['never'],
        psychedelics_intention: ['medical'],
        cannabis_intention: ['medical'],
        psychedelics_pref: ['never'],
        cannabis_pref: ['never'],
        geodbCityIds: ['1'],
        lat: 48.8,
        lon: 2.3,
        radius: 50,
        country: 'France',
        raised_in_lat: 48.8,
        raised_in_lon: 2.3,
        raised_in_radius: 50,
        lastModificationWithin: '7 days',
        last_active: 'week',
        compatibleWithUserId: VIEWER,
        orderBy: 'compatibility_score',
      })
    })

    it('pages with `after`', async () => {
      const {id} = await getTestDb().one(`select id from profiles where user_id = $1`, [MATCH])
      expect((await search({after: String(id), orderBy: 'created_time'})).profiles).toEqual([])
    })
  })

  it('search-users matches on name', async () => {
    const results: any = await searchUsers(
      {term: `Name ${MATCH}`, limit: 5} as any,
      as(VIEWER),
      {} as any,
    )
    expect(results.map((u: any) => u.id)).toEqual([MATCH])
  })

  it('compatible-profiles runs', async () => {
    const {compatibleProfiles} = (await getCompatibleProfiles(VIEWER)) as any
    expect(compatibleProfiles ?? []).toEqual(expect.any(Array))
  })

  it.each([
    ['get-events', getEvents, {}],
    ['get-spotlights', getSpotlights, {}],
    ['get-referral-leaderboard', getReferralLeaderboardHandler, {}],
    ['stats', stats, {}],
  ])('%s runs', async (_name, handler: any, props) => {
    await expect(handler(props, as(VIEWER), {} as any)).resolves.toBeDefined()
  })

  describe.each([
    ['get-outreach-queue', getOutreachQueue],
    ['get-outreach-stats', getOutreachStats],
    ['get-member-value-ranking', getMemberValueRanking],
  ])('%s', (_name, handler: any) => {
    it('is refused to a member', async () => {
      await expect(handler({}, as(VIEWER), {} as any)).rejects.toMatchObject({code: 403})
    })

    it('runs for an admin', async () => {
      const [adminId] = ENV_CONFIG.adminIds
      await seedUser(adminId)
      await expect(handler({}, as(adminId), {} as any)).resolves.toBeDefined()
    })
  })
})
