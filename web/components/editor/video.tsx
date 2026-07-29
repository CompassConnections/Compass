import clsx from 'clsx'
import Video from 'common/util/tiptap-video'
import {useState} from 'react'
import {MediaModal} from 'web/components/media-modal'
import {firstFrameSrc, VideoThumbnail} from 'web/components/widgets/video-thumbnail'

export const BasicVideo = Video.extend({
  // Controls are their own play affordance here; the fragment is what keeps the frame behind them
  // from being blank.
  renderReact: (attrs: any) => <video src={firstFrameSrc(attrs.src)} controls preload="metadata" />,
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
      <VideoThumbnail
        src={rest.src}
        onClick={() => setExpanded(true)}
        className={clsx(size === 'md' ? 'max-h-[400px]' : 'h-[128px]')}
      />
      <MediaModal url={rest.src} open={expanded} setOpen={setExpanded} />
    </>
  )
}
