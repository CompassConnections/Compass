import {useState} from 'react'
import {useLiveRegion} from 'web/components/live-region'

function LikeButton({profileId: _profileId}: {profileId: string}) {
  const [liked, setLiked] = useState(false)
  const {announce} = useLiveRegion()

  const handleLike = () => {
    const newLiked = !liked
    setLiked(newLiked)

    if (newLiked) {
      announce('Profile liked', 'polite')
    } else {
      announce('Like removed', 'polite')
    }
  }

  return (
    <button onClick={handleLike} aria-label={liked ? 'Remove like' : 'Like profile'}>
      {liked ? '❤️' : '🤍'}
    </button>
  )
}

function MessageSentNotification() {
  const {announce} = useLiveRegion()

  const handleSend = () => {
    announce('Message sent successfully', 'polite')
  }

  return <button onClick={handleSend}>Send</button>
}

function ErrorAlert({message}: {message: string}) {
  const {announce} = useLiveRegion()

  const handleRetry = () => {
    announce('Retrying connection...', 'polite')
  }

  return (
    <div role="alert">
      <p>Error: {message}</p>
      <button onClick={handleRetry}>Retry</button>
    </div>
  )
}

function FormSubmission() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const {announce} = useLiveRegion()

  const handleSubmit = async () => {
    setStatus('submitting')
    announce('Submitting form, please wait', 'polite')

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setStatus('success')
      announce('Form submitted successfully', 'polite')
    } catch {
      setStatus('error')
      announce('Form submission failed. Please try again.', 'assertive')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {status === 'success' && <p role="status">Success!</p>}
      <button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}

function LoadingIndicator({isLoading}: {isLoading: boolean}) {
  const {announce} = useLiveRegion()

  if (isLoading) {
    announce('Loading more results', 'polite')
  }

  return isLoading ? <span aria-busy="true">Loading...</span> : null
}

export {ErrorAlert, FormSubmission, LikeButton, LoadingIndicator, MessageSentNotification}
