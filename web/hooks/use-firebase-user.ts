import {useContext} from 'react'
import {FirebaseUserContext} from 'web/components/auth-context'

export function useFirebaseUser() {
  return useContext(FirebaseUserContext)
}
