import {dollarsToCents, formatDonationAmount, sumPastYearCents} from 'common/donations'
import {DAY_MS} from 'common/util/time'

describe('sumPastYearCents', () => {
  const now = new Date('2026-10-28T12:00:00Z').getTime()
  const at = (daysAgo: number) => new Date(now - daysAgo * DAY_MS).toISOString()

  it('sums only donations inside the trailing 365 days', () => {
    const total = sumPastYearCents(
      [
        {amountCents: 1000, donatedAt: at(1)},
        {amountCents: 2500, donatedAt: at(364)},
        {amountCents: 9999, donatedAt: at(366)},
      ],
      now,
    )
    expect(total).toBe(3500)
  })

  it('is zero with nothing in the window', () => {
    expect(sumPastYearCents([], now)).toBe(0)
    expect(sumPastYearCents([{amountCents: 500, donatedAt: at(400)}], now)).toBe(0)
  })

  it('accepts Date objects as well as ISO strings', () => {
    expect(sumPastYearCents([{amountCents: 700, donatedAt: new Date(now - DAY_MS)}], now)).toBe(700)
  })
})

describe('dollarsToCents', () => {
  it('rounds to the nearest cent', () => {
    expect(dollarsToCents(50)).toBe(5000)
    expect(dollarsToCents(12.345)).toBe(1235)
    // 0.1 + 0.2 territory: the float must not leak into the stored integer.
    expect(dollarsToCents(1.1 * 3)).toBe(330)
  })
})

describe('formatDonationAmount', () => {
  it('drops the cents for whole-dollar amounts', () => {
    expect(formatDonationAmount(5000, 'en-US')).toBe('$50')
    expect(formatDonationAmount(125000, 'en-US')).toBe('$1,250')
  })

  it('keeps the cents otherwise', () => {
    expect(formatDonationAmount(1250, 'en-US')).toBe('$12.50')
  })
})
