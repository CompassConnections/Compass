import {parseJsonContentToText} from 'common/util/parse'
import {
  extractSetupSheetRecordId,
  SetupSheetRecord,
  setupSheetRecordToJSONContent,
} from 'shared/parse-setupsheet'

const RECORD_ID = 'recZgSWBkQPZn411r'
const URL_FOR = (path: string) => `https://setupsheet.love${path}`

describe('extractSetupSheetRecordId', () => {
  it('reads the record id off a sheet link', () => {
    expect(extractSetupSheetRecordId(URL_FOR(`/record/${RECORD_ID}`))).toBe(RECORD_ID)
  })

  it('accepts www, a trailing slash and the presentation view of the same sheet', () => {
    expect(extractSetupSheetRecordId(`https://www.setupsheet.love/record/${RECORD_ID}/`)).toBe(
      RECORD_ID,
    )
    expect(extractSetupSheetRecordId(URL_FOR(`/present/record/${RECORD_ID}`))).toBe(RECORD_ID)
  })

  it('ignores other hosts, other routes and anything that is not a record id', () => {
    expect(extractSetupSheetRecordId(`https://example.com/record/${RECORD_ID}`)).toBeNull()
    expect(extractSetupSheetRecordId(URL_FOR('/dashboard'))).toBeNull()
    expect(extractSetupSheetRecordId(URL_FOR(`/record/${RECORD_ID}/edit`))).toBeNull()
    expect(extractSetupSheetRecordId(URL_FOR('/record/not-a-record-id'))).toBeNull()
    expect(extractSetupSheetRecordId('not a url')).toBeNull()
  })
})

describe('setupSheetRecordToJSONContent', () => {
  const record: SetupSheetRecord = {
    firstName: 'Félix',
    photo: [
      {
        url: 'https://v5.airtableusercontent.com/full.jpg',
        thumbnails: {large: {url: 'https://v5.airtableusercontent.com/large.jpg'}},
      },
    ],
    gender: 'Male',
    seekingGenders: ['Female'],
    selfdescription: 'Critical thinker, pianist, freediver.',
    dealBreakers: 'Daily smoking is a hard no for me.\nMust be OK with living outside the US.',
    age: 35,
    height: '6\'2"',
  }

  it('rebuilds the sheet under the page’s own headings', () => {
    const text = parseJsonContentToText(setupSheetRecordToJSONContent(record))

    expect(text).toContain('Félix')
    expect(text).toContain('Seeking')
    expect(text).toContain('Gender: Male')
    expect(text).toContain('Gender(s) seeking: Female')
    expect(text).toContain('Deal Breakers')
    expect(text).toContain('Must be OK with living outside the US.')
    expect(text).toContain('Age: 35')
  })

  it('takes the photo Airtable prepared, preferring the largest rendition the page uses', () => {
    const images: string[] = []
    const walk = (node: any) => {
      if (node.type === 'image') images.push(node.attrs.src)
      ;(node.content ?? []).forEach(walk)
    }
    walk(setupSheetRecordToJSONContent(record))

    expect(images).toEqual(['https://v5.airtableusercontent.com/large.jpg'])
  })

  it('leaves out sections the sheet never filled in', () => {
    const text = parseJsonContentToText(setupSheetRecordToJSONContent(record))

    expect(text).not.toContain('Ambition')
    expect(text).not.toContain('Family')
  })

  // The API hands back the whole Airtable row. None of this is on the page, and none of it belongs
  // in somebody's bio — see SetupSheetRecord.
  it('never carries across contact details or the row’s internals', () => {
    const withPrivateFields = {
      ...record,
      email: 'felix@example.com',
      phoneNumber: '+1 4154242331',
      address: 'Felix\n320 Vista De Valle\nMill Valley, CA 94941',
      createdBy: {id: 'usr0m7Adjp7Zl0FPC', email: 'matchmaker@example.com'},
      possibleMatchesWithA: ['recgFEc9BaNbxrI5p'],
      cClientMemberStatus: 'Not pursuing',
    } as SetupSheetRecord

    const text = parseJsonContentToText(setupSheetRecordToJSONContent(withPrivateFields))

    expect(text).not.toContain('felix@example.com')
    expect(text).not.toContain('4154242331')
    expect(text).not.toContain('Mill Valley')
    expect(text).not.toContain('matchmaker@example.com')
    expect(text).not.toContain('recgFEc9BaNbxrI5p')
    expect(text).not.toContain('Not pursuing')
  })

  it('returns an empty document for a sheet with nothing on it', () => {
    expect(setupSheetRecordToJSONContent({})).toEqual({type: 'doc', content: []})
  })
})
