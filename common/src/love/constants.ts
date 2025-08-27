import { isProd } from 'common/envs/is-prod'

export const manifoldLoveUserId = isProd()
  ? 'tRZZ6ihugZQLXPf6aPRneGpWLmz1'
  : 'RlXR2xa4EFfAzdCbSe45wkcdarh1'

export const MAX_COMPATIBILITY_QUESTION_LENGTH = 240
