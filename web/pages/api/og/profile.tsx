import {ImageResponse} from '@vercel/og'
import {ImageResponseOptions} from '@vercel/og/dist/types'
import {ogProps} from 'common/profiles/og-image'
import {NextRequest} from 'next/server'
import {classToTw} from 'web/components/og/utils'

export const config = {runtime: 'edge'}

export const getCardOptions = async () => ({
  width: 1200,
  height: 630,
})

// Edge-safe capitalize
// function capitalize(str: string) {
//   if (!str) return ''
//   return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
// }

function OgProfile(props: ogProps) {
  const {avatarUrl, name, city, headline} = props

  return (
    <div
      style={{
        display: 'flex',
        width: 1200,
        height: 630,
        padding: 40,
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Left Column: Text */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flex: 1,
          padding: 24,
          // color: 'white',
        }}
      >
        <span style={{fontSize: 64, fontWeight: 800}}>{name}</span>
        {/*{age && <span style={{fontSize: 28}}>{age}</span>}*/}
        <span style={{fontSize: 32, marginTop: 8}}>{headline}</span>
        {city && <span style={{fontSize: 28, marginTop: 8, opacity: 0.5}}>{city}</span>}
      </div>

      {/* Right Column: Image */}
      <div style={{display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            width={500}
            height={500}
            style={{borderRadius: 50, objectFit: 'cover', objectPosition: 'center'}}
            alt={`${name}'s avatar`}
          />
        ) : (
          <div
            style={{
              width: 500,
              height: 500,
              borderRadius: 50,
              backgroundColor: '#ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
            }}
          >
            No Image
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
    const ogProps = Object.fromEntries(searchParams.entries()) as ogProps
    const image = OgProfile(ogProps)

    return new ImageResponse(classToTw(image), options as ImageResponseOptions)
  } catch (e: any) {
    console.error(`Failed to generate OG image for URL: ${req.url}`, e)
    return new Response('Failed to generate the image', {status: 500})
  }
}
