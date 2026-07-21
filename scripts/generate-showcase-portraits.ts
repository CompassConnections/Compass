/**
 * Generates the showcase-persona portraits with the Gemini image API.
 *
 * The personas in `tests/e2e/utils/showcase-profiles.ts` are fictional, so their photos have to be too:
 * no real person to consent, no license to track, nothing scraped. See `docs/marketing-visuals.md` (W0b).
 *
 * Identity consistency across a persona's photos comes from generating shot 1 from text, then passing that
 * image back as a reference for shots 2..N. Text alone drifts — same description, different face.
 *
 * Usage (needs GEMINI_API_KEY in the repo-root .env):
 *
 *   npx tsx scripts/generate-showcase-portraits.ts                # all missing portraits
 *   npx tsx scripts/generate-showcase-portraits.ts --only priyaraman
 *   npx tsx scripts/generate-showcase-portraits.ts --force        # regenerate existing
 *   npx tsx scripts/generate-showcase-portraits.ts --dry-run      # print prompts, call nothing
 */

import {execFileSync} from 'child_process'
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs'
import {join} from 'path'

import {
  SHOWCASE_PROFILES,
  SHOWCASE_VIEWER,
  ShowcaseProfile,
} from '../tests/e2e/utils/showcase-profiles'

/** The viewer account needs a face too — it shows up as the nav avatar in every signed-in capture. */
const ALL_PROFILES = [...SHOWCASE_PROFILES, SHOWCASE_VIEWER]

const REPO_ROOT = join(__dirname, '..')
const OUT_DIR = join(REPO_ROOT, 'web/public/images/showcase')
const MODEL = 'gemini-3-pro-image'
const API = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

/** Target size after re-compression. Raw API output is ~700 KB. */
const JPEG_QUALITY = 82

/**
 * Shared photographic direction. The negatives matter more than the positives here — without them the
 * model reliably produces glossy stock-photo faces, which is precisely the register this product is
 * positioned against.
 */
const STYLE =
  'Candid documentary-style photograph, natural available light, shot on a 50mm lens, shallow depth of ' +
  'field, realistic skin texture with visible pores and blemishes, unretouched. Not a stock photo, not a ' +
  'studio portrait, no artificial lighting, no perfect teeth, no posed corporate smile. Slightly imperfect ' +
  'framing, as if taken by a friend. ' +
  // The "candid / shot on film" register reliably drags in a white film border and an orange date stamp,
  // which look broken inside a profile card. Rule them out explicitly.
  'Full-bleed digital photograph filling the entire frame: no white border, no film frame, no Polaroid ' +
  'edge, no date stamp, no timestamp, no watermark, no text or lettering anywhere in the image.'

interface PortraitSpec {
  /** Stable physical description — repeated in every shot so the reference has something to lock onto. */
  appearance: string
  /** One scene per photo. Length must equal the persona's `photoCount`. */
  scenes: string[]
}

const PORTRAITS: Record<string, PortraitSpec> = {
  mayaokonkwo: {
    appearance:
      '31-year-old Nigerian-British woman, medium-dark skin, long box braids often tied back, ' +
      'tortoiseshell glasses pushed up on her head, warm and slightly amused expression',
    scenes: [
      'sitting in a cluttered university office in Edinburgh, whiteboard covered in diagrams behind her, holding a mug, looking off camera',
      'on a windy Scottish hillside in a waterproof jacket, mid-hike, hair pulled back, laughing at something out of frame',
      'in a small kitchen cooking, steam rising from a pot, sleeves pushed up, concentrating on the pan',
    ],
  },
  tomasleclerc: {
    appearance:
      '38-year-old French man, light skin, short dark hair going grey at the temples, close-cropped beard, ' +
      'lean build, forearms marked from manual work, quiet serious face',
    scenes: [
      'in a woodworking workshop surrounded by oak offcuts and hand tools, sawdust in the air, wearing a worn canvas apron',
      'planing a board at a workbench, hands in focus, face partly turned away',
      'outdoors stacking split firewood beside a stone house, autumn light, breath visible',
      'sitting on the workshop step drinking coffee, dog at his feet, looking tired and content',
    ],
  },
  priyaraman: {
    appearance:
      '26-year-old South Indian woman, brown skin, thick shoulder-length black hair usually loose, ' +
      'small nose stud, animated open expression',
    scenes: [
      'in front of a wall of climate model output on monitors, gesturing mid-explanation to someone off camera',
      'sitting cross-legged on a mat by a window in early morning light, eyes closed, meditating',
      'crouched in a small allotment garden in Bangalore, hands in the soil, grinning up at the camera',
    ],
  },
  davidhirsch: {
    appearance:
      '61-year-old white American man, full head of grey hair, wire-rimmed glasses, deep laugh lines, ' +
      'tall and slightly stooped, kind attentive face',
    scenes: [
      // The choir shot came out with singers crowding the foreground and his face half-hidden — fine as a
      // second photo, wrong for the avatar. The trail shot leads instead.
      'walking a wooded trail in Portland in a rain jacket, morning mist, pausing to look back at the camera',
      'conducting a community choir in a church hall, arms raised mid-beat, singers blurred in the foreground',
    ],
  },
  aminahaddad: {
    appearance:
      '34-year-old Lebanese woman, olive skin, dark hair in a practical low ponytail, strong runner’s build, ' +
      'direct confident gaze',
    scenes: [
      'on a construction site in a hard hat and hi-vis vest, holding rolled drawings, Beirut skyline behind her',
      'mid-run on a coastal road at dawn, sweat visible, focused expression',
      'sitting on a balcony in the evening with a book about Ottoman history, city lights behind',
    ],
  },
  joonpark: {
    appearance:
      '29-year-old Korean non-binary person, light skin, bleached-blond undercut, several ear piercings, ' +
      'oversized clothes, wry playful expression',
    scenes: [
      'at a messy desk in a Berlin game studio, three monitors of spreadsheets and game builds, mid-thought',
      'foraging in a damp beech forest, holding up a mushroom to the light, basket in the other hand',
      'hosting a dinner party, leaning over a crowded table serving food, guests blurred and laughing',
      'sitting on a windowsill in a Berlin flat at night, city outside, holding a controller',
    ],
  },
  sofiacosta: {
    appearance:
      // Sun-weathered outdoor cues ("tanned", "sun-bleached", "freckles") reliably age this one up a
      // decade, so the youth has to be asserted harder than for the other personas.
      'young woman of 24, clearly in her early twenties with a smooth youthful face and no lines, ' +
      'Brazilian, lightly tanned skin, sun-bleached curly brown hair, freckles across the nose, ' +
      'wiry athletic build, open enthusiastic student-aged face',
    scenes: [
      'on a research boat in a wetsuit, clipboard in hand, salt-wet hair, squinting into the sun',
      'underwater free diving above a seagrass meadow, no mask fogging, calm and weightless',
      'at a climbing gym chalking her hands, mid-conversation, gear scattered around',
    ],
  },
  marcusadeyemi: {
    appearance:
      '45-year-old Black British man, dark skin, shaved head, greying stubble beard, heavy-framed glasses, ' +
      'broad build, calm watchful expression',
    scenes: [
      'in a dim film edit suite lit by monitors, timeline visible, headphones around his neck',
      'in a home kitchen in Toronto cooking for a crowd, large pot, several dishes underway, sleeves rolled',
    ],
  },
  ellenostrom: {
    appearance:
      '52-year-old Swedish woman, weathered fair skin, short greying blonde hair, no makeup, ' +
      'strong outdoor build, dry amused expression',
    scenes: [
      'in nurse scrubs in a small rural clinic, leaning on a doorframe, northern winter light through the window',
      'cross-country skiing through birch forest in deep snow, poles planted, grinning',
      'sitting on a wooden jetty in a towel after a cold-water swim, steam rising off her shoulders',
    ],
  },
  alexmorel: {
    appearance:
      '33-year-old French non-binary person, light skin, dark wavy hair to the jaw tucked behind one ear, ' +
      'fine silver-framed glasses, slight build, calm thoughtful half-smile',
    scenes: [
      'at a desk by a window in Grenoble with mountains visible outside, two dictionaries open, mid-work',
    ],
  },
  rafaelmendes: {
    appearance:
      '36-year-old Brazilian man, light brown skin, dark curly hair getting long, patchy beard, ' +
      'thin build, slightly rumpled, thoughtful reserved expression',
    scenes: [
      'at a home desk in São Paulo late at night, terminal windows on screen, one lamp, mug of coffee',
      'reading in a park on a bench, book propped on one knee, city noise implied, sunlight through leaves',
    ],
  },
}

// ─── API ──────────────────────────────────────────────────────────────────────

function loadApiKey() {
  const env = readFileSync(join(REPO_ROOT, '.env'), 'utf8')
  const key = env.match(/^GEMINI_API_KEY=(.+)$/m)?.[1]?.trim()
  if (!key) throw new Error('GEMINI_API_KEY not found in .env')
  return key
}

/** Returns raw JPEG bytes. `reference` locks the face for shots after the first. */
async function generateImage(apiKey: string, prompt: string, reference?: Buffer) {
  const parts: object[] = []
  if (reference) {
    parts.push({inlineData: {mimeType: 'image/jpeg', data: reference.toString('base64')}})
  }
  parts.push({text: prompt})

  const res = await fetch(`${API}?key=${apiKey}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      contents: [{parts}],
      generationConfig: {imageConfig: {aspectRatio: '3:4'}},
    }),
  })

  const body = await res.json()
  if (body.error) throw new Error(`${body.error.status}: ${body.error.message}`)

  const candidate = body.candidates?.[0]
  const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData)
  if (!imagePart) {
    const text = candidate?.content?.parts?.find((p: any) => p.text)?.text
    throw new Error(`no image returned (finishReason=${candidate?.finishReason}) ${text ?? ''}`)
  }
  return Buffer.from(imagePart.inlineData.data, 'base64')
}

/** Re-encode to keep the repo light — raw output is ~700 KB per shot, 29 shots. */
function compress(path: string) {
  execFileSync('convert', [path, '-strip', '-quality', String(JPEG_QUALITY), path])
}

// ─── Prompt assembly ──────────────────────────────────────────────────────────

/**
 * Shot 1 becomes `pinned_url` — the avatar and the card thumbnail — so it needs the face big in frame.
 * Left to itself the model backs the camera off and the subject reads as a small figure in a room.
 */
const FRAMING =
  'Waist-up medium shot. The person is unmistakably the subject and their face is large and clearly visible, sharply in focus.'

function firstShotPrompt(profile: ShowcaseProfile, spec: PortraitSpec, scene: string) {
  return [
    `Photograph of a ${spec.appearance}.`,
    `She/he/they work as a ${profile.occupation_title} and live in ${profile.city}, ${profile.country}.`,
    `Scene: ${scene}.`,
    FRAMING,
    `They look their stated age of ${profile.age}, not older.`,
    STYLE,
  ].join(' ')
}

function followUpPrompt(spec: PortraitSpec, scene: string) {
  return [
    'Generate a new photograph of the exact same person shown in the reference image —',
    'same face, same bone structure, same hair, same age. Keep the identity strictly consistent.',
    `The person is a ${spec.appearance}.`,
    `New scene, different day, different clothes: ${scene}.`,
    'The person remains the clear subject of the frame, face visible and in focus.',
    STYLE,
  ].join(' ')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')
  const only = args[args.indexOf('--only') + 1]
  const targets = args.includes('--only')
    ? ALL_PROFILES.filter((p) => p.slug === only)
    : ALL_PROFILES

  if (targets.length === 0) throw new Error(`no persona matching --only ${only}`)

  const apiKey = dryRun ? '' : loadApiKey()
  mkdirSync(OUT_DIR, {recursive: true})

  for (const profile of targets) {
    const spec = PORTRAITS[profile.slug]
    if (!spec) throw new Error(`no portrait spec for ${profile.slug}`)
    if (spec.scenes.length !== profile.photoCount) {
      throw new Error(
        `${profile.slug}: ${spec.scenes.length} scenes but photoCount is ${profile.photoCount}`,
      )
    }

    // The first shot defines the face; later shots reference it, so it must exist before they run.
    let reference: Buffer | undefined

    for (let i = 0; i < spec.scenes.length; i++) {
      const path = join(OUT_DIR, `${profile.slug}-${i + 1}.jpg`)
      const scene = spec.scenes[i]
      const prompt = i === 0 ? firstShotPrompt(profile, spec, scene) : followUpPrompt(spec, scene)

      if (dryRun) {
        console.log(`\n── ${profile.slug}-${i + 1}\n${prompt}`)
        continue
      }

      if (existsSync(path) && !force) {
        console.log(`skip  ${profile.slug}-${i + 1} (exists)`)
        if (i === 0) reference = readFileSync(path)
        continue
      }

      try {
        const image = await generateImage(apiKey, prompt, i === 0 ? undefined : reference)
        writeFileSync(path, image)
        compress(path)
        if (i === 0) reference = readFileSync(path)
        console.log(`write ${profile.slug}-${i + 1}`)
      } catch (err: any) {
        console.error(`FAIL  ${profile.slug}-${i + 1}: ${err.message}`)
        // A failed first shot leaves nothing to reference, so the rest of this persona is pointless.
        if (i === 0) break
      }
    }
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
