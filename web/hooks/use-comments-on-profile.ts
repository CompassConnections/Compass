import {db} from 'web/lib/supabase/db'
import {type Comment} from 'common/comment'
import {useApiSubscription} from './use-api-subscription'
import {useEffect, useState} from 'react'
import {uniqBy} from 'lodash'
import {convertComment} from 'common/supabase/comment'

export function useLiveCommentsOnProfile(userId: string) {
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    ;(async () => {
      for (let i = 0; i < 4; i++) {
        const data = await getComments(userId)
        if (data) {
          setComments(data)
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    })()
  }, [userId])

  useApiSubscription({
    topics: [`user/${userId}/comment`],
    onBroadcast: ({data}) => {
      if (data.comment)
        setComments((comments) => uniqBy([...comments, data.comment as Comment], 'id'))
    },
  })

  return comments
}

const getComments = async (userId: string) => {
  const {data, error} = await db.from('profile_comments').select('*').eq('on_user_id', userId)
  if (error) {
    console.error(error)
    return null
  }
  return data.map(convertComment)
}
