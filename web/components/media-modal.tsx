import {Dialog, Transition} from '@headlessui/react'
import {XMarkIcon} from '@heroicons/react/24/outline'
import Image from 'next/image'
import {Fragment} from 'react'
import {isVideo} from 'web/lib/firebase/storage'

// Enlarges an image or video to the largest size that fits within 90% of the
// viewport in both dimensions, without cropping (aspect ratio preserved).
export function MediaModal(props: {url: string; open: boolean; setOpen: (open: boolean) => void}) {
  const {url, open, setOpen} = props

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog className="relative z-50" onClose={() => setOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-linear duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-linear duration-75"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* background cover */}
          <div className="bg-canvas-100/75 fixed inset-0" />
        </Transition.Child>

        {/* close button, fixed so it stays visible whatever the media size */}
        <button
          onClick={() => setOpen(false)}
          className="text-ink-700 hover:text-primary-400 focus:text-primary-400 fixed right-4 top-4 z-10 cursor-pointer outline-none"
        >
          <XMarkIcon className="h-8 w-8" />
          <div className="sr-only">Close</div>
        </button>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-75"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="relative flex items-center justify-center">
              {isVideo(url) ? (
                <video
                  src={url}
                  controls
                  autoPlay
                  playsInline
                  className="h-auto max-h-[90vh] w-auto max-w-[90vw] rounded object-contain"
                />
              ) : (
                <Image
                  src={url}
                  width={2000}
                  height={2000}
                  alt=""
                  className="h-auto max-h-[90vh] w-auto max-w-[90vw] rounded object-contain"
                />
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
