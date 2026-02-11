import {CheckCircleIcon} from '@heroicons/react/outline'
import {PlusIcon, XIcon} from '@heroicons/react/solid'
import Image from 'next/image'
import {uniq} from 'lodash'
import {useState} from 'react'
import {useT} from 'web/lib/locale'
import clsx from 'clsx'

import {Col} from 'web/components/layout/col'
import {Button} from 'web/components/buttons/button'
import {uploadImage} from 'web/lib/firebase/storage'
import {buildArray} from 'common/util/array'
import {Row} from 'web/components/layout/row'
import {User} from 'common/user'

export const AddPhotosWidget = (props: {
  user: User
  image_descriptions: Record<string, string> | null
  photo_urls: string[] | null
  pinned_url: string | null
  setPhotoUrls: (urls: string[]) => void
  setPinnedUrl: (url: string) => void
  setDescription: (url: string, description: string) => void
}) => {
  const {user, photo_urls, pinned_url, setPhotoUrls, setPinnedUrl, setDescription, image_descriptions} = props
  const t = useT()

  const [uploadingImages, setUploadingImages] = useState(false)


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploadingImages(true)

    // Convert files to an array and take only the first 6 files
    const selectedFiles = Array.from(files).slice(0, 6)

    const urls = await Promise.all(
      selectedFiles.map((f) => uploadImage(user.username, f, 'love-images'))
    ).catch((e) => {
      console.error(e)
      return []
    })
    if (!pinned_url) setPinnedUrl(urls[0])
    setPhotoUrls(uniq([...(photo_urls ?? []), ...urls]))
    setUploadingImages(false)
  }

  return (
    <Col className="gap-2">
      <input
        id="photo-upload"
        type="file"
        onChange={handleFileChange}
        multiple // Allows multiple files to be selected
        className={'hidden'}
        disabled={uploadingImages}
      />
      <Row className="flex-wrap gap-2">
        <div className="relative" data-testid='profile-upload-photo'>
          <label
            className={clsx(
              'bg-canvas-50 hover:bg-ink-300 text-ink-0 dark:text-ink-500 hover:dark:text-ink-600 flex h-[200px] w-[200px] cursor-pointer flex-col items-center rounded-md transition-colors',
              uploadingImages && 'opacity-50 cursor-not-allowed'
            )}
            htmlFor="photo-upload"
          >
            {uploadingImages ? (
              <div className="mx-auto my-auto h-16 w-16 animate-spin rounded-full border-b-2 border-gray-500"></div>
            ) : (
              <PlusIcon className="mx-auto my-auto h-16 w-16 text-gray-500"/>
            )}
          </label>
        </div>
        {uniq(buildArray(pinned_url, photo_urls))?.map((url, index) => {
          const isPinned = url === pinned_url
          return (
            <div
              key={index}
              className={clsx(
                'relative cursor-pointer rounded-md border-2 p-2',
                isPinned ? 'border-teal-500' : 'border-canvas-100',
                'hover:border-teal-900'
              )}
              onClick={() => {
                if (isPinned) return
                setPhotoUrls(uniq(buildArray(pinned_url, photo_urls)))
                setPinnedUrl(url)
              }}
            >
              {isPinned && (
                <div className={clsx(' absolute left-0 top-0 rounded-full')}>
                  <CheckCircleIcon
                    className={
                      ' bg-canvas-0 h-6 w-6 rounded-full text-teal-500'
                    }
                  />
                </div>
              )}
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  const newUrls = (photo_urls ?? []).filter((u) => u !== url)
                  if (isPinned) setPinnedUrl(newUrls[0] ?? '')
                  setPhotoUrls(newUrls)
                }}
                color={'gray-outline'}
                size={'2xs'}
                className={clsx(
                  'bg-canvas-0 absolute right-0 top-0 !rounded-full !px-1 py-1'
                )}
              >
                <XIcon className={'h-4 w-4'}/>
              </Button>
              <Image
                src={url}
                width={80}
                height={80}
                alt={`preview ${index}`}
                className="h-[200px] w-[200px] object-cover"
              />

              <textarea
                // stop click bubbling so clicking/focusing the input doesn't pin the image
                onClick={(e) => e.stopPropagation()}
                aria-label={`description for image ${index}`}
                placeholder={t('add_photos.add_description', 'Add description')}
                value={image_descriptions?.[url] ?? ''}
                onChange={(e) => {
                  e.stopPropagation()
                  const v = e.target.value
                  setDescription(url, v)
                }}
                rows={3}
                className="mt-2 w-[200px] rounded border px-2 py-1 text-sm focus:outline-none bg-canvas-50 resize-none overflow-y-auto"
              />
            </div>
          )
        })}
      </Row>
      {photo_urls?.length ? (
        <span className={'text-ink-500 text-xs italic'}>
          {t('add_photos.profile_picture_hint', 'The highlighted image is your profile picture')}
        </span>
      ) : null}
    </Col>
  )
}
