import {
  evaluateSharePrompt,
  isShareInstallEligible,
  SHARE_PROMPT_COOLDOWN_DAYS,
  SHARE_PROMPT_MAX_ATTEMPTS,
  SHARE_PROMPT_MIN_SESSIONS,
  ShareAccountFacts,
} from 'common/share/prompt'

const NOW = new Date('2026-09-28T12:00:00Z')
const DAY_MS = 24 * 60 * 60 * 1000
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY_MS)

const facts = (overrides: Partial<ShareAccountFacts> = {}): ShareAccountFacts => ({
  attempts: 0,
  lastPromptedAt: null,
  suppressed: false,
  hasRecentReply: false,
  testimonialRating: undefined,
  hasAnyEvidence: false,
  now: NOW,
  ...overrides,
})

describe('isShareInstallEligible', () => {
  it('waits for the session floor', () => {
    expect(isShareInstallEligible(SHARE_PROMPT_MIN_SESSIONS - 1)).toBe(false)
    expect(isShareInstallEligible(SHARE_PROMPT_MIN_SESSIONS)).toBe(true)
  })
})

describe('evaluateSharePrompt', () => {
  it('maps a conversation exit with a recent reply to got-reply', () => {
    expect(evaluateSharePrompt('conversation-exit', facts({hasRecentReply: true}))).toBe(
      'got-reply',
    )
    expect(evaluateSharePrompt('conversation-exit', facts())).toBeNull()
  })

  it('asks after a happy or unrated testimonial only', () => {
    const at = (rating: number | null | undefined) =>
      evaluateSharePrompt('testimonial-submitted', facts({testimonialRating: rating}))
    expect(at(5)).toBe('testimonial')
    expect(at(4)).toBe('testimonial')
    expect(at(null)).toBe('testimonial')
    expect(at(3)).toBeNull()
    expect(at(1)).toBeNull()
    expect(at(undefined)).toBeNull()
  })

  it('catches up established members once', () => {
    expect(evaluateSharePrompt('quiet', facts({hasAnyEvidence: true}))).toBe('established')
    expect(evaluateSharePrompt('quiet', facts())).toBeNull()
    expect(
      evaluateSharePrompt(
        'quiet',
        facts({hasAnyEvidence: true, attempts: 1, lastPromptedAt: daysAgo(365)}),
      ),
    ).toBeNull()
  })

  it('holds the cooldown', () => {
    const recent = facts({
      hasRecentReply: true,
      attempts: 1,
      lastPromptedAt: daysAgo(SHARE_PROMPT_COOLDOWN_DAYS - 1),
    })
    expect(evaluateSharePrompt('conversation-exit', recent)).toBeNull()

    const expired = {...recent, lastPromptedAt: daysAgo(SHARE_PROMPT_COOLDOWN_DAYS)}
    expect(evaluateSharePrompt('conversation-exit', expired)).toBe('got-reply')
  })

  it('stops at the lifetime cap', () => {
    expect(
      evaluateSharePrompt(
        'conversation-exit',
        facts({
          hasRecentReply: true,
          attempts: SHARE_PROMPT_MAX_ATTEMPTS,
          lastPromptedAt: daysAgo(365),
        }),
      ),
    ).toBeNull()
  })

  it('never asks a suppressed member', () => {
    expect(
      evaluateSharePrompt('conversation-exit', facts({hasRecentReply: true, suppressed: true})),
    ).toBeNull()
    expect(
      evaluateSharePrompt('testimonial-submitted', facts({testimonialRating: 5, suppressed: true})),
    ).toBeNull()
  })
})
