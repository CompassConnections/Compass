import {readFileSync} from "fs";
import {getStorage, Storage} from 'firebase-admin/storage'

import {ENV_CONFIG, getStorageBucketId} from "common/envs/constants";

export const getServiceAccountCredentials = () => {
  let keyPath = ENV_CONFIG.googleApplicationCredentials
  // console.log('Using GOOGLE_APPLICATION_CREDENTIALS:', keyPath)
  if (!keyPath) {
    // throw new Error(
    //   `Please set the GOOGLE_APPLICATION_CREDENTIALS environment variable to contain the path to your key file.`
    // )
    return {}
  }

  if (!keyPath.startsWith('/')) {
    // Make relative paths relative to the current file
    keyPath = __dirname + '/' + keyPath
    // console.log(keyPath)
  }

  try {
    return JSON.parse(readFileSync(keyPath, {encoding: 'utf8'}))
  } catch (e) {
    throw new Error(`Failed to load service account key from ${keyPath}: ${e}`)
  }
}

export function getBucket() {
  return getStorage().bucket(getStorageBucketId())
}


export type Bucket = ReturnType<InstanceType<typeof Storage>['bucket']>

export async function deleteUserFiles(username: string) {
  const path = `user-images/${username}`

  // Delete all files in the directory
  const bucket = getBucket()
  const [files] = await bucket.getFiles({prefix: path});

  if (files.length === 0) {
    console.log(`No files found in bucket for user ${username}`);
    return;
  }

  await Promise.all(files.map(file => file.delete()));
  console.log(`Deleted ${files.length} files for user ${username}`);

}