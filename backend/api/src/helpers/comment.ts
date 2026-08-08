import {type JSONContent} from '@tiptap/core'
import {APIErrors} from 'api/helpers/endpoint'
import {isSuspiciousId} from 'common/moderation/suspicious'
import {getUser} from 'shared/utils'

export const MAX_COMMENT_JSON_LENGTH = 20000

/**
 * Checks that apply to every comment regardless of what it's attached to: the author exists, isn't
 * banned or suspicious, and the payload isn't oversized. Target-specific checks (blocking on profile
 * comments, proposal status on vote comments) stay with their own handler.
 */
export const validateCommentAuthor = async (creatorId: string, content: JSONContent) => {
  const creator = await getUser(creatorId)

  if (!creator) throw APIErrors.unauthorized('Your account was not found')
  if (creator.isBannedFromPosting) throw APIErrors.forbidden('You are banned')
  if (isSuspiciousId(creator.id)) throw APIErrors.forbidden('Suspicious users cannot send messages')

  if (JSON.stringify(content).length > MAX_COMMENT_JSON_LENGTH) {
    throw APIErrors.badRequest(
      `Comment is too long; should be less than ${MAX_COMMENT_JSON_LENGTH} as a JSON string.`,
    )
  }
  return {content, creator}
}
