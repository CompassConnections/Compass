import clsx from 'clsx'
import {ButtonHTMLAttributes} from 'react'
import {FcGoogle} from 'react-icons/fc'
import {Row} from 'web/components/layout/row'
import {firebaseLogin} from 'web/lib/firebase/users'

import {Col} from '../layout/col'
import {Button} from './button'

export const SidebarSignUpButton = (props: {className?: string}) => {
  const {className} = props

  return (
    <Col className={clsx('mt-4', className)}>
      <Button color="gradient" size="xl" onClick={firebaseLogin} className="w-full">
        Sign up
      </Button>
    </Col>
  )
}

export const GoogleSignInButton = (props: {onClick: () => any}) => {
  return (
    <Button
      onClick={props.onClick}
      color={'gradient-pink'}
      size={'lg'}
      className=" whitespace-nowrap  shadow-sm outline-2 "
    >
      <Row className={'items-center gap-2 p-2'}>
        <img src="/google.svg" alt="" width={24} height={24} className="rounded-full bg-white" />
        <span>Sign in with Google</span>
      </Row>
    </Button>
  )
}

type GoogleButtonProps = {
  onClick: () => void
  isLoading?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>

export function GoogleButton({onClick, isLoading = false, ...props}: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={clsx(
        'w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300',
        'rounded-full shadow-sm text-sm font-medium',
        'hover:bg-canvas-25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:opacity-70 disabled:cursor-not-allowed',
      )}
      {...props}
    >
      <FcGoogle className="w-5 h-5" />
      {isLoading ? 'Loading...' : 'Google'}
    </button>
  )
}
