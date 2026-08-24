import {Section} from '@react-email/components'
import {DOMAIN} from 'common/envs/constants'
import {type User} from 'common/user'
import {Actions, CTAButton, EmailShell, Eyebrow, Heading, Lead, Muted, Quote} from 'email/utils'
import React from 'react'
import {createT} from 'shared/locale'

import {jamesUser, mockUser} from './functions/mock'

interface ProposalCommentEmailProps {
  fromUser: User
  toUser: User
  proposalId: number
  proposalTitle: string
  commentText: string
  // 'for' | 'against' | 'question' | undefined — shown as a one-word label above the quote so the
  // reader can tell a counter-argument from a supportive note before opening anything.
  stance?: string
  unsubscribeUrl: string
  email?: string
  locale?: string
}

export const ProposalCommentEmail = ({
  fromUser,
  toUser,
  proposalId,
  proposalTitle,
  commentText,
  stance,
  unsubscribeUrl,
  email,
  locale,
}: ProposalCommentEmailProps) => {
  const name = toUser.name.split(' ')[0]
  const t = createT(locale)

  const proposalUrl = `https://${DOMAIN}/vote/${proposalId}`

  const stanceLabel =
    stance === 'against'
      ? t('email.proposal_comment.stance_against', 'Argument against')
      : stance === 'for'
        ? t('email.proposal_comment.stance_for', 'Argument for')
        : stance === 'both'
          ? t('email.proposal_comment.stance_both', 'Cuts both ways')
          : stance === 'question'
            ? t('email.proposal_comment.stance_question', 'Question')
            : stance === 'answer'
              ? t('email.proposal_comment.stance_answer', 'Answer')
              : undefined

  return (
    <EmailShell
      preview={t('email.proposal_comment.preview', 'New discussion on "{proposalTitle}"', {
        proposalTitle,
      })}
      unsubscribeUrl={unsubscribeUrl}
      email={email ?? name}
      locale={locale}
    >
      <Section style={{textAlign: 'center'}}>
        <Eyebrow>{t('email.proposal_comment.badge', 'New discussion')}</Eyebrow>
      </Section>

      <Heading style={{margin: '18px 0 12px 0'}}>
        {t('email.proposal_comment.greeting', 'Hi {name},', {name})}
      </Heading>

      <Lead>
        {t(
          'email.proposal_comment.message',
          '{fromUserName} added to the discussion on "{proposalTitle}", which you voted on.',
          {fromUserName: fromUser.name, proposalTitle},
        )}
      </Lead>

      {/* The stance and the comment are one block, not two: the label is the quote's caption, so it sits
          on the rule rather than in a box of its own. This is the double box that used to be here — a
          bordered quote card inside a bordered container — collapsed into a single quoted passage. */}
      {stanceLabel && (
        <Section style={{textAlign: 'left', margin: '0 0 10px 0'}}>
          <Eyebrow>{stanceLabel}</Eyebrow>
        </Section>
      )}

      <Quote>“{commentText}”</Quote>

      <Actions>
        <CTAButton href={proposalUrl}>
          {t('email.proposal_comment.viewButton', 'Read the discussion')}
        </CTAButton>
      </Actions>

      <Muted style={{marginTop: '24px'}}>
        {t(
          'email.proposal_comment.change_vote',
          'You can change your vote at any time while voting is open.',
        )}
      </Muted>
    </EmailShell>
  )
}

ProposalCommentEmail.PreviewProps = {
  fromUser: jamesUser,
  toUser: mockUser,
  proposalId: 12,
  proposalTitle: 'Add the ability to rate other members',
  commentText:
    'Worth weighing the downside: a public rating turns every first conversation into a performance, and the people most likely to be rated badly are the ones already least confident about reaching out.',
  stance: 'against',
  unsubscribeUrl: 'https://compassmeet.com/unsubscribe',
  email: 'someone@gmail.com',
} as ProposalCommentEmailProps

export default ProposalCommentEmail
