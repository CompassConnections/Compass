import {IS_LOCAL} from 'common/hosting/constants'

const PUBLIC_TOPICS = [/^user\/[^/]+\/comment$/, /^vote\/[^/]+\/comment$/]

// One capture group: the member the topic belongs to.
const OWNED_TOPICS = [
  /^user\/([^/]+)$/,
  /^private-user\/([^/]+)$/,
  /^user-notifications\/([^/]+)$/,
  /^private-user-messages\/([^/]+)(?:\/typing)?$/,
]

// What the web hooks subscribe to while nobody is signed in. Nothing is ever broadcast on these.
const PLACEHOLDER_OWNERS = ['_', 'undefined']

const topicOwner = (topic: string) => {
  for (const pattern of OWNED_TOPICS) {
    const owner = topic.match(pattern)?.[1]
    if (owner) return owner
  }
  return undefined
}

/**
 * Whether a connection identified as `uid` may listen to `topic`. Closed by default: a new topic is
 * refused until it is listed above, so forgetting to classify one cannot make it public.
 */
export const canSubscribe = (topic: string, uid: string | undefined) => {
  if (topic === '*') return IS_LOCAL
  if (PUBLIC_TOPICS.some((pattern) => pattern.test(topic))) return true
  const owner = topicOwner(topic)
  return owner !== undefined && owner === uid
}

/** Whether a session is listening to a real member's private topic without being that member. */
export const holdsForeignTopic = (topics: Iterable<string>, uid: string | undefined) =>
  Array.from(topics).some((topic) => {
    const owner = topicOwner(topic)
    return owner !== undefined && owner !== uid && !PLACEHOLDER_OWNERS.includes(owner)
  })
