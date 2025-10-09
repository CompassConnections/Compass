import { ImageResponse } from '@vercel/og'
import { ImageResponseOptions } from '@vercel/og/dist/types'
import { NextRequest } from 'next/server'
import { classToTw } from 'web/components/og/utils'
import { Gender, convertGender } from 'common/gender'
import { LoveOgProps } from 'common/love/og-image'

export const config = { runtime: 'edge' }

export const getCardOptions = async () => {
  const [light, med] = await Promise.all([figtreeLightData, figtreeMediumData])

  return {
    width: 600,
    height: 315,
    fonts: [
      {
        name: 'Figtree',
        data: med,
        style: 'normal',
      },
      {
        name: 'Figtree-light',
        data: light,
        style: 'normal',
      },
    ],
  }
}

const FIGTREE_LIGHT_URL = new URL('Figtree-Light.ttf', import.meta.url)
const figtreeLightData = fetch(FIGTREE_LIGHT_URL).then((res) =>
  res.arrayBuffer()
)
const FIGTREE_MED_URL = new URL('Figtree-Medium.ttf', import.meta.url)
const figtreeMediumData = fetch(FIGTREE_MED_URL).then((res) =>
  res.arrayBuffer()
)

// Quick replacement for lodash.capitalize since this is an edge function
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function OgProfile(props: LoveOgProps) {
  const { avatarUrl, username, name, age, city, gender } = props
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center"
      // style={{
      //   fontFamily: 'var(--font-main), Figtree',
      //   background:
      //     'radial-gradient(circle at top left, #ffffff 0%, #ffffff 85%, #ffffff 100%)',
      // }}
    >
      <div className="flex flex-col">
        <img
          src={avatarUrl}
          width={250}
          height={250}
          className="rounded-lg"
          style={{
            objectPosition: 'center',
            objectFit: 'cover',
          }}
          alt='Compass logo'
        />

        {/* Details */}
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col rounded-lg px-4 pb-2 pt-6"
          // Equivalent to bg-gradient-to-t from-black/70 via-black/70 to-transparent
          style={{
            background:
              'linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0) 100%)',
          }}
        >
          <div className="flex flex-row flex-wrap text-gray-50">
            <span className="font-bold">{name}</span>, {age}
          </div>
          <div className="flex flex-row text-xs text-gray-50">
            {city} • {capitalize(convertGender(gender as Gender))}
          </div>
        </div>
      </div>

      {/* Bottom: Logo + URL */}
      <div
        className="flex items-center pb-1"
        style={{ fontFamily: 'var(--font-main), Figtree-light' }}
      >
        <img
          className="mr-1.5 h-12 w-12"
          src="https://www.compassmeet.com/favicon.ico"
          width={48}
          height={48}
          alt='Compass logo'
        />
        <span className="text-2xl font-thin">
          compassmeet.com/{username}
        </span>
      </div>
    </div>
  )
}

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const options = await getCardOptions()
    const loveOgProps = Object.fromEntries(
      searchParams.entries()
    ) as LoveOgProps
    const image = OgProfile(loveOgProps)

    return new ImageResponse(classToTw(image), options as ImageResponseOptions)
  } catch (e: any) {
    console.error(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
