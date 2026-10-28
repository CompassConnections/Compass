import {AdminDonation} from 'common/donations'

/** A `donations` row joined to its donor on `users`. */
export type DonationQueryRow = {
  id: string
  user_id: string
  name: string
  username: string
  avatar_url: string | null
  amount_cents: number
  donated_at: string
  note: string | null
  admin_id: string | null
  created_time: string
}

/**
 * The join every admin read uses. `users.data` holds the display fields; the ids and amounts are
 * columns. Qualified throughout because both tables have `id`.
 */
export const DONATION_SELECT = `
  select d.id, d.user_id, u.name, u.username, u.data->>'avatarUrl' as avatar_url,
         d.amount_cents, d.donated_at, d.note, d.admin_id, d.created_time
  from donations d
  join users u on u.id = d.user_id`

export const toAdminDonation = (row: DonationQueryRow): AdminDonation => ({
  id: Number(row.id),
  userId: row.user_id,
  name: row.name,
  username: row.username,
  avatarUrl: row.avatar_url,
  amountCents: row.amount_cents,
  donatedAt: new Date(row.donated_at).toISOString(),
  note: row.note,
  adminId: row.admin_id,
  createdTime: new Date(row.created_time).toISOString(),
})
