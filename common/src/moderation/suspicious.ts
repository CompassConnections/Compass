// If used long-term, consider moving to a database (new user column or new table)
export const suspiciousIds = ['K5Y1nuQopYhvNpnycvKyoNQ1FaK2']

// Suspicious users are flagged in between legit and banned:
// They still have access to the app (including viewing profiles), but are not allowed to
// interact too heavily with people so as not to bother them (no DMs or endorsements)
// Mark a user as suspicious if they message too many people or if they get reported once
// (ban them if reported more than once)
export function isSuspiciousId(id: string) {
  return suspiciousIds.includes(id)
}
