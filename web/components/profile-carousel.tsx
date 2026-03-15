import {Profile} from 'common/profiles/profile'
import {buildArray} from 'common/util/array'
import Image from 'next/image'
import {useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Modal} from 'web/components/layout/modal'
import {Carousel} from 'web/components/widgets/carousel'
import {useUser} from 'web/hooks/use-user'
import {isVideo} from 'web/lib/firebase/storage'

import {SignUpButton} from './nav/sidebar'

export default function ProfileCarousel(props: {profile: Profile; refreshProfile: () => void}) {
  const {profile} = props
  const photoNums = profile.photo_urls ? profile.photo_urls.length : 0

  const [lightboxUrl, setLightboxUrl] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const currentUser = useUser()

  if (photoNums == 0 && !profile.pinned_url) return

  if (!currentUser && profile.visibility !== 'public') {
    return (
      <Carousel>
        {profile.pinned_url && (
          <div className="h-[300px] w-[300px] flex-none snap-start">
            <Image
              priority={true}
              src={profile.pinned_url}
              height={300}
              width={300}
              sizes="(max-width: 640px) 100vw, 300px"
              alt=""
              className="h-full cursor-pointer rounded object-cover"
            />
          </div>
        )}
        {photoNums > 0 && (
          <Col className="bg-canvas-100 dark:bg-canvas-0 text-ink-500 relative h-[300px] w-[300px] flex-none items-center rounded text-6xl ">
            <Col className=" m-auto items-center gap-1">
              <div className="select-none font-semibold">+{photoNums}</div>
              <SignUpButton
                text="Sign up to see"
                size="xs"
                color="none"
                className="dark:text-ink-500 hover:text-primary-500 hover:underline"
              />
            </Col>
          </Col>
        )}
      </Carousel>
    )
  }

  return (
    <>
      <Carousel>
        {buildArray(profile.pinned_url, profile.photo_urls).map((url, i) => (
          <Col key={url}>
            <div className="h-[300px] w-[300px] flex-none snap-start">
              {isVideo(url) ? (
                <video
                  src={url}
                  height={300}
                  width={300}
                  className="h-full w-full cursor-pointer rounded object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  onClick={() => {
                    setLightboxUrl(url)
                    setLightboxOpen(true)
                  }}
                />
              ) : (
                <Image
                  priority={i < 3}
                  src={url}
                  height={300}
                  width={300}
                  sizes="(max-width: 640px) 100vw, 300px"
                  alt=""
                  className="h-full cursor-pointer rounded object-cover"
                  onClick={() => {
                    setLightboxUrl(url)
                    setLightboxOpen(true)
                  }}
                />
              )}
            </div>
            <p className="mt-2 px-4 py-1 text-sm w-[300px] whitespace-pre-wrap">
              {(profile.image_descriptions as Record<string, string>)?.[url]}
            </p>
          </Col>
        ))}
      </Carousel>

      <Modal open={lightboxOpen} setOpen={setLightboxOpen}>
        {isVideo(lightboxUrl) ? (
          <video
            src={lightboxUrl}
            controls
            autoPlay
            playsInline
            className="max-h-[80vh] w-full rounded"
          />
        ) : (
          <Image src={lightboxUrl} width={1000} height={1000} alt="" />
        )}
      </Modal>
    </>
  )
}
