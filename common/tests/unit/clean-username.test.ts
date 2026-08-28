import {cleanDisplayName, cleanUsername, impersonatesStaff} from 'common/util/clean-username'

/**
 * These two functions are what stand between an ordinary account and one that can pass itself off as
 * staff. The admin badge (`AdminBadge` in web/components/widgets/user-link.tsx) is keyed off the user
 * id, so it cannot be granted by editing a profile — the remaining attack is to make the *name* look
 * like a badge, which is what these assertions close off.
 */

// Written as escapes on purpose: every one of these is invisible or near-invisible in an editor, and
// a test whose input you cannot see is a test nobody can check.
const ZWSP = '\u200B'
const ZWJ = '\u200D'
const VS16 = '\uFE0F'
const RLO = '\u202E' // right-to-left override
const PDF = '\u202C' // pop directional formatting

describe('cleanDisplayName', () => {
  it('keeps an ordinary name intact', () => {
    expect(cleanDisplayName('Martin Braquet')).toBe('Martin Braquet')
    expect(cleanDisplayName('Zoë Ó Súilleabháin')).toBe('Zoë Ó Súilleabháin')
    expect(cleanDisplayName('  Ann   Lee ')).toBe('Ann Lee')
    expect(cleanDisplayName('Jean-Luc O’Brien')).toBe('Jean-Luc O’Brien')
  })

  it('keeps names written in other scripts', () => {
    expect(cleanDisplayName('田中 太郎')).toBe('田中 太郎')
    expect(cleanDisplayName('Ольга')).toBe('Ольга')
  })

  it('strips the glyphs a name could use to paint a badge', () => {
    expect(cleanDisplayName('Martin \u{1F6E1}' + VS16)).toBe('Martin')
    expect(cleanDisplayName('Martin ✅')).toBe('Martin')
    expect(cleanDisplayName('Martin ✔ ☑ ✓')).toBe('Martin')
    expect(cleanDisplayName('Martin ★')).toBe('Martin')
    // Emoji built from a zero-width joiner, which has to go too or the pieces recombine.
    expect(cleanDisplayName('Martin \u{1F468}' + ZWJ + '\u{1F4BB}')).toBe('Martin')
    // Regional indicators — a flag is two of them.
    expect(cleanDisplayName('Martin \u{1F1EB}\u{1F1F7}')).toBe('Martin')
  })

  it('strips invisible characters that can reorder or pad a name', () => {
    // A bidi override renders the run after it backwards, so this displays as "Martin admin".
    expect(cleanDisplayName('Martin ' + RLO + 'nimda' + PDF)).toBe('Martin nimda')
    expect(cleanDisplayName('Mar' + ZWSP + 'tin')).toBe('Martin')
  })

  it('folds newlines and tabs into single spaces rather than joining words', () => {
    expect(cleanDisplayName('Ann\nLee')).toBe('Ann Lee')
    expect(cleanDisplayName('Ann\tLee')).toBe('Ann Lee')
  })

  it('can empty a name made only of emoji, which callers have to handle', () => {
    expect(cleanDisplayName('\u{1F6E1}' + VS16 + '✅')).toBe('')
  })

  it('still truncates to the max length', () => {
    expect(cleanDisplayName('a'.repeat(40))).toHaveLength(30)
  })
})

describe('impersonatesStaff', () => {
  it('catches names claiming to be staff', () => {
    expect(impersonatesStaff('Admin')).toBe(true)
    expect(impersonatesStaff('compass admin')).toBe(true)
    expect(impersonatesStaff('Martin (Administrator)')).toBe(true)
    expect(impersonatesStaff('Moderator Martin')).toBe(true)
    expect(impersonatesStaff('Compass Support')).toBe(true)
    expect(impersonatesStaff('CompassTeam')).toBe(true)
  })

  it('sees through the tricks that beat a plain substring check', () => {
    expect(impersonatesStaff('ÁDMIN')).toBe(true)
    // A zero-width space inside the word: cleaned away before the word boundary is tested.
    expect(impersonatesStaff('ad' + ZWSP + 'min')).toBe(true)
    expect(impersonatesStaff('\u{1F6E1}' + VS16 + ' Admin')).toBe(true)
  })

  it('leaves real names alone', () => {
    expect(impersonatesStaff('Martin Braquet')).toBe(false)
    expect(impersonatesStaff('Modesty Blaise')).toBe(false)
    expect(impersonatesStaff('Adminah Cole')).toBe(false)
    expect(impersonatesStaff('Compass Lee')).toBe(false)
  })
})

describe('cleanUsername', () => {
  it('is unaffected by the display-name rules', () => {
    expect(cleanUsername('Martin Braquet')).toBe('MartinBraquet')
    expect(cleanUsername('zoë_1')).toBe('zoe_1')
  })
})
