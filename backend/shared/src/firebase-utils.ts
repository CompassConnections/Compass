import {ENV_CONFIG, getStorageBucketId} from 'common/envs/constants'
import {debug} from 'common/logger'
import {getStorage, Storage} from 'firebase-admin/storage'
import {readFileSync} from 'fs'

export const getServiceAccountCredentials = () => {
  let keyPath = ENV_CONFIG.googleApplicationCredentials
  // console.debug('Using GOOGLE_APPLICATION_CREDENTIALS:', keyPath)
  if (!keyPath) {
    // throw new Error(
    //   `Please set the GOOGLE_APPLICATION_CREDENTIALS environment variable to contain the path to your key file.`
    // )
    return {}
  }

  if (!keyPath.startsWith('/')) {
    // Make relative paths relative to the current file
    keyPath = __dirname + '/' + keyPath
    // console.debug(keyPath)
  }

  try {
    return JSON.parse(readFileSync(keyPath, {encoding: 'utf8'}))
  } catch (e) {
    if (!process.env.NEXT_PUBLIC_ISOLATED_ENV && !process.env.FIREBASE_AUTH_EMULATOR_HOST)
      throw new Error(`Failed to load service account key from ${keyPath}: ${e}`)
  }
}

export function getBucket() {
  return getStorage().bucket(getStorageBucketId())
}

export type Bucket = ReturnType<InstanceType<typeof Storage>['bucket']>

/**
 * Removes every object the account owns from the public bucket.
 *
 * Two prefixes, because uploads moved. Members' own uploads now land under `user-images/<uid>/`
 * (see `web/lib/firebase/storage.ts` — the storage rules can check a uid against the caller's token
 * and cannot check a username), which also happens to catch the generated avatar that
 * `generateAvatarUrl` writes to `user-images/<uid>.png`. The username prefix still holds every file
 * uploaded before that change, plus the images `rehostExternalImages` copies in on the server, so
 * both have to be swept or a deleted account leaves photos behind.
 */
export async function deleteUserFiles(username: string, userId: string) {
  const prefixes = [`user-images/${username}`, `user-images/${userId}`]

  // Delete all files in the directories
  const bucket = getBucket()
  const fileLists = await Promise.all(
    prefixes.map(async (prefix) => (await bucket.getFiles({prefix}))[0]),
  )
  const files = fileLists.flat()

  if (files.length === 0) {
    debug(`No files found in bucket for user ${username}`)
    return
  }

  await Promise.all(files.map((file) => file.delete()))
  debug(`Deleted ${files.length} files for user ${username}`)
}
