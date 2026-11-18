import {
  MAX_PARTING_DONATION_USD,
  parsePartingDonationAmount,
  partingDonationUrl,
} from 'common/deletion'

describe('parsePartingDonationAmount', () => {
  it('reads a whole number of dollars', () => {
    expect(parsePartingDonationAmount('75')).toBe(75)
    expect(parsePartingDonationAmount(' 20 ')).toBe(20)
  })

  it('rejects anything that is not a plain amount', () => {
    for (const raw of ['', '  ', '0', '-5', '12.5', '$30', 'abc', '1e3'])
      expect(parsePartingDonationAmount(raw)).toBeNull()
  })

  it('rejects an amount past the ceiling', () => {
    expect(parsePartingDonationAmount(String(MAX_PARTING_DONATION_USD))).toBe(
      MAX_PARTING_DONATION_USD,
    )
    expect(parsePartingDonationAmount(String(MAX_PARTING_DONATION_USD + 1))).toBeNull()
  })
})

describe('partingDonationUrl', () => {
  it('opens the contribution flow with the amount filled in', () => {
    expect(partingDonationUrl(50)).toBe(
      'https://opencollective.com/compass-connection/donate?amount=50',
    )
  })
})
