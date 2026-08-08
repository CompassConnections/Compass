import * as profilesModule from 'api/get-profiles'
import {Profile} from 'common/profiles/profile'
import * as supabaseInit from 'shared/supabase/init'
import * as sqlBuilder from 'shared/supabase/sql-builder'

describe('getProfiles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(profilesModule, 'getProfileCols').mockResolvedValue(null)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    it('should successfully return profile information and count', async () => {
      const mockProfiles = [
        {
          diet: ['Jonathon Hammon'],
          has_kids: 0,
        },
        {
          diet: ['Joseph Hammon'],
          has_kids: 1,
        },
        {
          diet: ['Jolene Hammon'],
          has_kids: 2,
        },
      ] as Profile[]
      const props = {
        limit: 2,
        orderBy: 'last_online_time' as const,
        projection: 'full' as const,
      }
      const mockReq = {} as any

      jest
        .spyOn(profilesModule, 'loadProfiles')
        .mockResolvedValue({profiles: mockProfiles, count: 3})

      const results: any = await profilesModule.getProfiles(props, mockReq, mockReq)

      expect(results.status).toEqual('success')
      expect(results.profiles).toEqual(mockProfiles)
      expect(results.profiles[0]).toEqual(mockProfiles[0])
      expect(profilesModule.loadProfiles).toHaveBeenCalledWith(props)
      expect(profilesModule.loadProfiles).toHaveBeenCalledTimes(1)
    })
  })

  describe('when an error occurs', () => {
    it('should not return profile information', async () => {
      jest.spyOn(profilesModule, 'loadProfiles').mockRejectedValue(null)

      const props = {
        limit: 2,
        orderBy: 'last_online_time' as const,
        projection: 'full' as const,
      }
      const mockReq = {} as any
      const results: any = await profilesModule.getProfiles(props, mockReq, mockReq)

      expect(results.status).toEqual('fail')
      expect(results.profiles).toEqual([])
      expect(profilesModule.loadProfiles).toHaveBeenCalledWith(props)
      expect(profilesModule.loadProfiles).toHaveBeenCalledTimes(1)
    })
  })
})

describe('loadProfiles', () => {
  let mockPg: any
  beforeEach(() => {
    jest.clearAllMocks()
    mockPg = {
      map: jest.fn().mockResolvedValue([]),
      one: jest.fn().mockResolvedValue(0),
    }

    jest.spyOn(supabaseInit, 'createSupabaseDirectClient').mockReturnValue(mockPg)
    jest.spyOn(profilesModule, 'getProfileCols').mockResolvedValue(null)
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given valid input', () => {
    describe('should call pg.map with an SQL query', () => {
      it('successfully', async () => {
        const mockProps = {
          limit: 10,
          name: 'John',
          is_smoker: true,
          projection: 'full' as const,
        }

        ;(mockPg.map as jest.Mock).mockResolvedValue([])
        ;(mockPg.one as jest.Mock).mockResolvedValue(1)
        jest.spyOn(sqlBuilder, 'renderSql')
        jest.spyOn(sqlBuilder, 'select')
        jest.spyOn(sqlBuilder, 'from')
        jest.spyOn(sqlBuilder, 'where')
        jest.spyOn(sqlBuilder, 'join')

        await profilesModule.loadProfiles(mockProps)

        const [query, _values, _cb] = mockPg.map.mock.calls[0]

        expect(mockPg.map.mock.calls).toHaveLength(1)
        expect(query).toContain('select')
        expect(query).toContain('from profiles')
        expect(query).toContain('where')
        expect(query).toContain('limit 10')
        expect(query).toContain(`John`)
        expect(query).toContain(`is_smoker`)
        expect(query).not.toContain(`pref_gender`)
        expect(query).not.toContain(`(age)`)
        expect(query).not.toContain(`drinks_per_month`)
        expect(query).not.toContain(`has_kids`)
        expect(sqlBuilder.renderSql).toBeCalledTimes(3)
        expect(sqlBuilder.select).toBeCalledTimes(3)
        expect(sqlBuilder.from).toBeCalledTimes(2)
        expect(sqlBuilder.where).toBeCalledTimes(7)
        expect(sqlBuilder.join).toBeCalledTimes(1)
      })

      it('that contains a gender filter', async () => {
        await profilesModule.loadProfiles({
          genders: ['Electrical_gender'],
        })

        const [query, _values, _cb] = mockPg.map.mock.calls[0]

        expect(mockPg.map.mock.calls).toHaveLength(1)
        expect(query).toContain(`gender`)
        expect(query).toContain(`Electrical_gender`)
      })

      it('that contains a education level filter', async () => {
        await profilesModule.loadProfiles({
          education_levels: ['High School'],
        })

        const [query, _values, _cb] = mockPg.map.mock.calls[0]

        expect(mockPg.map.mock.calls).toHaveLength(1)
        expect(query).toContain(`education_level`)
        expect(query).toContain(`High School`)
      })

      it('that contains a prefer gender filter', async () => {
        await profilesModule.loadProfiles({
          pref_gender: ['female'],
        })

        const [query, _values, _cb] = mockPg.map.mock.calls[0]
        console.log(query)

        expect(mockPg.map.mock.calls).toHaveLength(1)
        expect(query).toContain(`pref_gender`)
        expect(query).toContain(`female`)
      })

      it('that contains a minimum age filter', async () => {
        await profilesModule.loadProfiles({
          pref_age_min: 20,
        })

        const [query, _values, _cb] = mockPg.map.mock.calls[0]

        expect(mockPg.map.mock.calls).toHaveLength(1)
        expect(query).toContain(`age`)
        expect(query).toContain(`>= 20`)
      })

      it('that contains a maximum age filter', async () => {
        await profilesModule.loadProfiles({
          pref_age_max: 40,
        })

        const [query, _values, _cb] = mockPg.map.mock.calls[0]

        expect(mockPg.map.mock.calls).toHaveLength(1)
        expect(query).toContain(`age`)
        expect(query).toContain(`<= 40`)
      })

      it('that contains a minimum drinks per month filter', async () => {
        await profilesModule.loadProfiles({
          drinks_min: 4,
        })

        const [query, _values, _cb] = mockPg.map.mock.calls[0]

        expect(mockPg.map.mock.calls).toHaveLength(1)
        expect(query).toContain(`drinks_per_month`)
        expect(query).toContain('4')
      })

      it('that contains a maximum drinks per month filter', async () => {
        await profilesModule.loadProfiles({
          drinks_max: 20,
        })

        const [query, _values, _cb] = mockPg.map.mock.calls[0]

        expect(mockPg.map.mock.calls).toHaveLength(1)
        expect(query).toContain(`drinks_per_month`)
        expect(query).toContain('20')
      })

      it('that contains a relationship style filter', async () => {
        await profilesModule.loadProfiles({
          pref_relation_styles: ['Chill and relaxing'],
        })

        const [query, _values, _cb] = mockPg.map.mock.calls[0]

        expect(mockPg.map.mock.calls).toHaveLength(1)
        expect(query).toContain(`pref_relation_styles`)
        expect(query).toContain('Chill and relaxing')
      })

      it('that contains a romantic style filter', async () => {
        await profilesModule.loadProfiles({
          pref_romantic_styles: ['Sexy'],
        })

        const [query, _values, _cb] = mockPg.map.mock.calls[0]

        expect(mockPg.map.mock.calls).toHaveLength(1)
        expect(query).toContain(`pref_romantic_styles`)
        expect(query).toContain('Sexy')
      })

      it('that contains a diet filter', async () => {
        await profilesModule.loadProfiles({
          diet: ['Glutton'],
        })

        const [query, _values, _cb] = mockPg.map.mock.calls[0]

        expect(mockPg.map.mock.calls).toHaveLength(1)
        expect(query).toContain(`diet`)
        expect(query).toContain('Glutton')
      })

      it('that contains a political beliefs filter', async () => {
        await profilesModule.loadProfiles({
          political_beliefs: ['For the people'],
        })

        const [query, _values, _cb] = mockPg.map.mock.calls[0]

        expect(mockPg.map.mock.calls).toHaveLength(1)
        expect(query).toContain(`political_beliefs`)
        expect(query).toContain('For the people')
      })

      it('that contains a religion filter', async () => {
        await profilesModule.loadProfiles({
          religion: ['The blood god'],
        })

        const [query, _values, _cb] = mockPg.map.mock.calls[0]

        expect(mockPg.map.mock.calls).toHaveLength(1)
        expect(query).toContain(`religion`)
        expect(query).toContain('The blood god')
      })

      it('that contains a has kids filter', async () => {
        await profilesModule.loadProfiles({
          has_kids: 3,
        })

        const [query, _values, _cb] = mockPg.map.mock.calls[0]

        expect(mockPg.map.mock.calls).toHaveLength(1)
        expect(query).toContain(`has_kids`)
        expect(query).toContain('> 0')
      })

      it('should return profiles from the database', async () => {
        const mockProfiles = [
          {
            diet: ['Jonathon Hammon'],
            is_smoker: true,
            has_kids: 0,
          },
          {
            diet: ['Joseph Hammon'],
            is_smoker: false,
            has_kids: 1,
          },
          {
            diet: ['Jolene Hammon'],
            is_smoker: true,
            has_kids: 2,
          },
        ] as Profile[]
        const props = {} as any

        ;(mockPg.map as jest.Mock).mockResolvedValue(mockProfiles)
        ;(mockPg.one as jest.Mock).mockResolvedValue(1)

        const results = await profilesModule.loadProfiles(props)

        expect(results).toEqual({profiles: mockProfiles, count: 1})
      })
    })
  })

  describe('when an error occurs', () => {
    it('throw if there is no compatibility', async () => {
      const props = {
        orderBy: 'compatibility_score',
      }

      expect(profilesModule.loadProfiles(props)).rejects.toThrowError('Incompatible with user ID')
    })
  })

  describe('when using the card projection', () => {
    const bio = {
      type: 'doc',
      content: [{type: 'paragraph', content: [{type: 'text', text: 'Hello there'}]}],
    }

    it('selects only the columns the card renders', async () => {
      ;(mockPg.map as jest.Mock).mockResolvedValue([])
      ;(mockPg.one as jest.Mock).mockResolvedValue(0)

      await profilesModule.loadProfiles({projection: 'card'})

      const [query] = mockPg.map.mock.calls[0]

      expect(query).toContain('profiles.headline')
      expect(query).toContain('profiles.pinned_url')
      // Heavy fields the card never reads.
      expect(query).not.toContain('profiles.photo_urls')
      expect(query).not.toContain('profiles.image_descriptions')
      expect(query).not.toContain('profiles.links')
    })

    it('still filters out sparse profiles without that join', async () => {
      ;(mockPg.map as jest.Mock).mockResolvedValue([])
      ;(mockPg.one as jest.Mock).mockResolvedValue(0)

      await profilesModule.loadProfiles({projection: 'card'})

      const [query] = mockPg.map.mock.calls[0]

      // The sparse-profile filter must not depend on the output joins.
      expect(query).not.toContain('array_length(profile_work.work, 1)')
      expect(query).toContain('FROM profile_work')
      expect(query).toContain('bio_length >= 100')
    })

    it('keeps the work join for the full projection', async () => {
      ;(mockPg.map as jest.Mock).mockResolvedValue([])
      ;(mockPg.one as jest.Mock).mockResolvedValue(0)

      await profilesModule.loadProfiles({projection: 'full'})

      const [query] = mockPg.map.mock.calls[0]

      expect(query).toContain('AS work')
    })

    it('replaces the rich-text bio with a plain-text snippet', async () => {
      ;(mockPg.map as jest.Mock).mockResolvedValue([{bio} as any])
      ;(mockPg.one as jest.Mock).mockResolvedValue(1)

      const {profiles} = await profilesModule.loadProfiles({projection: 'card'})

      expect(profiles[0].bio_snippet).toEqual('Hello there')
      expect(profiles[0]).not.toHaveProperty('bio')
    })

    it('truncates a long bio', async () => {
      const longBio = {
        type: 'doc',
        content: [{type: 'paragraph', content: [{type: 'text', text: 'a'.repeat(1000)}]}],
      }
      ;(mockPg.map as jest.Mock).mockResolvedValue([{bio: longBio} as any])
      ;(mockPg.one as jest.Mock).mockResolvedValue(1)

      const {profiles} = await profilesModule.loadProfiles({projection: 'card'})

      expect(profiles[0].bio_snippet).toEqual(`${'a'.repeat(600)}…`)
    })

    describe('preamble stripping', () => {
      const para = (text: string, marks?: {type: string}[]) => ({
        type: 'paragraph',
        content: [{type: 'text', text, ...(marks ? {marks} : {})}],
      })
      const bold = [{type: 'bold'}]

      const snippetOf = async (content: any[]) => {
        ;(mockPg.map as jest.Mock).mockResolvedValue([{bio: {type: 'doc', content}} as any])
        ;(mockPg.one as jest.Mock).mockResolvedValue(1)
        const {profiles} = await profilesModule.loadProfiles({projection: 'card'})
        return profiles[0].bio_snippet
      }

      it('drops an opening editorial note about the document', async () => {
        const note =
          '(NOTE: This date-me doc was designed to be read on google docs with comments enabled. ' +
          'For a smoother experience, read the original here: https://docs.google.com/document/d/1Cuyr3)'

        expect(await snippetOf([para(note), para('I am a software engineer.')])).toEqual(
          'I am a software engineer.',
        )
      })

      it('drops an opening note even when it is not parenthesised', async () => {
        expect(
          await snippetOf([para('NOTE: read the original doc instead.'), para('Hi, I am Sam.')]),
        ).toEqual('Hi, I am Sam.')
      })

      it('drops a leading bracketed status line', async () => {
        expect(
          await snippetOf([para('[profile updated 2 Aug 2026]'), para('Hi, I am Raskia.')]),
        ).toEqual('Hi, I am Raskia.')
      })

      it('drops a leading bracketed aside written inline with the first paragraph', async () => {
        expect(await snippetOf([para('[profile updated 2 Aug 2026] Hi, I am Raskia.')])).toEqual(
          'Hi, I am Raskia.',
        )
      })

      it('drops a leading heading node', async () => {
        expect(
          await snippetOf([
            {type: 'heading', attrs: {level: 1}, content: [{type: 'text', text: 'Introduction'}]},
            para('I live in Melbourne.'),
          ]),
        ).toEqual('I live in Melbourne.')
      })

      it('drops a bold enumerated heading that is not a heading node', async () => {
        expect(
          await snippetOf([para('1. Introduction', bold), para('I live in Melbourne.')]),
        ).toEqual('I live in Melbourne.')
      })

      it('drops an "About me" or "Summary" label', async () => {
        expect(await snippetOf([para('About Me'), para('I am Otito.')])).toEqual('I am Otito.')
        expect(await snippetOf([para('summary:'), para('I am Otito.')])).toEqual('I am Otito.')
      })

      it('drops several stacked preliminaries', async () => {
        expect(
          await snippetOf([
            {type: 'heading', attrs: {level: 1}, content: [{type: 'text', text: 'My date-me doc'}]},
            para('[updated 2 Aug 2026]'),
            para('About me', bold),
            para('I am Otito.'),
          ]),
        ).toEqual('I am Otito.')
      })

      it('keeps prose that merely starts with a bold phrase or a bracketed word', async () => {
        expect(
          await snippetOf([
            {
              type: 'paragraph',
              content: [
                {type: 'text', text: 'Hi!', marks: bold},
                {type: 'text', text: " I'm a software engineer in Melbourne."},
              ],
            },
          ]),
        ).toEqual("Hi! I'm a software engineer in Melbourne.")
      })

      it('keeps a heading deeper in the bio', async () => {
        expect(
          await snippetOf([
            para('I am Otito.'),
            {type: 'heading', attrs: {level: 2}, content: [{type: 'text', text: 'My values'}]},
            para('Honesty.'),
          ]),
        ).toEqual('I am Otito. My values Honesty.')
      })

      it('drops preliminary lines separated by hard breaks inside one paragraph', async () => {
        // The real shape of a bio pasted out of a doc: no paragraph nodes, just hardBreak pairs.
        const br = {type: 'hardBreak'}

        expect(
          await snippetOf([
            {
              type: 'paragraph',
              content: [
                {type: 'text', text: '[profile updated '},
                {type: 'text', text: '2 Aug 2026', marks: bold},
                {type: 'text', text: ']'},
                br,
                br,
                {type: 'text', text: '1. Introduction', marks: bold},
                br,
                br,
                {type: 'text', text: 'Hello!'},
                br,
                br,
                {type: 'text', text: 'I am a 30 y/o engineer.'},
              ],
            },
          ]),
        ).toEqual('Hello! I am a 30 y/o engineer.')
      })

      it('falls back to the whole bio when it is nothing but a preliminary', async () => {
        expect(await snippetOf([para('About me')])).toEqual('About me')
      })
    })
  })

  describe('when ordering by compatibility score', () => {
    it('excludes profiles whose precomputed score was nulled out', async () => {
      ;(mockPg.map as jest.Mock).mockResolvedValue([])
      ;(mockPg.one as jest.Mock).mockResolvedValue(0)

      await profilesModule.loadProfiles({
        orderBy: 'compatibility_score',
        compatibleWithUserId: 'user-1',
      })

      const [query] = mockPg.map.mock.calls[0]

      expect(query).toContain('cs.score IS NOT NULL')
    })
  })
})
