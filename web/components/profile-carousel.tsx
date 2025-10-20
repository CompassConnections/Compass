import { useState } from 'react'
import clsx from 'clsx'
import Image from 'next/image'
import Router from 'next/router'
import { buildArray } from 'common/util/array'
import { Carousel } from 'web/components/widgets/carousel'
import { MODAL_CLASS, Modal } from 'web/components/layout/modal'
import { Col } from 'web/components/layout/col'
import { SignUpButton } from './nav/love-sidebar'
import { Profile } from 'common/profiles/profile'
import { useAdmin } from 'web/hooks/use-admin'
import { Button } from 'web/components/buttons/button'
import { updateProfile } from 'web/lib/api'
import { Row } from 'web/components/layout/row'
import { useUser } from 'web/hooks/use-user'
import { PlusIcon } from '@heroicons/react/solid'
import { api } from 'web/lib/api'
import { EditablePhotoGrid } from './widgets/editable-photo-grid'
import { AddPhotosWidget } from './widgets/add-photos'

export default function ProfileCarousel(props: { profile: Profile }) {
  const { profile } = props
  const photoNums = profile.photo_urls ? profile.photo_urls.length : 0

  const [lightboxUrl, setLightboxUrl] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [addPhotosOpen, setAddPhotosOpen] = useState(false)

  const [pinnedUrl, setPinnedUrl] = useState<string | null>(profile.pinned_url)
  const [photoUrls, setPhotoUrls] = useState<string[]>(profile.photo_urls ?? [])

  const isAdmin = useAdmin()
  const currentUser = useUser()
  const isCurrentUser = currentUser?.id === profile.user_id

  const handleSaveChanges = async () => {
    await updateProfile({
      pinned_url: pinnedUrl ?? undefined,
      photo_urls: photoUrls,
    })
    setIsEditMode(false)
  }

  if (!currentUser && profile.visibility !== 'public') {
    return (
      <Carousel>
        {profile.pinned_url && (
          <div className="h-80 w-[250px] flex-none snap-start">
            <Image
              priority={true}
              src={profile.pinned_url}
              height={360}
              width={240}
              sizes="(max-width: 640px) 100vw, 240px"
              alt=""
              className="h-full cursor-pointer rounded object-cover"
            />
          </div>
        )}
        {photoNums > 0 && (
          <Col className="bg-canvas-100 dark:bg-canvas-0 text-ink-500 relative h-80 w-[250px] flex-none items-center rounded text-6xl ">
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
      <div className="flex gap-2 self-end">
        {isAdmin && (
          <Button
            size="sm"
            color="red"
            onClick={() => {
              api('remove-pinned-photo', { userId: profile.user_id }).then(() =>
                Router.back()
              )
            }}
          >
            Admin: Delete pinned photo
          </Button>
        )}
        {isCurrentUser && !isEditMode && (
          <Button
            onClick={() => setIsEditMode(true)}
            color="gray-outline"
            size="sm"
          >
            Edit photos
          </Button>
        )}
        {isCurrentUser && isEditMode && (
          <Row className="gap-2">
            <Button
              onClick={() => {
                // TODO this is stale if you've saved
                setPhotoUrls(profile.photo_urls ?? [])
                setPinnedUrl(profile.pinned_url)
                setIsEditMode(false)
              }}
              color="gray-outline"
              size="sm"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} size="sm">
              Save changes
            </Button>
          </Row>
        )}
      </div>

      {isEditMode ? (
        <Col className="gap-4">
          <EditablePhotoGrid
            photos={buildArray(pinnedUrl, photoUrls)}
            onReorder={(newOrder) => {
              const newPinnedUrl = newOrder[0]
              const newPhotoUrls = newOrder.filter(
                (url) => url !== newPinnedUrl
              )
              setPinnedUrl(newPinnedUrl)
              setPhotoUrls(newPhotoUrls)
            }}
            onDelete={(url) => {
              if (url === pinnedUrl) {
                const newPhotos = photoUrls.filter((u) => u !== url)
                setPinnedUrl(newPhotos[0] ?? null)
                setPhotoUrls(newPhotos.slice(1))
              } else {
                setPhotoUrls(photoUrls.filter((u) => u !== url))
              }
            }}
            onSetProfilePic={(url) => {
              if (url === pinnedUrl) return
              setPinnedUrl(url)
              setPhotoUrls(
                [...photoUrls.filter((u) => u !== url), pinnedUrl].filter(
                  Boolean
                ) as string[]
              )
            }}
          />
          <Button
            onClick={() => setAddPhotosOpen(true)}
            color="gray-outline"
            size="sm"
            className="self-start"
          >
            <PlusIcon className="mr-1 h-5 w-5" />
            Add photos
          </Button>
        </Col>
      ) : (
        <Carousel>
          {buildArray(profile.pinned_url, profile.photo_urls).map((url, i) => (
            <div key={url} className="h-80 w-[250px] flex-none snap-start">
              <Image
                priority={i < 3}
                src={url}
                height={360}
                width={240}
                sizes="(max-width: 640px) 100vw, 240px"
                alt=""
                className="h-full cursor-pointer rounded object-cover"
                onClick={() => {
                  setLightboxUrl(url)
                  setLightboxOpen(true)
                }}
              />
            </div>
          ))}
          {isCurrentUser && (profile.photo_urls?.length ?? 0) > 1 && (
            <button
              className="bg-ink-200 text-ink-0 group flex h-80 w-[250px] flex-none cursor-pointer snap-start items-center justify-center rounded ease-in-out"
              onClick={() => setAddPhotosOpen(true)}
            >
              <PlusIcon className="w-20 transition-all group-hover:w-24" />
            </button>
          )}
        </Carousel>
      )}

      <Modal open={lightboxOpen} setOpen={setLightboxOpen}>
        <Image src={lightboxUrl} width={1000} height={1000} alt="" />
      </Modal>

      {isCurrentUser && (
        <Modal open={addPhotosOpen} setOpen={setAddPhotosOpen}>
          <Col className={clsx(MODAL_CLASS)}>
            <AddPhotosWidget
              user={currentUser}
              photo_urls={photoUrls}
              pinned_url={pinnedUrl}
              setPhotoUrls={setPhotoUrls}
              setPinnedUrl={setPinnedUrl}
            />
            <Row className="gap-4 self-end">
              <Button
                color="gray-outline"
                onClick={() => setAddPhotosOpen(false)}
              >
                Done
              </Button>
            </Row>
          </Col>
        </Modal>
      )}
    </>
  )
}
