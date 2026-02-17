export function sqlMatch(sql: string) {
  // Normalize: collapse all whitespace to single spaces, trim
  // Then build a regex that tolerates any whitespace or line break in the real SQL.
  const escaped = sql.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim()
  return expect.stringMatching(new RegExp(escaped.replace(/\s+/g, '\\s+')))
}
