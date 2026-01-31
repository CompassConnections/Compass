import {Profile} from 'common/profiles/profile'
import {useEffect, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Subtitle} from '../widgets/profile-subtitle'
import {BioBlock} from './profile-bio-block'
import {MAX_INT, MIN_BIO_LENGTH} from "common/constants";
import {useTextEditor} from "web/components/widgets/editor";
import {JSONContent} from "@tiptap/core"
import {useT} from "web/lib/locale";
import {Tooltip} from "web/components/widgets/tooltip";
import {QuestionMarkCircleIcon} from "@heroicons/react/outline";

export default function TooShortBio() {
  const t = useT()
  const text = t('profile.bio.too_short_tooltip', "Since your bio is too short, Compass' algorithm filters out your profile from search results (unless \"Include incomplete profiles\" is selected). This ensures searches show meaningful profiles.");
  return (
    <p className="text-red-600">
      {t('profile.bio.too_short', "Bio too short. Profile may be filtered from search results.")}{" "}
      <span className="inline-flex align-middle">
          <Tooltip
            text={text}>
            <QuestionMarkCircleIcon className="w-5 h-5"/>
          </Tooltip>
        </span>
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
  const t = useT();

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
      <Subtitle className="mb-4">{t('profile.bio.about_me', 'About Me')}</Subtitle>
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
