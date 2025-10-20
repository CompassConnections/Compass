import {Profile} from 'common/profiles/profile'
import {useEffect, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Subtitle} from '../widgets/profile-subtitle'
import {BioBlock} from './profile-bio-block'
import {MAX_INT, MIN_BIO_LENGTH} from "common/constants";
import {useTextEditor} from "web/components/widgets/editor";
import {JSONContent} from "@tiptap/core"
import {flip, offset, shift, useFloating} from "@floating-ui/react-dom";

export default function TooShortBio() {
  const [open, setOpen] = useState(false);
  const {y, refs, strategy} = useFloating({
    placement: "bottom", // place below the trigger
    middleware: [
      offset(8), // small gap between ? and box
      flip(),
      shift({padding: 8}), // prevent viewport clipping
    ],
  });

  return (
    <p className="text-red-600">
      Bio too short. Profile may be filtered from search results.{" "}
      <span
        className="inline-flex align-middle"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        ref={refs.setReference}
      >
        <span
          className="cursor-help text-red-600 border border-red-600 rounded-full w-5 h-5 inline-flex items-center justify-center align-middle">
          ?
        </span>
      </span>

      {open && (
        <div
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: "50%",
            transform: `translateX(-50%)`,
          }}
          className="p-3 bg-canvas-50 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 transition-opacity w-72 max-w-[calc(100vw-1rem)] whitespace-normal break-words"
        >
          <p className="text-sm text-gray-800 dark:text-gray-100">
            Since your bio is too short, Compass' algorithm filters out your
            profile from search results (unless "Include short bios" is
            selected). This ensures searches show meaningful profiles.
          </p>
        </div>
      )}
    </p>
  );
}


export function ProfileBio(props: {
  isCurrentUser: boolean
  profile: Profile
  refreshProfile: () => void
  fromProfilePage?: Profile
}) {
  const {isCurrentUser, profile, refreshProfile, fromProfilePage} = props
  const [edit, setEdit] = useState(false)
  const editor = useTextEditor({defaultValue: ''})
  const [textLength, setTextLength] = useState(MAX_INT)

  useEffect(() => {
    if (!editor) return
    editor.commands.setContent(profile.bio as JSONContent)
    setTextLength(editor.getText().length)
  }, [profile.bio, editor])

  if (!isCurrentUser && !profile.bio) return null
  if (fromProfilePage && !profile.bio) return null

  return (
    <Col>
      {textLength < MIN_BIO_LENGTH && !edit && isCurrentUser && <TooShortBio/>}
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
