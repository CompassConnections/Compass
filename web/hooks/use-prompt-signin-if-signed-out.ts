import {useRouter} from 'next/router'
import {useEffect} from 'react'

import {useUser} from './use-user'

/**
 * Redirects to signin page with a prompt message if user is signed out.
 * This shows a friendly "Please sign in" message instead of silently redirecting.
 */
export const usePromptSigninIfSignedOut = (href?: string) => {
  const user = useUser()
  const router = useRouter()
  useEffect(() => {
    if (user !== null) return
    console.log(router, router.asPath)
    const redirect = href ?? router.asPath
    router.replace(`/signin?redirect=${redirect}`)
  }, [user])
}
