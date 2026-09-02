import {CheckCircleIcon} from '@heroicons/react/24/outline'
import {ChevronLeftIcon, ChevronRightIcon, PlusIcon, XMarkIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {buildArray} from 'common/util/array'
import {uniq} from 'lodash'
import Image from 'next/image'
import {useState} from 'react'
import toast from 'react-hot-toast'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {isVideo, uploadImage} from 'web/lib/firebase/storage'
import {useT} from 'web/lib/locale'

export const AddPhotosWidget = (props: {
  image_descriptions: Record<string, string> | null
  photo_urls: string[] | null
  pinned_url: string | null
  setPhotoUrls: (urls: string[]) => void
  setPinnedUrl: (url: string) => void
  setDescription: (url: string, description: string) => void
  onUpload?: (uploading: boolean) => void
}) => {
  const {
    photo_urls,
    pinned_url,
    setPhotoUrls,
    setPinnedUrl,
    setDescription,
    image_descriptions,
    onUpload,
  } = props
  const t = useT()

  const [uploadingImages, setUploadingImages] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // The order shown is the order stored: the first photo is the profile picture, so `pinned_url` is
  // just a mirror of `urls[0]` rather than something the member picks separately.
  const urls = uniq(buildArray(pinned_url, photo_urls))

  const commitOrder = (newUrls: string[]) => {
    setPhotoUrls(newUrls)
    setPinnedUrl(newUrls[0] ?? '')
  }

  const moveTo = (from: number, to: number) => {
    if (to < 0 || to >= urls.length || from === to) return
    const newUrls = [...urls]
    const [moved] = newUrls.splice(from, 1)
    newUrls.splice(to, 0, moved)
    commitOrder(newUrls)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedIndex === null || draggedIndex === index) return
    moveTo(draggedIndex, index)
    setDraggedIndex(index)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploadingImages(true)
    onUpload?.(true)

    // Convert files to an array and take only the first 6 files
    const selectedFiles = Array.from(files).slice(0, 6)

    const newUrls = await Promise.all(selectedFiles.map((f) => uploadImage(f, 'profiles'))).catch(
      (e) => {
        console.error(e)
        // Only ever a string to the toast. react-hot-toast renders its argument as a React child, so
        // handing it the rejection itself (a FirebaseError on, say, `storage/retry-limit-exceeded`)
        // throws "Objects are not valid as a React child" out of the toaster's render and takes the
        // whole page down through the error boundary.
        toast.error(
          e instanceof Error
            ? e.message
            : t('add_photos.upload_failed', 'Could not upload your photos. Please try again.'),
        )
        return []
      },
    )
    commitOrder(uniq([...urls, ...newUrls]))
    setUploadingImages(false)
    onUpload?.(false)
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
        <div className="relative" data-testid="profile-upload-photo">
          {/* Dashed and captioned, matching the empty states elsewhere. A flat grey rectangle with a
              64px plus in it read as a failed image rather than an invitation — and this is the most
              valuable field on the form. `text-gray-500` was also an off-palette literal that does not
              flip with the theme. */}
          <label
            className={clsx(
              'border-canvas-300 text-ink-500 hover:border-primary-400 hover:text-primary-600 flex h-[200px] w-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors',
              uploadingImages && 'opacity-50 cursor-not-allowed',
            )}
            htmlFor="photo-upload"
          >
            {uploadingImages ? (
              <div className="border-primary-500 h-10 w-10 animate-spin rounded-full border-b-2" />
            ) : (
              <>
                <PlusIcon className="h-8 w-8" />
                <span className="text-sm">{t('profile.optional.add_photos', 'Add photos')}</span>
              </>
            )}
          </label>
        </div>
        {urls.map((url, index) => {
          const isProfilePic = index === 0
          return (
            <div
              key={url}
              className={clsx(
                'relative rounded-md border-2 p-2',
                isProfilePic ? 'border-teal-500' : 'border-canvas-100',
                draggedIndex === index && 'opacity-50',
              )}
              onDragOver={(e: React.DragEvent) => handleDragOver(e, index)}
              onDrop={(e: React.DragEvent) => e.preventDefault()}
              onDragEnd={() => setDraggedIndex(null)}
            >
              {/* Every badge and arrow lives in here with the photo. Positioned siblings paint in
                  DOM order, so a control left outside this wrapper ends up *under* the image. They
                  are siblings of the draggable element, not children, so pressing one never starts
                  a drag. */}
              <div className="relative">
                {/* Only the media itself is the drag handle: making the whole card draggable would
                    swallow text selection inside the description textarea. */}
                <div
                  draggable
                  onDragStart={(e: React.DragEvent) => {
                    // Firefox refuses to start a drag unless some data is attached.
                    e.dataTransfer.setData('text/plain', url)
                    e.dataTransfer.effectAllowed = 'move'
                    setDraggedIndex(index)
                  }}
                  className={clsx(urls.length > 1 && 'cursor-move')}
                >
                  {isVideo(url) ? (
                    <video
                      src={url}
                      width={80}
                      height={80}
                      className="h-[200px] w-[200px] object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <Image
                      src={url}
                      width={80}
                      height={80}
                      alt={`preview ${index}`}
                      className="h-[200px] w-[200px] object-cover"
                      draggable={false}
                    />
                  )}
                </div>

                {isProfilePic && (
                  <CheckCircleIcon
                    className="bg-canvas-50 absolute left-1 top-1 h-6 w-6 rounded-full text-teal-500 shadow"
                    title={t('add_photos.profile_picture_badge', 'This is your profile picture')}
                  />
                )}
                <OverlayButton
                  label={t('add_photos.remove_photo', 'Remove photo')}
                  className="right-1 top-1"
                  onClick={() => commitOrder(urls.filter((u) => u !== url))}
                >
                  <XMarkIcon className="h-5 w-5" />
                </OverlayButton>

                {/* Drag-and-drop is mouse-only, so the same reordering is reachable by tap and by
                    keyboard through these two arrows. Ends are omitted rather than disabled — a
                    greyed-out control floating over a photo is just noise. */}
                {index > 0 && (
                  <OverlayButton
                    label={t('add_photos.move_earlier', 'Move photo earlier')}
                    className="left-1 top-1/2 -translate-y-1/2"
                    onClick={() => moveTo(index, index - 1)}
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </OverlayButton>
                )}
                {index < urls.length - 1 && (
                  <OverlayButton
                    label={t('add_photos.move_later', 'Move photo later')}
                    className="right-1 top-1/2 -translate-y-1/2"
                    onClick={() => moveTo(index, index + 1)}
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </OverlayButton>
                )}
              </div>

              <textarea
                aria-label={`description for image ${index}`}
                placeholder={t('add_photos.add_description', 'Add description')}
                value={image_descriptions?.[url] ?? ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      {urls.length ? (
        <Col className={'text-ink-500 gap-1 text-xs italic'}>
          <span>
            {t('add_photos.profile_picture_hint', 'The highlighted image is your profile picture')}
            {' — '}
            {t(
              'add_photos.profile_picture_center_face_hint',
              'make sure your face is centered in it, since this is what appears on your profile card',
            )}
          </span>
          {urls.length > 1 && (
            <span>
              {t(
                'add_photos.reorder_hint',
                'Drag a photo, or use the arrows on it, to reorder them. The first one is your profile picture.',
              )}
            </span>
          )}
        </Col>
      ) : null}
    </Col>
  )
}

/** A round icon button floating over a photo — `className` places it. */
const OverlayButton = (props: {
  label: string
  className: string
  onClick: () => void
  children: React.ReactNode
}) => {
  const {label, className, onClick, children} = props
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={clsx(
        // Translucent canvas rather than a solid chip: the photo stays readable underneath, and
        // the blur keeps the icon legible over a busy one either way.
        'bg-canvas-50/70 text-ink-900 hover:bg-canvas-50 absolute rounded-full p-1 shadow backdrop-blur-sm transition-colors',
        className,
      )}
    >
      {children}
    </button>
  )
}
