import {Section} from '@react-email/components'
import {DOMAIN} from 'common/envs/constants'
import {type User} from 'common/user'
import {Actions, CTAButton, EmailShell, Eyebrow, Heading, Lead, Quote} from 'email/utils'
import React from 'react'
import {createT} from 'shared/locale'

import {jamesUser, mockUser} from './functions/mock'

interface NewEndorsementEmailProps {
  fromUser: User
  onUser: User
  endorsementText: string
  unsubscribeUrl: string
  email?: string
  locale?: string
}

export const NewEndorsementEmail = ({
  fromUser,
  onUser,
  endorsementText,
  unsubscribeUrl,
  email,
  locale,
}: NewEndorsementEmailProps) => {
  const name = onUser.name.split(' ')[0]
  const t = createT(locale)

  const endorsementUrl = `https://${DOMAIN}/${onUser.username}`

  return (
    <EmailShell
      preview={t('email.new_endorsement.preview', 'New endorsement from {fromUserName}', {
        fromUserName: fromUser.name,
      })}
      unsubscribeUrl={unsubscribeUrl}
      email={email ?? name}
      locale={locale}
    >
      <Section style={{textAlign: 'center'}}>
        <Eyebrow>{t('email.new_endorsement.badge', 'New endorsement')}</Eyebrow>
      </Section>

      <Heading style={{margin: '18px 0 12px 0'}}>
        {t('email.new_endorsement.greeting', 'Hi {name},', {name})}
      </Heading>

      <Lead>
        {t('email.new_endorsement.message', '{fromUserName} endorsed you!', {
          fromUserName: fromUser.name,
        })}
      </Lead>

      {/* Was a bordered quote box inside a bordered card. The endorsement is the only thing on this
          page that is somebody else's voice, and a rule says that more quietly than two rectangles do. */}
      <Quote>“{endorsementText}”</Quote>

      <Actions>
        <CTAButton href={endorsementUrl}>
          {t('email.new_endorsement.viewButton', 'View endorsement')}
        </CTAButton>
      </Actions>
    </EmailShell>
  )
}

NewEndorsementEmail.PreviewProps = {
  fromUser: jamesUser,
  onUser: mockUser,
  endorsementText:
    "Martin is someone you want to have around because he injects creativity and humor into every conversation, and his laugh is infectious! Not to mention that he's a great employee, treats everyone with respect, and is even-tempered.",
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
  email: 'someone@gmail.com',
} as NewEndorsementEmailProps

// const endorsementContainer = {
//   margin: '20px 0',
//   padding: '15px',
//   backgroundColor: '#f9f9f9',
//   borderRadius: '8px',
// }
//
// const endorsementTextStyle = {
//   fontSize: '16px',
//   lineHeight: '22px',
//   fontStyle: 'italic',
//   color: '#333333',
// }

export default NewEndorsementEmail
