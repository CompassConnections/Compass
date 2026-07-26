import clsx from 'clsx'
import Video from 'common/util/tiptap-video'
import {useState} from 'react'
import {MediaModal} from 'web/components/media-modal'

export const BasicVideo = Video.extend({
  renderReact: (attrs: any) => <video src={attrs.src} controls preload="metadata" />,
})

export const DisplayVideo = Video.extend({
  renderReact: (attrs: any) => <ExpandingVideo {...attrs} />,
})

export const MediumDisplayVideo = Video.extend({
  renderReact: (attrs: any) => <ExpandingVideo size={'md'} {...attrs} />,
})

function ExpandingVideo(props: {src: string; size?: 'md'}) {
  const [expanded, setExpanded] = useState(false)
  const {size, ...rest} = props

  return (
    <>
      <video
        {...rest}
        muted
        playsInline
        preload="metadata"
        onClick={() => setExpanded(true)}
        className={clsx(
          'cursor-pointer object-contain',
          size === 'md' ? 'max-h-[400px]' : 'h-[128px]',
        )}
      />
      <MediaModal url={rest.src} open={expanded} setOpen={setExpanded} />
    </>
  )
}
