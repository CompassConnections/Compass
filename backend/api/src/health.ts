import {git} from './../metadata.json'
import {version as pkgVersion} from './../package.json'
import {APIHandler} from './helpers/endpoint'

export const health: APIHandler<'health'> = async (_, auth) => {
  return {
    message: 'Server is working.',
    uid: auth?.uid,
    git: git,
    version: pkgVersion,
  }
}
