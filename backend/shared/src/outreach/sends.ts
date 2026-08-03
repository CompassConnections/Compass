import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'

/** Mirrors the CHECK constraint in `20260803_add_outreach_sends.sql`. */
export const OUTREACH_SEND_KINDS = ['city_number', 'empty_room'] as const

export type OutreachSendKind = (typeof OUTREACH_SEND_KINDS)[number]

/**
 * Record that an automated message reached a member.
 *
 * Relies on the unique index rather than a prior read, so two concurrent runs of the same job cannot
 * both decide a member has not been written to yet. Returns whether this call is the one that actually
 * inserted — callers should send only when it did.
 */
export const recordOutreachSend = async (
  userId: string,
  kind: OutreachSendKind,
  context: Record<string, unknown> = {},
  pg?: SupabaseDirectClient,
): Promise<boolean> => {
  pg = pg ?? createSupabaseDirectClient()
  const row = await pg.oneOrNone<{id: string}>(
    `insert into outreach_sends (user_id, kind, context)
     values ($1, $2, $3)
     on conflict do nothing
     returning id`,
    [userId, kind, context],
  )
  return row !== null
}

export const hasOutreachSend = async (
  userId: string,
  kind: OutreachSendKind,
  pg?: SupabaseDirectClient,
): Promise<boolean> => {
  pg = pg ?? createSupabaseDirectClient()
  const row = await pg.oneOrNone<{exists: boolean}>(
    `select true as exists from outreach_sends where user_id = $1 and kind = $2 limit 1`,
    [userId, kind],
  )
  return row !== null
}
