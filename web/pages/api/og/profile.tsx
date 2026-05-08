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
  ink600: '#786C5C',
  ink500: '#8C8070',
  ink300: '#BEB2A2',
  canvas50: '#F7F4EF',
  canvas100: '#EDE8E0',
  canvas200: '#E8D5BC',
  canvas300: '#DECBB2',
  canvas950: '#2C2416',
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

function OgProfile(props: ogProps) {
  const {avatarUrl, name, city, country, age, interests, keywords} = props
  let headline = props.headline

  const keywordsList =
    typeof keywords === 'string' ? (keywords ? keywords.split(',') : []) : (keywords ?? [])
  const interestsList =
    typeof interests === 'string' ? (interests ? interests.split(',') : []) : (interests ?? [])
  const allTags = [...keywordsList, ...interestsList].filter(Boolean).slice(0, 6)

  const maxChars = 250
  if (headline && headline.length > maxChars) {
    headline = headline.slice(0, maxChars) + '…'
  }

  const hasLongContent = (headline?.length || 0) > 80 || allTags.length > 4
  const imgSize = 300

  return (
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        backgroundColor: C.canvas100,
        fontFamily: 'Georgia, serif',
        position: 'relative',
      }}
    >
      {/* Left dark panel */}
      <div
        style={{
          width: '340px',
          height: '630px',
          backgroundColor: C.canvas950,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Amber ring behind avatar */}
        <div
          style={{
            width: `${imgSize + 10}px`,
            height: `${imgSize + 10}px`,
            borderRadius: '50%',
            backgroundColor: C.primary700,
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

        {/* Compass URL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: C.primary400,
              display: 'flex',
            }}
          />
          <span
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: '22px',
              color: C.primary300,
              display: 'flex',
            }}
          >
            compassmeet.com
          </span>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: C.primary400,
              display: 'flex',
            }}
          />
        </div>

        {/* Subtle bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '4px',
            backgroundColor: C.primary500,
            display: 'flex',
          }}
        />
      </div>

      {/* Right content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '52px 56px',
          gap: '0px',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '4px',
            backgroundColor: C.primary500,
            display: 'flex',
          }}
        />

        {/* Name + age */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '16px',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: hasLongContent ? '70px' : '80px',
              fontWeight: 'bold',
              color: C.ink900,
              lineHeight: 1.05,
              display: 'flex',
            }}
          >
            {name}
          </span>
          {age && (
            <span
              style={{
                fontSize: hasLongContent ? '38px' : '44px',
                color: C.ink500,
                fontFamily: 'Georgia, serif',
                display: 'flex',
              }}
            >
              {age}
            </span>
          )}
        </div>

        {/* Location */}
        {(city || country) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: C.primary400,
                display: 'flex',
                flexShrink: 0,
                marginTop: '2px',
              }}
            />
            <span
              style={{
                fontSize: '26px',
                color: C.ink500,
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                display: 'flex',
              }}
            >
              {[city, country].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Tags */}
        {allTags.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              marginBottom: '24px',
            }}
          >
            {allTags.map(capitalize).map((tag, i) => (
              <span
                key={i}
                style={{
                  padding: '6px 18px',
                  backgroundColor: C.canvas200,
                  color: C.primary700,
                  borderRadius: '100px',
                  fontSize: '22px',
                  fontFamily: 'Georgia, serif',
                  display: 'flex',
                }}
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Headline */}
        {headline && (
          <div
            style={{
              display: 'flex',
              borderLeft: `3px solid ${C.primary300}`,
              paddingLeft: '20px',
              marginTop: '4px',
            }}
          >
            <span
              style={{
                fontSize: '28px',
                color: C.ink600,
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                lineHeight: 1.5,
                display: 'flex',
              }}
            >
              {headline}
            </span>
          </div>
        )}
      </div>
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
