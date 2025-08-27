import { XIcon } from '@heroicons/react/solid'
import Image from 'next/image'
import { useState } from 'react'
import clsx from 'clsx'
import { Row } from '../layout/row'
import { Col } from '../layout/col'
import { Modal } from '../layout/modal'
import { Button } from '../buttons/button'

export function EditablePhotoGrid(props: {
  photos: string[]
  onReorder: (newOrder: string[]) => void
  onDelete: (url: string) => void
  onSetProfilePic: (url: string) => void
}) {
  const { photos, onReorder, onDelete, onSetProfilePic } = props
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newPhotos = [...photos]
    const draggedPhoto = newPhotos[draggedIndex]
    newPhotos.splice(draggedIndex, 1)
    newPhotos.splice(index, 0, draggedPhoto)

    onReorder(newPhotos)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <>
      <Col className="gap-4">
        {/* Thumbnail strip */}
        <Row className="gap-2 overflow-x-auto pb-2">
          {photos.map((url, i) => (
            <PhotoItem
              isThumbnail
              key={url}
              url={url}
              index={i}
              isDragging={draggedIndex === i}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragEnd={handleDragEnd}
            />
          ))}
        </Row>

        {/* Main grid */}
        <Row className="flex-wrap gap-2">
          {photos.map((url, i) => (
            <PhotoItem
              key={url}
              url={url}
              index={i}
              isDragging={draggedIndex === i}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDragEnd={handleDragEnd}
              onClick={() => setFullscreenPhoto(url)}
              onDelete={onDelete}
            />
          ))}
        </Row>
      </Col>

      {/* Fullscreen view modal */}
      <Modal
        open={fullscreenPhoto !== null}
        setOpen={() => setFullscreenPhoto(null)}
        size="xl"
      >
        <Col className="gap-6">
          <Image
            src={fullscreenPhoto ?? ''}
            width={1000}
            height={1000}
            alt=""
            className="rounded"
          />
          <Row className="mr-6 justify-end gap-6">
            <Button
              color="red-outline"
              onClick={() => {
                if (fullscreenPhoto) {
                  onDelete(fullscreenPhoto)
                  setFullscreenPhoto(null)
                }
              }}
            >
              Delete
            </Button>
            <Button
              onClick={() => {
                if (fullscreenPhoto) {
                  onSetProfilePic(fullscreenPhoto)
                  setFullscreenPhoto(null)
                }
              }}
            >
              Make profile pic
            </Button>
          </Row>
        </Col>
      </Modal>
    </>
  )
}

const PhotoItem = ({
  url,
  index,
  isThumbnail = false,
  isDragging,
  handleDragEnd,
  handleDragOver,
  handleDragStart,
  onClick,
  onDelete,
}: {
  url: string
  index: number
  isThumbnail?: boolean
  isDragging?: boolean
  handleDragEnd: () => void
  handleDragOver: (e: React.DragEvent, index: number) => void
  handleDragStart: (index: number) => void
  onClick?: () => void
  onDelete?: (url: string) => void
}) => (
  <div
    key={url + index}
    className={clsx(
      'relative cursor-move',
      isThumbnail
        ? [
            'h-16 w-16 flex-shrink-0',
            index === 0 &&
              'after:bg-canvas-50/75 after:absolute after:inset-0 after:[mask-image:radial-gradient(transparent_32px,black_32px)]',
          ]
        : ['h-[300px] w-[200px]'],
      isDragging && 'opacity-50'
    )}
    draggable
    onDragStart={() => handleDragStart(index)}
    onDragOver={(e) => handleDragOver(e, index)}
    onDragEnd={handleDragEnd}
    onClick={onClick}
  >
    <Image
      src={url}
      width={isThumbnail ? 64 : undefined}
      height={isThumbnail ? 64 : undefined}
      fill={!isThumbnail}
      alt=""
      className={clsx('rounded object-cover', isThumbnail && 'h-full w-full')}
    />
    {onDelete && (
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(url)
        }}
        className="bg-canvas-0 hover:bg-ink-100 absolute right-2 top-2 rounded-full p-1"
      >
        <XIcon className="h-5 w-5" />
      </button>
    )}
  </div>
)
