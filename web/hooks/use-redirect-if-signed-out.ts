import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUser } from './use-user'

export const useRedirectIfSignedOut = () => {
  const user = useUser()
  const router = useRouter()
  useEffect(() => {
    if (user !== null) return
    else router.replace('/')
  }, [user])
}
