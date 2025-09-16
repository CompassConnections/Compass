import {useEffect} from 'react'
import {Title} from 'web/components/widgets/title'
import {Col} from 'web/components/layout/col'
import clsx from 'clsx'
import {Input} from 'web/components/widgets/input'
import {Row} from 'web/components/layout/row'
import {Button} from 'web/components/buttons/button'
import {labelClassName} from 'web/pages/signup'
import {User} from 'common/user'
import {useEditableUserInfo} from 'web/hooks/use-editable-user-info'
import {LoadingIndicator} from 'web/components/widgets/loading-indicator'
import {Column} from 'common/supabase/utils'
import {LoverRow} from 'common/love/lover'
import {SignupBio} from "web/components/bio/editable-bio";
import {JSONContent} from "@tiptap/core";

export const initialRequiredState = {
  age: undefined,
  gender: '',
  pref_gender: [],
  pref_age_min: undefined,
  pref_age_max: undefined,
  pref_relation_styles: [],
  wants_kids_strength: -1,
  looking_for_matches: true,
  messaging_status: 'open',
  visibility: 'member',
  city: '',
  pinned_url: '',
  photo_urls: [],
  bio: null,
}

// const requiredKeys = Object.keys(
//   initialRequiredState
// ) as (keyof typeof initialRequiredState)[]

export const RequiredLoveUserForm = (props: {
  user: User
  // TODO thread this properly instead of this jank
  setEditUsername?: (name: string) => unknown
  setEditDisplayName?: (name: string) => unknown
  lover: LoverRow
  setLover: <K extends Column<'lovers'>>(key: K, value: LoverRow[K] | undefined) => void
  isSubmitting: boolean
  onSubmit?: () => void
  loverCreatedAlready?: boolean
}) => {
  const {user, onSubmit, loverCreatedAlready, setLover, lover, isSubmitting} = props
  const {updateUsername, updateDisplayName, userInfo, updateUserState} = useEditableUserInfo(user)

  const {
    name,
    username,
    errorUsername,
    loadingUsername,
    loadingName,
    errorName,
  } = userInfo

  useEffect(() => {
    props.setEditUsername && props.setEditUsername(username)
  }, [username])
  useEffect(() => {
    props.setEditDisplayName && props.setEditDisplayName(name)
  }, [name])

  const canContinue = true
  // const canContinue =
  //   (!lover.looking_for_matches ||
  //     requiredKeys
  //       .map((k) => lover[k])
  //       .every((v) =>
  //         typeof v == 'string'
  //           ? v !== ''
  //           : Array.isArray(v)
  //           ? v.length > 0
  //           : v !== undefined
  //       )) &&
  //   !loadingUsername &&
  //   !loadingName

  return (
    <>
      <Title>The Basics</Title>
      {!loverCreatedAlready && <div className="text-ink-500 mb-6 text-lg">No endless forms—write your own bio, your own way.</div>}
      <Col className={'gap-8'}>
        <Col>
          <label className={clsx(labelClassName)}>Display name</label>
          <Row className={'items-center gap-2'}>
            <Input
              disabled={loadingName}
              type="text"
              placeholder="Display name"
              value={name}
              onChange={(e) => {
                updateUserState({name: e.target.value || ''})
              }}
              onBlur={updateDisplayName}
            />
            {loadingName && <LoadingIndicator className={'ml-2'}/>}
          </Row>
          {errorName && <span className="text-error text-sm">{errorName}</span>}
        </Col>

        {!loverCreatedAlready && <>
            <Col>
                <label className={clsx(labelClassName)}>Username</label>
                <Row className={'items-center gap-2'}>
                    <Input
                        disabled={loadingUsername}
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => {
                          updateUserState({username: e.target.value || ''})
                        }}
                        onBlur={updateUsername}
                    />
                  {loadingUsername && <LoadingIndicator className={'ml-2'}/>}
                </Row>
              {errorUsername && (
                <span className="text-error text-sm">{errorUsername}</span>
              )}
            </Col>

            <Col>
                <label className={clsx(labelClassName)}>Bio</label>
                <SignupBio
                    onChange={(e: JSONContent) => {
                      console.log('bio changed', e, lover.bio)
                      setLover('bio', e)
                    }}
                />
            </Col>
        </>
        }

        {onSubmit && (
          <Row className={'justify-end'}>
            <Button
              disabled={!canContinue || isSubmitting}
              loading={isSubmitting}
              onClick={onSubmit}
            >
              Next
            </Button>
          </Row>
        )}
      </Col>
    </>
  )
}