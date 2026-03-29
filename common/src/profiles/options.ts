import {APIErrors} from 'common/api/utils'
import {OPTION_TABLES} from 'common/profiles/constants'

export function validateTable(table: 'interests' | 'causes' | 'work') {
  if (!OPTION_TABLES.includes(table)) throw APIErrors.badRequest('Invalid table')
}
