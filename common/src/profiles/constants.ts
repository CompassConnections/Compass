import {IS_PROD} from 'common/envs/constants'

export const compassUserId = IS_PROD
  ? 'tRZZ6ihugZQLXPf6aPRneGpWLmz1'
  : 'RlXR2xa4EFfAzdCbSe45wkcdarh1'

export const MAX_COMPATIBILITY_QUESTION_LENGTH = 240

export const OPTION_TABLES = ['interests', 'causes', 'work'] as const
export type OptionTableKey = (typeof OPTION_TABLES)[number]
