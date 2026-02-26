import {ImageResponse} from '@vercel/og'
import {ImageResponseOptions} from '@vercel/og/dist/types'
import {ogProps} from 'common/profiles/og-image'
import {NextRequest} from 'next/server'
import {classToTw} from 'web/components/og/utils'

export const config = {runtime: 'edge'}

const COMPASS_LOGO =
  'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/misc%2Fcompass-512.png?alt=media&token=d2fa566f-f443-4a94-90be-e50403f1805a'

export const getCardOptions = async () => ({
  width: 1200,
  height: 630,
})

// Edge-safe capitalize
function capitalize(str: string) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function OgProfile(props: ogProps) {
  const {avatarUrl, name, city, country, age, interests, keywords} = props
  let headline = props.headline

  const _interestsList =
    typeof interests === 'string' ? (interests ? interests.split(',') : []) : (interests ?? [])
  const keywordsList =
    typeof keywords === 'string' ? (keywords ? keywords.split(',') : []) : (keywords ?? [])
  const allTags = [...keywordsList].filter(Boolean).slice(0, 8)

  const maxChars = 200
  if (headline && headline.length > maxChars) {
    headline = headline.slice(0, maxChars) + '...'
  }

  const totalChars = (headline?.length || 0) + (allTags?.join(' ')?.length || 0) + name.length * 3

  const isLargerPicLayout = totalChars < 220

  console.log(props)

  const imgSize = isLargerPicLayout ? 400 : 250
  return (
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        padding: '50px',
        fontFamily: 'sans-serif',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div style={{display: 'flex', flex: isLargerPicLayout ? 1 : 3}}>
        {/* Left Column: Text */}
        <div
          style={{
            flex: isLargerPicLayout ? 1 : 3,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            justifyContent: 'center',
          }}
        >
          <div style={{display: 'flex', fontSize: '64px', fontWeight: 'bold'}}>
            {name}
            {age && `, ${age}`}
          </div>
          {city && (
            <div
              style={{
                display: 'flex',
                fontSize: '28px',
                marginBottom: '20px',
                marginTop: '20px',
                opacity: 0.85,
              }}
            >
              {city}
              {country && `, ${country}`}
            </div>
          )}
          {/*<div style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start'}}>*/}
          {/*  <img src={'https://www.compassmeet.com/favicon.svg'} width={100} height={100} />*/}
          {/*</div>*/}
          {allTags && (
            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
              {allTags?.map(capitalize).map((tag, i) => (
                <span
                  key={i}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ddd',
                    borderRadius: '20px',
                    fontSize: '24px',
                  }}
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
          {isLargerPicLayout && (
            <div style={{display: 'flex'}}>
              {headline && (
                <div style={{display: 'flex', fontSize: '36px', marginTop: '40px'}}>{headline}</div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Avatar */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img
            src={avatarUrl || COMPASS_LOGO}
            width={imgSize}
            height={imgSize}
            style={{borderRadius: 50, objectFit: 'cover'}}
            alt="Avatar"
          />
          {isLargerPicLayout && (
            <div
              style={{
                display: 'flex',
                fontSize: '48px',
                fontWeight: 'semibold',
                fontFamily: 'Georgia',
                marginTop: '20px',
                fontStyle: 'italic',
              }}
            >
              compassmeet.com
            </div>
          )}
        </div>
      </div>

      {!isLargerPicLayout && (
        <div
          style={{
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '40px',
          }}
        >
          {headline && (
            <div style={{display: 'flex', fontSize: '36px', marginTop: '40px'}}>{headline}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default async function handler(req: NextRequest) {
  try {
    const {searchParams} = new URL(req.url)
    const options = await getCardOptions()
    const ogProps = Object.fromEntries(searchParams.entries()) as ogProps
    const image = OgProfile(ogProps)

    return new ImageResponse(classToTw(image), options as ImageResponseOptions)
  } catch (e: any) {
    console.error(`Failed to generate OG image for URL: ${req.url}`, e)
    return new Response('Failed to generate the image', {status: 500})
  }
}
