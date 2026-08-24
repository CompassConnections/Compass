import {
  evaluateReviewPrompt,
  isInstallEligible,
  REVIEW_BACKFILL_CUTOFF,
  REVIEW_PROMPT_BACKFILL_MIN_SESSIONS,
  REVIEW_PROMPT_COOLDOWN_DAYS,
  REVIEW_PROMPT_MAX_ATTEMPTS,
  REVIEW_PROMPT_MIN_DAYS_INSTALLED,
  REVIEW_PROMPT_MIN_SESSIONS,
  ReviewAccountFacts,
  ReviewMoment,
  storeReviewUrl,
} from 'common/reviews/prompt'

const NOW = new Date('2026-09-01T12:00:00Z')
const DAY_MS = 24 * 60 * 60 * 1000
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY_MS)

const facts = (overrides: Partial<ReviewAccountFacts> = {}): ReviewAccountFacts => ({
  attempts: 0,
  lastPromptedAt: null,
  recentlyUpset: false,
  hasRecentReply: false,
  hasPreCutoffEvidence: false,
  now: NOW,
  ...overrides,
})

const install = (overrides: Partial<{sessions: number; firstSeen: Date}> = {}) => ({
  sessions: REVIEW_PROMPT_MIN_SESSIONS,
  firstSeen: daysAgo(REVIEW_PROMPT_MIN_DAYS_INSTALLED),
  now: NOW,
  ...overrides,
})

describe('isInstallEligible', () => {
  it('accepts an install at exactly the thresholds', () => {
    expect(isInstallEligible('inbox', install())).toBe(true)
  })

  it('never fires in the first session', () => {
    expect(isInstallEligible('inbox', install({sessions: 1}))).toBe(false)
    expect(isInstallEligible('quiet', install({sessions: 1}))).toBe(false)
  })

  it('rejects an install below the session floor', () => {
    expect(isInstallEligible('inbox', install({sessions: REVIEW_PROMPT_MIN_SESSIONS - 1}))).toBe(
      false,
    )
  })

  it('lets backfill through on fewer sessions, since it only gets one shot', () => {
    const sessions = REVIEW_PROMPT_BACKFILL_MIN_SESSIONS
    expect(sessions).toBeLessThan(REVIEW_PROMPT_MIN_SESSIONS)
    expect(isInstallEligible('quiet', install({sessions}))).toBe(true)
    expect(isInstallEligible('inbox', install({sessions}))).toBe(false)
  })

  it('rejects an install younger than the minimum age, however many sessions it has', () => {
    expect(isInstallEligible('inbox', install({sessions: 20, firstSeen: daysAgo(1)}))).toBe(false)
  })
})

describe('evaluateReviewPrompt', () => {
  const moments: ReviewMoment[] = [
    'inbox',
    'testimonial-submitted',
    'profile-from-notification',
    'quiet',
  ]

  it('maps each moment to its trigger when the evidence is there', () => {
    expect(evaluateReviewPrompt('inbox', facts({hasRecentReply: true}))).toBe('got-reply')
    expect(evaluateReviewPrompt('testimonial-submitted', facts())).toBe('testimonial')
    expect(evaluateReviewPrompt('profile-from-notification', facts())).toBe('notification-profile')
    expect(evaluateReviewPrompt('quiet', facts({hasPreCutoffEvidence: true}))).toBe('backfill')
  })

  it('stays quiet on the inbox when nobody has written back', () => {
    expect(evaluateReviewPrompt('inbox', facts({hasRecentReply: false}))).toBeNull()
  })

  it('suppresses every moment for a member who is upset with us', () => {
    for (const moment of moments) {
      expect(
        evaluateReviewPrompt(
          moment,
          facts({recentlyUpset: true, hasRecentReply: true, hasPreCutoffEvidence: true}),
        ),
      ).toBeNull()
    }
  })

  it('stops at the lifetime cap', () => {
    const spent = facts({attempts: REVIEW_PROMPT_MAX_ATTEMPTS, hasRecentReply: true})
    expect(evaluateReviewPrompt('inbox', spent)).toBeNull()
    expect(
      evaluateReviewPrompt('inbox', {...spent, attempts: REVIEW_PROMPT_MAX_ATTEMPTS - 1}),
    ).toBe('got-reply')
  })

  it('holds the cooldown between attempts', () => {
    const inCooldown = facts({
      attempts: 1,
      hasRecentReply: true,
      lastPromptedAt: daysAgo(REVIEW_PROMPT_COOLDOWN_DAYS - 1),
    })
    expect(evaluateReviewPrompt('inbox', inCooldown)).toBeNull()
    expect(
      evaluateReviewPrompt('inbox', {
        ...inCooldown,
        lastPromptedAt: daysAgo(REVIEW_PROMPT_COOLDOWN_DAYS + 1),
      }),
    ).toBe('got-reply')
  })

  describe('backfill', () => {
    it('needs evidence from before the feature shipped', () => {
      expect(evaluateReviewPrompt('quiet', facts({hasPreCutoffEvidence: false}))).toBeNull()
    })

    it('is only for members the feature was too late for', () => {
      expect(
        evaluateReviewPrompt(
          'quiet',
          facts({
            attempts: 1,
            hasPreCutoffEvidence: true,
            lastPromptedAt: daysAgo(REVIEW_PROMPT_COOLDOWN_DAYS + 1),
          }),
        ),
      ).toBeNull()
    })

    it('has a cutoff in the past, or it would swallow the live triggers', () => {
      expect(REVIEW_BACKFILL_CUTOFF.getTime()).toBeLessThan(NOW.getTime())
    })
  })
})

describe('storeReviewUrl', () => {
  it('sends Android to the listing', () => {
    expect(storeReviewUrl('android')).toContain('play.google.com')
  })

  it('sends iOS to the write-review action, or nowhere while the listing is a placeholder', () => {
    const url = storeReviewUrl('ios')
    if (url !== null) expect(url).toContain('action=write-review')
  })
})
