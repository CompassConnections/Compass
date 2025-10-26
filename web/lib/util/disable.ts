import {track} from "web/lib/service/analytics";
import {updateProfile} from "web/lib/api";

export async function disableProfile(disabled: boolean) {
  track(`disable profile ${disabled ? 'on' : 'off'}`)
  await updateProfile({disabled: disabled})
}