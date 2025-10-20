// import clsx from 'clsx'
// import {Editor} from '@tiptap/react'
// import {useState} from 'react'
// import Link from 'next/link'
//
// import {MAX_COMMENT_LENGTH} from 'common/comment'
// import {Button} from 'web/components/buttons/button'
// import {Col} from 'web/components/layout/col'
// import {Modal, SCROLLABLE_MODAL_CLASS} from 'web/components/layout/modal'
// import {Row} from 'web/components/layout/row'
// import {useTextEditor} from 'web/components/widgets/editor'
// import {useUser} from 'web/hooks/use-user'
// import {CompatibleBadge} from './widgets/compatible-badge'
// import {ProfileProfile} from './profile/profile-profile'
// import {Pagination} from 'web/components/widgets/pagination'
// import {Title} from 'web/components/widgets/title'
// import {Input} from 'web/components/widgets/input'
//
// export const BrowseMatchesButton = (props: {
//   profile: Profile
//   potentialProfiles: Profile[]
//   compatibilityScores: Record<string, CompatibilityScore>
//   className?: string
// }) => {
//   const {profile, potentialProfiles, compatibilityScores, className} = props
//
//   const currentUser = useUser()
//   const isCurrentUser = currentUser?.id === profile.user_id
//
//   const [dialogOpen, setDialogOpen] = useState(false)
//   const key = `comment ${potentialProfiles.map((l) => l.id).join(',')}`
//   const editor = useTextEditor({
//     key,
//     size: 'sm',
//     max: MAX_COMMENT_LENGTH,
//     placeholder: 'Write your introduction...',
//   })
//
//   const [isSubmitting, _] = useState(false)
//
//   const submit = async () => {
//     // const introduction =
//     //   (editor?.getCharacterCount() ?? 0) > 0 ? editor?.getJSON() : undefined
//
//     // setIsSubmitting(true)
//     // const result = await createMatch({
//     //   userId1: profile.user_id,
//     //   userId2: selectedMatchId,
//     //   betAmount,
//     //   introduction,
//     // }).finally(() => {
//     //   setIsSubmitting(false)
//     // })
//     setDialogOpen(false)
//
//     // console.debug('result', result)
//
//     // if (result.success) {
//     //   window.location.reload()
//     // }
//   }
//   if (!profile.looking_for_matches)
//     return (
//       <div className="text-ink-500 text-sm">
//         Not looking for more matches right now
//       </div>
//     )
//
//   return (
//     <>
//       <Button
//         className={clsx(className)}
//         color="indigo"
//         onClick={() => setDialogOpen(true)}
//         disabled={isSubmitting}
//         loading={isSubmitting}
//       >
//         Browse {isCurrentUser ? 'your compatible' : `for ${profile.user.name}`}
//       </Button>
//       {dialogOpen && (
//         <BrowseMatchesDialog
//           profile={profile}
//           potentialProfiles={potentialProfiles}
//           compatibilityScores={compatibilityScores}
//           isSubmitting={isSubmitting}
//           setOpen={setDialogOpen}
//           submit={submit}
//           editor={editor}
//         />
//       )}
//     </>
//   )
// }
//
// const BrowseMatchesDialog = (props: {
//   profile: Profile
//   potentialProfiles: Profile[]
//   compatibilityScores: Record<string, CompatibilityScore>
//   isSubmitting: boolean
//   setOpen: (open: boolean) => void
//   submit: () => void
//   editor: Editor | null
// }) => {
//   const {
//     profile,
//     potentialProfiles,
//     compatibilityScores,
//     setOpen,
//   } = props
//
//   const [query, setQuery] = useState('')
//   // const [error, setError] = useState<string | undefined>(undefined)
//
//   const currentUser = useUser()
//   const isCurrentUser = currentUser?.id === profile.user_id
//
//   const filteredProfiles = potentialProfiles.filter((profile) =>
//     profile.user.name.toLowerCase().includes(query.toLowerCase())
//   )
//   const [potentialIndex, setPotentialIndex] = useState(0)
//   const index = Math.min(potentialIndex, filteredProfiles.length - 1)
//   const potentialProfile = filteredProfiles[index]
//
//   const compatibility = potentialProfile
//     ? compatibilityScores[potentialProfile.user_id]
//     : undefined
//
//   return (
//     <Modal
//       className={clsx(SCROLLABLE_MODAL_CLASS, '!min-h-full')}
//       size="lg"
//       open
//       setOpen={setOpen}
//     >
//       <Col className="bg-canvas-0 min-h-full gap-2 rounded p-4 pb-8">
//         <Row className="justify-between">
//           <Title className="!mb-0">
//             Browse {!isCurrentUser && `for ${profile.user.name}`}
//           </Title>
//           <Input
//             className={'!h-10 max-w-[200px] self-end text-sm'}
//             value={query}
//             placeholder={'Search name'}
//             onChange={(e) => {
//               setQuery(e.target.value)
//             }}
//           />
//         </Row>
//         {filteredProfiles.length === 0 ? (
//           <Col className="gap-4">
//             <div>No remaining compatible matches.</div>
//             <Link href="/referrals">
//               <Button color="indigo">Refer friends</Button>
//             </Link>
//           </Col>
//         ) : (
//           <Pagination
//             className="self-start"
//             page={index}
//             setPage={setPotentialIndex}
//             totalItems={filteredProfiles.length}
//             pageSize={1}
//           />
//         )}
//
//         {potentialProfile && (
//           <>
//             <CompatibilityScoreDisplay compatibility={compatibility}/>
//             <ProfileProfile
//               profile={potentialProfile}
//               user={potentialProfile.user}
//               refreshProfile={() => window.location.reload()}
//               fromProfilePage={profile}
//             />
//
//             {/* <Col key={profile.id} className={clsx('gap-4 px-3 py-2')}>
//               <CommentInputTextArea
//                 isSubmitting={isSubmitting}
//                 editor={editor}
//                 user={user}
//                 hideToolbar={true}
//               />
//
//               <Button
//                 className="font-semibold"
//                 color="green"
//                 onClick={() => submit()}
//                 disabled={
//                   !selectedMatchId ||
//                   isSubmitting ||
//                   !betAmount ||
//                   betAmount < MIN_BET_AMOUNT_FOR_NEW_MATCH
//                 }
//                 loading={isSubmitting}
//               >
//                 Submit match
//               </Button>
//             </Col> */}
//           </>
//         )}
//       </Col>
//     </Modal>
//   )
// }
//
// function CompatibilityScoreDisplay(props: {
//   compatibility: CompatibilityScore | undefined
// }) {
//   const {compatibility} = props
//
//   if (!compatibility) return null
//
//   const lowConfidence = compatibility.confidence === 'low'
//
//   return (
//     <Row className="text-ink-600 items-center gap-1">
//       <CompatibleBadge
//         className="text-primary-600 self-end font-semibold"
//         compatibility={compatibility}
//       />
//       compatible
//       {lowConfidence && ' (low confidence)'}
//     </Row>
//   )
// }
