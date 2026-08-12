import {ImageResponse} from '@vercel/og'
import {ogProps} from 'common/profiles/og-image'
import {NextRequest} from 'next/server'
import {classToTw} from 'web/components/og/utils'

type ImageResponseOptions = ConstructorParameters<typeof ImageResponse>[1]

export const config = {runtime: 'edge'}

const COMPASS_LOGO =
  'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/misc%2Fcompass-512.png?alt=media&token=d2fa566f-f443-4a94-90be-e50403f1805a'

export const getCardOptions = async () => ({width: 1200, height: 630})

function capitalize(str: string) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Palette
const C = {
  ink900: '#1E1A14',
  ink700: '#574E42',
  ink600: '#786C5C',
  ink500: '#8C8070',
  ink300: '#BEB2A2',
  canvas50: '#F7F4EF',
  canvas100: '#EDE8E0',
  canvas200: '#E8D5BC',
  canvas300: '#DECBB2',
  canvas950: '#2C2416',
  canvas990: '#171208',
  primary50: '#FAF3E9',
  primary100: '#F3E4CE',
  primary200: '#E8C99D',
  primary300: '#DCAB71',
  primary400: '#D09352',
  primary500: '#C17F3E',
  primary600: '#A6682E',
  primary700: '#855022',
  primary800: '#653A18',
}

// Card geometry. The content column is what's left of the 1200px card after the
// left panel and its horizontal padding.
const CARD_H = 630
const PANEL_W = 392
const CONTENT_PAD_X = 60
const CONTENT_PAD_Y = 40
const CONTENT_W = 1200 - PANEL_W - 2 * CONTENT_PAD_X
const CONTENT_H = CARD_H - 2 * CONTENT_PAD_Y

// Satori gives no measuring API, so text is sized with an average-advance estimate,
// calibrated against rendered cards and rounded up a little for safety. Only used to pick
// font sizes and trim, never to position anything. Short all-caps-ish labels like tags run
// narrower than running prose, hence the separate factors.
const BODY_CHAR = 0.5
const NAME_CHAR = 0.5
const TAG_CHAR = 0.45
const estWidth = (text: string, fontSize: number, charWidth = BODY_CHAR) =>
  text.length * fontSize * charWidth
const estLines = (text: string, fontSize: number, width: number, charWidth = BODY_CHAR) =>
  Math.max(1, Math.ceil(estWidth(text, fontSize, charWidth) / width))

// Word wrapping leaves a ragged edge, so a line holds fewer characters than raw width allows.
const WRAP_WASTE = 0.88

const NAME_SIZES = [92, 84, 76, 68, 60, 52, 46]
const AGE_FONT = 30
const TAG_FONT = 22
const TAG_ROW_H = 44
const TAG_GAP = 12
const MAX_TAG_ROWS = 2

/** Greedily keep the tags that fit within MAX_TAG_ROWS wrapped rows. */
function packTags(tags: string[]) {
  const kept: string[] = []
  let rows = 1
  let rowWidth = 0
  for (const tag of tags) {
    const width = estWidth(tag, TAG_FONT, TAG_CHAR) + 46 + TAG_GAP // pill padding + border + gap
    if (rowWidth + width > CONTENT_W && rowWidth > 0) {
      if (rows === MAX_TAG_ROWS) break
      rows++
      rowWidth = 0
    }
    kept.push(tag)
    rowWidth += width
  }
  return {tags: kept, rows: kept.length ? rows : 0}
}

function OgProfile(props: ogProps) {
  const {avatarUrl, name, username, city, country, age, interests, keywords} = props

  const keywordsList =
    typeof keywords === 'string' ? (keywords ? keywords.split(',') : []) : (keywords ?? [])
  const interestsList =
    typeof interests === 'string' ? (interests ? interests.split(',') : []) : (interests ?? [])
  const {tags: allTags, rows: tagRows} = packTags(
    [...keywordsList, ...interestsList]
      .map((tag) => (tag ?? '').trim())
      .filter(Boolean)
      .slice(0, 6)
      .map(capitalize),
  )

  const location = [city, country].filter(Boolean).join(', ')
  const imgSize = 288

  // The age pill sits on the name's row, so the name gets what's left of the column.
  const agePillWidth = age ? estWidth(age, AGE_FONT) + 42 + 20 : 0
  const nameWidth = CONTENT_W - agePillWidth

  // Shrink the name until it fits on one line; only wrap if even the smallest size can't.
  const nameSize =
    NAME_SIZES.find((size) => estWidth(name, size, NAME_CHAR) <= nameWidth) ??
    NAME_SIZES[NAME_SIZES.length - 1]
  // The size ladder is deliberately conservative; don't spend a whole extra line on a
  // name that only overshoots the estimate by a hair.
  const nameLines = estLines(name, nameSize, nameWidth * 1.05, NAME_CHAR)

  // Height already spoken for, so the headline can claim exactly what's left.
  const usedHeight =
    (username ? 47 : 0) +
    nameLines * nameSize * 1.2 +
    18 +
    (location ? 62 : 0) +
    (tagRows ? tagRows * TAG_ROW_H + (tagRows - 1) * TAG_GAP + 28 : 0)

  const headlineSize = nameLines > 1 || tagRows > 1 ? 27 : 30
  const headlineWidth = CONTENT_W - 60 // card's horizontal padding
  const headlineLines = Math.floor((CONTENT_H - usedHeight - 52) / (headlineSize * 1.45))
  const maxChars = Math.floor(
    (headlineLines * headlineWidth * WRAP_WASTE) / (headlineSize * BODY_CHAR),
  )

  let headline = headlineLines > 0 ? props.headline : ''
  if (headline && headline.length > maxChars) {
    const cut = headline.slice(0, maxChars - 1)
    const lastSpace = cut.lastIndexOf(' ')
    // Prefer a word boundary, unless that would throw away most of the last line
    headline = (lastSpace > maxChars - 20 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
  }

  return (
    <div
      style={{
        width: '1200px',
        height: `${CARD_H}px`,
        display: 'flex',
        backgroundColor: C.canvas50,
        // Warm glow anchored near the avatar, fading across the card
        backgroundImage: `radial-gradient(900px 700px at 26% 8%, ${C.primary100} 0%, rgba(243,228,206,0) 62%), radial-gradient(700px 600px at 100% 100%, ${C.canvas100} 0%, rgba(237,232,224,0) 70%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative outline rings, top-right */}
      <div
        style={{
          position: 'absolute',
          top: '-190px',
          right: '-150px',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          border: `2px solid rgba(193,127,62,0.20)`,
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-230px',
          right: '90px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          border: `2px solid rgba(193,127,62,0.14)`,
          display: 'flex',
        }}
      />

      {/* Left dark panel */}
      <div
        style={{
          width: `${PANEL_W}px`,
          height: `${CARD_H}px`,
          backgroundColor: C.canvas950,
          backgroundImage: `linear-gradient(155deg, ${C.canvas950} 0%, ${C.canvas990} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Amber halo behind the avatar */}
        <div
          style={{
            position: 'absolute',
            top: '96px',
            left: '16px',
            width: '360px',
            height: '360px',
            borderRadius: '50%',
            backgroundImage: `radial-gradient(closest-side, rgba(208,147,82,0.34) 0%, rgba(208,147,82,0) 100%)`,
            display: 'flex',
          }}
        />

        {/* Gradient ring around the avatar */}
        <div
          style={{
            width: `${imgSize + 28}px`,
            height: `${imgSize + 28}px`,
            borderRadius: '50%',
            backgroundImage: `linear-gradient(140deg, ${C.primary200} 0%, ${C.primary500} 45%, ${C.primary800} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          }}
        >
          {/* Dark gap so the ring reads as a ring, not a border */}
          <div
            style={{
              width: `${imgSize + 10}px`,
              height: `${imgSize + 10}px`,
              borderRadius: '50%',
              backgroundColor: C.canvas990,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={avatarUrl || COMPASS_LOGO}
              width={imgSize}
              height={imgSize}
              style={{borderRadius: '50%', objectFit: 'cover', display: 'flex'}}
              alt="Avatar"
            />
          </div>
        </div>

        {/* Brand pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '44px',
            padding: '12px 26px',
            borderRadius: '100px',
            border: `1px solid rgba(220,171,113,0.35)`,
            backgroundColor: 'rgba(220,171,113,0.10)',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: C.primary400,
              display: 'flex',
            }}
          />
          <span
            style={{
              fontSize: '23px',
              color: C.primary200,
              letterSpacing: '0.5px',
              display: 'flex',
            }}
          >
            compassmeet.com
          </span>
        </div>
      </div>

      {/* Right content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: `${CONTENT_PAD_Y}px ${CONTENT_PAD_X}px`,
          position: 'relative',
        }}
      >
        {/* Eyebrow */}
        {username && (
          <span
            style={{
              fontSize: '24px',
              color: C.primary600,
              letterSpacing: '2.5px',
              marginBottom: '18px',
              display: 'flex',
            }}
          >
            {'@' + username.toUpperCase()}
          </span>
        )}

        {/* Name + age */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '18px',
          }}
        >
          <span
            style={{
              fontSize: `${nameSize}px`,
              fontWeight: 'bold',
              color: C.ink900,
              letterSpacing: '-1.5px',
              lineHeight: 1.2,
              display: 'flex',
            }}
          >
            {name}
          </span>
          {age && (
            <span
              style={{
                padding: '6px 20px',
                borderRadius: '100px',
                backgroundColor: C.primary100,
                border: `1px solid ${C.primary200}`,
                color: C.primary700,
                fontSize: `${AGE_FONT}px`,
                display: 'flex',
              }}
            >
              {age}
            </span>
          )}
        </div>

        {/* Location */}
        {location && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '26px',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '3px',
                borderRadius: '2px',
                backgroundColor: C.primary400,
                display: 'flex',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '27px',
                color: C.ink600,
                display: 'flex',
              }}
            >
              {location}
            </span>
          </div>
        )}

        {/* Tags */}
        {allTags.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '28px',
            }}
          >
            {allTags.map((tag, i) => (
              <span
                key={i}
                style={{
                  padding: '9px 22px',
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${C.primary200}`,
                  color: C.primary700,
                  borderRadius: '100px',
                  fontSize: '22px',
                  boxShadow: '0 2px 8px rgba(30,26,20,0.07)',
                  display: 'flex',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Headline */}
        {headline && (
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(255,255,255,0.72)',
              borderRadius: '20px',
              boxShadow: '0 8px 30px rgba(30,26,20,0.08)',
              padding: '26px 30px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Accent bar */}
            <div
              style={{
                position: 'absolute',
                top: '0',
                bottom: '0',
                left: '0',
                width: '6px',
                backgroundImage: `linear-gradient(180deg, ${C.primary300} 0%, ${C.primary600} 100%)`,
                display: 'flex',
              }}
            />
            <span
              style={{
                fontSize: `${headlineSize}px`,
                color: C.ink700,
                lineHeight: 1.45,
                display: 'flex',
              }}
            >
              {headline}
            </span>
          </div>
        )}

        {/* Sparse profiles would otherwise leave the column near-empty */}
        {!headline && (
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              alignItems: 'center',
              gap: '14px',
              marginTop: '8px',
              padding: '16px 34px',
              borderRadius: '100px',
              backgroundImage: `linear-gradient(120deg, ${C.primary500} 0%, ${C.primary700} 100%)`,
              boxShadow: '0 10px 26px rgba(133,80,34,0.28)',
            }}
          >
            <span style={{fontSize: '27px', color: C.primary50, display: 'flex'}}>
              View full profile
            </span>
            <span style={{fontSize: '27px', color: C.primary200, display: 'flex'}}>→</span>
          </div>
        )}
      </div>

      {/* Seam between panel and content */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          bottom: '0',
          left: `${PANEL_W}px`,
          width: '3px',
          backgroundImage: `linear-gradient(180deg, ${C.primary700} 0%, ${C.primary400} 50%, ${C.primary200} 100%)`,
          display: 'flex',
        }}
      />

      {/* Bottom accent strip under the content area */}
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: `${PANEL_W}px`,
          right: '0',
          height: '8px',
          backgroundImage: `linear-gradient(90deg, ${C.primary500} 0%, ${C.primary300} 55%, ${C.primary100} 100%)`,
          display: 'flex',
        }}
      />
    </div>
  )
}

export default async function handler(req: NextRequest) {
  try {
    const {searchParams} = new URL(req.url)
    const options = await getCardOptions()

    const cleanedEntries = Array.from(searchParams.entries()).map(([key, value]) => [
      key.replace(/^amp;/, ''),
      value,
    ])
    const ogProps = Object.fromEntries(cleanedEntries) as ogProps
    const image = OgProfile(ogProps)

    return new ImageResponse(classToTw(image), options as ImageResponseOptions)
  } catch (e: any) {
    console.error(`Failed to generate OG image for URL: ${req.url}`, e)
    return new Response('Failed to generate the image', {status: 500})
  }
}
