import { APIHandler } from './helpers/endpoint'
import {git} from './../metadata.json'

export const health: APIHandler<'health'> = async (_, auth) => {
  return {
    message: 'Server is working.',
    uid: auth?.uid,
    git: git,
  }
}
