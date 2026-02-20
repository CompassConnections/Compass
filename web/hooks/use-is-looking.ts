import {useProfile} from './use-profile'

export const useIsLooking = () => {
  const profile = useProfile()
  return !!(profile && profile.looking_for_matches)
}
