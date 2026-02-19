import {updateProfile} from 'web/lib/api'
import {track} from 'web/lib/service/analytics'

export async function disableProfile(disabled: boolean) {
  track(`disable profile ${disabled ? 'on' : 'off'}`)
  await updateProfile({disabled: disabled})
}
