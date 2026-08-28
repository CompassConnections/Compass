export const cleanUsername = (name: string, maxLength = 25) => {
  // Test guidance: do not mock this method (pure, deterministic transformations with no side effects)
  return name
    .replace(/\s+/g, '')
    .normalize('NFD') // split an accented letter in the base letter and the accent
    .replace(/[̀-ͯ]/g, '') // remove all previously split accents
    .replace(/[^A-Za-z0-9_]/g, '') // remove all chars not letters, numbers and underscores
    .substring(0, maxLength)
}

/**
 * Characters that let a display name paint something that is not part of a name: emoji and other
 * pictographs (shields, check marks), symbol characters (checkmarks, stars, and the regional
 * indicators that build flags), the variation selectors and zero-width joiner that glue
 * multi-codepoint emoji together, private-use glyphs (a custom font renders them as anything at
 * all), and invisible control/format characters (a bidi override can reorder a name so it reads as
 * something else entirely).
 *
 * This is the write-side half of making the admin badge trustworthy: the badge itself is derived
 * from the user id (`isAdminUserId`) and never from anything an account holds, and stripping these
 * glyphs means a name cannot be dressed up to sit next to it as a convincing forgery either.
 */
const NON_NAME_GLYPHS =
  /[\p{Extended_Pictographic}\p{So}\p{Sk}\p{Co}\p{Cc}\p{Cf}\p{Me}\uFE0E\uFE0F]/gu

export const cleanDisplayName = (displayName: string, maxLength = 30) => {
  // Test guidance: do not mock this method (pure, deterministic transformations with no side effects)
  return (
    displayName
      // Whitespace first: newlines and tabs are control characters, so stripping glyphs before
      // folding them would join the words on either side ("Ann\nLee" -> "AnnLee").
      .replace(/\s+/g, ' ')
      .replace(NON_NAME_GLYPHS, '')
      // A stripped glyph leaves the spaces that surrounded it behind.
      .replace(/\s+/g, ' ')
      .substring(0, maxLength)
      .trim()
  )
}

// Words that would let a display name pass itself off as Compass staff. Matched as whole words so
// ordinary names survive ("Modesty", "Adminah"), and against the accent-stripped lowercase form so
// that "Admin" spelled with an accent cannot walk through. Runs on `cleanDisplayName` output rather
// than raw input: a zero-width space inside "ad<zwsp>min" would otherwise defeat the word boundary.
const STAFF_IMPERSONATION =
  /\b(admin|admins|administrator|administrators|moderator|moderators|compass ?(team|staff|support|official))\b/

export const impersonatesStaff = (displayName: string) =>
  STAFF_IMPERSONATION.test(
    cleanDisplayName(displayName).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
  )
