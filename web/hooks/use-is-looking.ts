import { useProfile } from './use-lover'

export const useIsLooking = () => {
  const lover = useProfile()
  return !!(lover && lover.looking_for_matches)
}
