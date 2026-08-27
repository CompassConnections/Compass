import {JSONContent} from '@tiptap/core'
import {textToJSONContent} from 'common/util/parse'

/**
 * setupsheet.love serves a Vite single-page app: a plain fetch of `/record/<id>` returns an empty
 * `<div id="root">` and nothing else, so the importer used to reject it as a JavaScript-built page.
 * The page fills itself in from `GET /api/records/<id>` on the site's own origin — no key, no
 * session, exactly what the visitor's browser requests — so we ask for that instead and rebuild the
 * document a visitor would have read. See `fetchSetupSheetRecord` in
 * backend/api/src/llm-extract-profile.ts for the fetching side.
 */
export function extractSetupSheetRecordId(url: string): string | null {
  let hostname: string
  let pathname: string
  try {
    const parsed = new URL(url)
    hostname = parsed.hostname.toLowerCase()
    pathname = parsed.pathname
  } catch {
    return null
  }

  if (hostname !== 'setupsheet.love' && hostname !== 'www.setupsheet.love') return null

  // `/present/record/<id>` is the same sheet in the site's presentation view, built from the same
  // record, so a link to either one imports the same thing.
  const match = pathname.match(/^\/(?:present\/)?record\/([^/]+)\/?$/)
  if (!match) return null

  const recordId = decodeURIComponent(match[1]).trim()
  // Airtable record ids. Anything else is a route we do not know how to read, and saying so beats
  // asking the API about it.
  return /^rec[A-Za-z0-9]{10,20}$/.test(recordId) ? recordId : null
}

/** One Airtable attachment, as `/api/records/<id>` returns it. */
type SetupSheetPhoto = {
  url?: string
  thumbnails?: {
    full?: {url?: string}
    large?: {url?: string}
  }
}

/**
 * The fields the Setup Sheet page renders, and only those.
 *
 * `/api/records/<id>` answers with the whole Airtable row, which holds a great deal the page never
 * shows: email address, phone number, postal address, the matchmaker who created the row, the record
 * ids of other members put forward as possible matches, and internal client-status fields. None of
 * it is displayed to a visitor and none of it belongs in an imported bio, so none of it is read
 * here. Do not widen this type without a reason that survives that trade.
 *
 * Every field is optional — a sheet fills in as much or as little as its owner wanted.
 */
export type SetupSheetRecord = {
  firstName?: string | null
  photo?: SetupSheetPhoto[] | null

  // Overview, shown beside the photo.
  gender?: string | null
  seekingGenders?: string[] | null
  relationshipContainerDesired?: string[] | null
  locationTiesPreferences?: string | null
  differentCities?: string | null
  willingToTravel?: string | null
  selfdescription?: string | null
  faithAffiliation?: string[] | null
  sharedFaithPreferences?: string | null
  personalityAttraction?: string | null
  seekingCareer?: string[] | null
  seekingCareerStage?: string[] | null

  // Partnership Vision
  familyBuilding?: string[] | null
  familyTimeline?: string[] | null
  currentChildrenWhatsImportant?: string | null
  futureChildrenSamePage?: string | null
  familyInfluence?: string | null
  currentPets?: string | null
  entrepreneurialStatus?: string | null
  personalGoals?: string | null
  homeDynamics?: string[] | null
  sharedValues?: string | null
  marriageStance?: string[] | null
  valuesPolitics?: string | null
  supportSources?: string[] | null
  conflictResolution?: string[] | null
  energetic?: string | null
  communityAffiliations?: string | null
  visionLifestyleSharedExperiences?: string | null

  // Personal Values + Lifestyle
  physicalActivity?: string | null
  alcohol?: string | null
  smokingCigarettescigars?: string | null
  marijuana?: string | null
  psychedelics?: string | null
  spendsTime?: string | null

  // Deal Breakers, then Final Notes
  dealBreakers?: string | null
  age?: number | string | null
  height?: string | null
  education?: string | null
  visionProvideForPartnerHowDoYouLoveShowingYourLove?: string | null
  visionPartnerFeelsInRelationshipWithYou?: string | null
}

/** A field and the label the page prints above it, or `null` where the section title says it. */
type Field = [keyof SetupSheetRecord, string | null]
type Section = {title: string; fields: Field[]}

/**
 * The page's own sections, in its own order, under its own labels — the labels carry a lot of the
 * meaning here ("Stage of life", "How we thrive..."), and the LLM reads them the same way a person
 * would.
 *
 * `locationTiesPreferences` is the one field the page prints twice, in the overview and again under
 * Environments. It appears once here: a duplicated paragraph tells the extraction nothing new.
 */
const SETUP_SHEET_SECTIONS: Section[] = [
  {
    title: 'Seeking',
    fields: [
      ['gender', 'Gender'],
      ['seekingGenders', 'Gender(s) seeking'],
      ['relationshipContainerDesired', 'Relationship container(s) open to'],
      ['locationTiesPreferences', 'Location tie(s) / preferences'],
      ['differentCities', 'Open to matches in different cities?'],
      ['willingToTravel', 'Willing to travel'],
      ['selfdescription', 'Snapshot description'],
      ['faithAffiliation', 'Faith affiliation'],
      ['sharedFaithPreferences', 'Shared faith preferences'],
      ['personalityAttraction', 'Personality attraction'],
      ['seekingCareer', 'Career preference'],
      ['seekingCareerStage', 'Stage preference'],
    ],
  },
  {
    title: 'Family',
    fields: [
      ['familyBuilding', 'Family building'],
      ['familyTimeline', 'Family timeline'],
      ['currentChildrenWhatsImportant', 'Ideal involvement with current child(ren)'],
      ['futureChildrenSamePage', 'Future child(ren) preferences'],
      ['familyInfluence', 'Extended family influence'],
      ['currentPets', 'Pets, or preferences'],
    ],
  },
  {
    title: 'Ambition',
    fields: [
      ['entrepreneurialStatus', 'Stage of life'],
      ['personalGoals', 'Personal goals'],
      ['homeDynamics', 'Home dynamics'],
    ],
  },
  {
    title: 'Team Stances',
    fields: [
      ['sharedValues', 'Shared values'],
      ['marriageStance', 'Marriage stance'],
      ['valuesPolitics', 'Important political stances to share'],
      ['supportSources', 'Support sources'],
      ['conflictResolution', 'Conflict resolution'],
    ],
  },
  {
    title: 'Environments',
    fields: [
      ['energetic', 'Energetic'],
      ['communityAffiliations', 'Community affiliations'],
      ['visionLifestyleSharedExperiences', 'How we thrive...'],
    ],
  },
  {
    title: 'Personal Values + Lifestyle',
    fields: [
      ['physicalActivity', 'Physical activity'],
      ['alcohol', 'Alcohol'],
      ['smokingCigarettescigars', 'Smoking (cigarettes/cigars)'],
      ['marijuana', 'Cannabis'],
      ['psychedelics', 'Psychedelics'],
      ['spendsTime', 'Spends time...'],
    ],
  },
  {title: 'Deal Breakers', fields: [['dealBreakers', null]]},
  {
    title: 'Final Notes',
    fields: [
      ['age', 'Age'],
      ['height', 'Height'],
      ['education', 'Education'],
      [
        'visionProvideForPartnerHowDoYouLoveShowingYourLove',
        'How do you like to provide for your partner? How do you love showing your love?',
      ],
      [
        'visionPartnerFeelsInRelationshipWithYou',
        'How they want their partner to feel in relationship with them',
      ],
    ],
  },
]

/** The page joins a multi-select with the same separator it uses for its pill lists. */
function formatValue(value: SetupSheetRecord[keyof SetupSheetRecord]): string {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && !!item.trim())
      .join(' · ')
  }
  if (typeof value === 'number') return String(value)
  return typeof value === 'string' ? value.trim() : ''
}

function heading(level: number, text: string): JSONContent {
  return {type: 'heading', attrs: {level}, content: [{type: 'text', text}]}
}

function prose(text: string): JSONContent[] {
  return textToJSONContent(text).content ?? []
}

/**
 * A `**Label:** value` paragraph for a one-liner, or a bold label followed by the answer's own
 * paragraphs when it is prose — several of these answers run to a dozen lines with their own
 * bullets, and folding those into a single paragraph loses their shape.
 */
function labelled(label: string | null, value: string): JSONContent[] {
  if (!label) return prose(value)

  // Several labels are questions or trail off ("Willing to travel?", "Spends time..."), and a colon
  // bolted onto those reads as a typo.
  const separator = /[?.!…]$/.test(label) ? ' ' : ': '

  if (!value.includes('\n')) {
    return [
      {
        type: 'paragraph',
        content: [
          {type: 'text', text: `${label}${separator}`, marks: [{type: 'bold'}]},
          {type: 'text', text: value},
        ],
      },
    ]
  }
  return [
    {type: 'paragraph', content: [{type: 'text', text: label, marks: [{type: 'bold'}]}]},
    ...prose(value),
  ]
}

/**
 * The page shows one photo, picking the largest rendition Airtable prepared. Those URLs carry an
 * expiry stamp and stop working within days, which is exactly what `rehostExternalImages` is for —
 * by the time the bio is stored, this src points at our own bucket.
 */
function photoSrc(photo: SetupSheetPhoto | undefined): string | undefined {
  return photo?.thumbnails?.full?.url || photo?.thumbnails?.large?.url || photo?.url || undefined
}

/** Rebuilds the sheet a visitor to the page would have read, section by section. */
export function setupSheetRecordToJSONContent(record: SetupSheetRecord): JSONContent {
  const content: JSONContent[] = []

  if (record.firstName?.trim()) content.push(heading(1, record.firstName.trim()))

  const src = photoSrc(record.photo?.[0] ?? undefined)
  if (src) content.push({type: 'image', attrs: {src}})

  for (const section of SETUP_SHEET_SECTIONS) {
    const body = section.fields.flatMap(([field, label]) => {
      const value = formatValue(record[field])
      return value ? labelled(label, value) : []
    })
    // Every section is optional, and the page hides the ones with nothing in them.
    if (body.length) content.push(heading(2, section.title), ...body)
  }

  return {type: 'doc', content}
}
