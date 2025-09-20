import {readFileSync} from "fs";
import {ENV_CONFIG} from "common/envs/constants";

export const getServiceAccountCredentials = () => {
  let keyPath = ENV_CONFIG.googleApplicationCredentials
  if (keyPath == null) {
    throw new Error(
      `Please set the GOOGLE_APPLICATION_CREDENTIALS environment variable to contain the path to your key file.`
    )
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