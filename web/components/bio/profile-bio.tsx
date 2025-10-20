import {Profile} from 'common/love/profile'
import {useEffect, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Subtitle} from '../widgets/profile-subtitle'
import {BioBlock} from './profile-bio-block'
import {MAX_INT, MIN_BIO_LENGTH} from "common/constants";
import {useTextEditor} from "web/components/widgets/editor";
import {JSONContent} from "@tiptap/core"

export function ProfileBio(props: {
  isCurrentUser: boolean
  profile: Profile
  refreshProfile: () => void
  fromProfilePage?: Profile
}) {
  const {isCurrentUser, profile, refreshProfile, fromProfilePage} = props
  const [edit, setEdit] = useState(false)

  if (!isCurrentUser && !profile.bio) return null
  if (fromProfilePage && !profile.bio) return null

  const editor = useTextEditor({defaultValue: ''})
  const [textLength, setTextLength] = useState(editor?.getText().length ?? MAX_INT)

  useEffect(() => {
    if (!editor) return
    editor.commands.setContent(profile.bio as JSONContent)
    setTextLength(editor.getText().length)
  }, [profile.bio, editor])

  return (
    <Col>
      {textLength < MIN_BIO_LENGTH && !edit && (
        <div className="group relative inline-block">
          <p className="text-red-600 cursor-help flex items-center gap-1">
            Bio too short. Profile may be filtered from search results.
            <span className="text-xs border border-red-600 rounded px-1 animate-pulse">
              Hover for details
            </span>
          </p>
          <div
            className="invisible group-hover:visible absolute left-0 top-full mt-2 p-3 bg-canvas-50 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-72 z-10">
            <p className="text-sm">
              Since your bio is too short, Compass' algorithm filters out your profile from search results (unless
              "Include short bios" is selected). This ensures searches show meaningful profiles.
            </p>
          </div>
        </div>
      )}
      <Subtitle className="mb-4">About Me</Subtitle>
      <BioBlock
        isCurrentUser={isCurrentUser}
        profile={profile}
        refreshProfile={refreshProfile}
        edit={edit || (isCurrentUser && !profile.bio)}
        setEdit={setEdit}
      />
    </Col>
  )
}
