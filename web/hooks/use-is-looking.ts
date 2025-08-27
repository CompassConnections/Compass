import { useLover } from './use-lover'

export const useIsLooking = () => {
  const lover = useLover()
  return !!(lover && lover.looking_for_matches)
}
