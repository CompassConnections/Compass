import {useRouter} from 'next/router'
import {useEffect} from 'react'

import {useUser} from './use-user'

export const useRedirectIfSignedOut = (redirect?: string) => {
  const user = useUser()
  const router = useRouter()
  useEffect(() => {
    if (user !== null) return
    console.log(router, router.asPath)
    router.replace(`/signin?redirect=${redirect ?? router.asPath}`)
  }, [user])
}
