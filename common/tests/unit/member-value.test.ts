import {
  bioCredit,
  getMemberValue,
  MEMBER_VALUE_CAPS,
  MEMBER_VALUE_PARTS,
  MEMBER_VALUE_WEIGHTS,
  MemberValueInput,
  recencyCredit,
  saturate,
} from 'common/member-value'

const nobody: MemberValueInput = {
  conversations: 0,
  initiated: 0,
  initiatedReplied: 0,
  charsSent: 0,
  inbound: 0,
  inboundReplied: 0,
  referrals: 0,
  referralsActive: 0,
  completeness: 0,
  bioLength: 0,
  daysSinceLastOnline: null,
  profileComments: 0,
  voteComments: 0,
  votesCast: 0,
  testimonials: 0,
  eventsCreated: 0,
  eventsAttended: 0,
  donatedCents: 0,
}

const everything: MemberValueInput = {
  conversations: 50,
  initiated: 30,
  initiatedReplied: 20,
  charsSent: 100_000,
  inbound: 10,
  inboundReplied: 10,
  referrals: 40,
  referralsActive: 20,
  completeness: 1,
  bioLength: 2000,
  daysSinceLastOnline: 0,
  profileComments: 10,
  voteComments: 10,
  votesCast: 10,
  testimonials: 2,
  eventsCreated: 3,
  eventsAttended: 5,
  donatedCents: 50_000,
}

describe('getMemberValue', () => {
  it('weights sum to 100', () => {
    expect(Object.values(MEMBER_VALUE_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100)
  })

  it('scores a blank member at 0 and a saturated one at 100', () => {
    expect(getMemberValue(nobody).score).toBe(0)
    expect(getMemberValue(everything).score).toBeCloseTo(100, 6)
  })

  it('keeps every part within its weight', () => {
    const {parts} = getMemberValue(everything)
    for (const part of MEMBER_VALUE_PARTS) {
      expect(parts[part]).toBeLessThanOrEqual(MEMBER_VALUE_WEIGHTS[part] + 1e-9)
      expect(parts[part]).toBeGreaterThanOrEqual(0)
    }
  })

  it('values a two-sided conversation above the same effort unanswered', () => {
    const answered = getMemberValue({
      ...nobody,
      conversations: 1,
      initiated: 1,
      initiatedReplied: 1,
    })
    const ignored = getMemberValue({...nobody, conversations: 0, initiated: 1, initiatedReplied: 0})
    expect(answered.score).toBeGreaterThan(ignored.score)
    expect(ignored.score).toBe(0)
  })

  it('does not trust a perfect reply rate off a single inbound thread', () => {
    const one = getMemberValue({...nobody, inbound: 1, inboundReplied: 1})
    const three = getMemberValue({
      ...nobody,
      inbound: MEMBER_VALUE_CAPS.inboundForFullTrust,
      inboundReplied: MEMBER_VALUE_CAPS.inboundForFullTrust,
    })
    expect(one.parts.responsiveness).toBeCloseTo(MEMBER_VALUE_WEIGHTS.responsiveness / 3, 6)
    expect(three.parts.responsiveness).toBeCloseTo(MEMBER_VALUE_WEIGHTS.responsiveness, 6)
  })

  it('gives extra credit when a referral goes on to write to someone', () => {
    const passive = getMemberValue({...nobody, referrals: 3})
    const active = getMemberValue({...nobody, referrals: 3, referralsActive: 3})
    expect(active.parts.referrals).toBeGreaterThan(passive.parts.referrals)
  })

  it('reaches full profile credit at a 1,000-character bio', () => {
    const short = getMemberValue({...nobody, completeness: 1, bioLength: 999})
    const full = getMemberValue({...nobody, completeness: 1, bioLength: 1000})
    expect(full.parts.profile).toBeCloseTo(MEMBER_VALUE_WEIGHTS.profile, 6)
    expect(short.parts.profile).toBeLessThan(full.parts.profile)
  })
})

describe('saturate', () => {
  it('is 0 at 0, 1 at the cap, concave in between, and never above 1', () => {
    expect(saturate(0, 10)).toBe(0)
    expect(saturate(10, 10)).toBe(1)
    expect(saturate(100, 10)).toBe(1)
    const first = saturate(1, 10)
    const second = saturate(2, 10) - first
    expect(first).toBeGreaterThan(second)
  })
})

describe('credits', () => {
  it('steps bio credit at the search floor, the message floor and the full bio', () => {
    expect(bioCredit(0)).toBe(0)
    expect(bioCredit(199)).toBe(0)
    expect(bioCredit(200)).toBe(0.3)
    expect(bioCredit(500)).toBe(0.6)
    expect(bioCredit(1000)).toBe(1)
  })

  it('decays recency by week, month, quarter, year', () => {
    expect(recencyCredit(null)).toBe(0)
    expect(recencyCredit(0)).toBe(1)
    expect(recencyCredit(7)).toBe(1)
    expect(recencyCredit(8)).toBe(0.75)
    expect(recencyCredit(31)).toBe(0.4)
    expect(recencyCredit(91)).toBe(0.15)
    expect(recencyCredit(366)).toBe(0)
  })
})
