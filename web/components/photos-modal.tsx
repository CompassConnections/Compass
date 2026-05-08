import {Profile} from 'common/profiles/profile'
import {User} from 'common/user'
import {useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Modal} from 'web/components/layout/modal'
import {ShareProfileButtons} from 'web/components/widgets/share-profile-button'
import {useT} from 'web/lib/locale'

import {ProfileCardViewer} from './profile-card-viewer'

// export const PhotosModal = (props: {
//   open: boolean
//   setOpen: (open: boolean) => void
//   photos: string[]
// }) => {
//   const {open, setOpen, photos} = props
//   const [index, setIndex] = useState(0)
//   useEffect(() => {
//     if (!open) setTimeout(() => setIndex(0), 100)
//   }, [open])
//   return (
//     <Modal open={open} size={'xl'} setOpen={setOpen}>
//       <Col className={MODAL_CLASS}>
//         <Image
//           src={photos[index]}
//           width={500}
//           height={700}
//           alt={`preview ${index}`}
//           className="h-full w-full rounded-sm object-cover"
//         />
//         <Row className={'gap-2'}>
//           <Button onClick={() => setIndex(index - 1)} disabled={index === 0}>
//             Previous
//           </Button>
//           <Button onClick={() => setIndex(index + 1)} disabled={index === photos.length - 1}>
//             Next
//           </Button>
//         </Row>
//       </Col>
//     </Modal>
//   )
// }
//
// export const ExpandablePhoto = (props: {src: string; width?: number; height?: number}) => {
//   const {src, width = 1000, height = 1000} = props
//   const [open, setOpen] = useState<boolean>(false)
//   return (
//     <div className="">
//       <Image
//         src={src}
//         width={width}
//         height={height}
//         alt=""
//         className="cursor-pointer object-cover rounded-2xl"
//         onClick={() => setOpen(true)}
//       />
//       <Modal open={open} setOpen={setOpen} size={'xl'}>
//         <Image src={src} width={1000} height={1000} alt="" className={'rounded-2xl'} />
//       </Modal>
//     </div>
//   )
// }

export const ViewProfileCardButton = (props: {
  user: User
  profile: Profile
  width?: number
  height?: number
}) => {
  const {user, profile, width, height} = props
  const [open, setOpen] = useState<boolean>(false)
  const t = useT()
  if (!user || !profile) return
  const username = user.username
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border-canvas-300 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-ink-500 transition-colors hover:border-primary-400 hover:bg-primary-50"
        style={{
          fontSize: '13.5px',
        }}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-3.5 w-3.5 hidden sm:block"
        >
          <rect x="2.5" y="5" width="15" height="11" rx="2" />
          <path d="M2.5 9h15" />
        </svg>
        {t('share_profile.view_profile_card', 'Profile Card')}
      </button>
      <Modal open={open} setOpen={setOpen} size={'lg'} className={''}>
        <Col className="gap-4 bg-canvas-100/75 rounded-2xl justify-center">
          <ProfileCardViewer user={user} profile={profile} width={width} height={height} />
          <ShareProfileButtons
            username={username}
            className={'justify-center gap-4 text-3xl pb-4'}
            buttonClassName={'hover:bg-canvas-200'}
          />
        </Col>
      </Modal>
    </>
  )
}
