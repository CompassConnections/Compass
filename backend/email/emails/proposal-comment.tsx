import {Body, Button, Container, Head, Html, Preview, Section, Text} from '@react-email/components'
import {DOMAIN} from 'common/envs/constants'
import {type User} from 'common/user'
import {container, content, Footer, main} from 'email/utils'
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
    <Html>
      <Head />
      <Preview>
        {t('email.proposal_comment.preview', 'New discussion on "{proposalTitle}"', {
          proposalTitle,
        })}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <div style={{textAlign: 'center', marginBottom: '32px'}}>
              <Text
                style={{
                  fontSize: '28px',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: '500',
                  color: '#1e1a14',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em',
                  lineHeight: '1.1',
                }}
              >
                {t('email.proposal_comment.greeting', 'Hi {name},', {name})}
              </Text>
            </div>

            <Text
              style={{
                fontSize: '18px',
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: '500',
                color: '#1e1a14',
                marginBottom: '24px',
                letterSpacing: '0.01em',
                lineHeight: '1.3',
                textAlign: 'center',
              }}
            >
              {t(
                'email.proposal_comment.message',
                '{fromUserName} added to the discussion on "{proposalTitle}", which you voted on.',
                {fromUserName: fromUser.name, proposalTitle},
              )}
            </Text>

            <div
              style={{
                backgroundColor: '#f7f4ef',
                border: '1px solid #dee5b2',
                borderRadius: '14px',
                padding: '24px',
                margin: '24px 0',
                textAlign: 'center',
              }}
            >
              {stanceLabel && (
                <Text
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '12px',
                    fontWeight: '600',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#8a6a3e',
                    margin: '0 0 12px 0',
                  }}
                >
                  {stanceLabel}
                </Text>
              )}

              <div
                style={{
                  backgroundColor: '#faf3e9',
                  border: '1px solid #e8c99e',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  fontStyle: 'italic',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '17px',
                  lineHeight: '1.65',
                  color: '#1e1a14',
                }}
              >
                "{commentText}"
              </div>

              <Button
                href={proposalUrl}
                style={{
                  backgroundColor: '#c17f3e',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '15px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  textAlign: 'center' as const,
                  display: 'inline-block',
                  padding: '14px 32px',
                  margin: '0',
                  border: '1px solid #a6682e',
                }}
              >
                {t('email.proposal_comment.viewButton', 'Read the discussion')}
              </Button>
            </div>

            <Text
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: '#6b6257',
                textAlign: 'center',
                lineHeight: '1.6',
              }}
            >
              {t(
                'email.proposal_comment.change_vote',
                'You can change your vote at any time while voting is open.',
              )}
            </Text>
          </Section>

          <Footer unsubscribeUrl={unsubscribeUrl} email={email ?? name} locale={locale} />
        </Container>
      </Body>
    </Html>
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
