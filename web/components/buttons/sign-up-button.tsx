import clsx from 'clsx'
import {ButtonHTMLAttributes} from 'react'
import {FaApple} from 'react-icons/fa'
import {FcGoogle} from 'react-icons/fc'
import {Row} from 'web/components/layout/row'
import {startSignup} from 'web/lib/util/signup'

import {Col} from '../layout/col'
import {Button} from './button'

export const SidebarSignUpButton = (props: {className?: string}) => {
  const {className} = props

  return (
    <Col className={clsx('mt-4', className)}>
      <Button size="xl" onClick={startSignup} className="w-full">
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
        'hover:bg-canvas-25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        'disabled:opacity-70 disabled:cursor-not-allowed',
      )}
      {...props}
    >
      <FcGoogle className="w-5 h-5" />
      {isLoading ? 'Loading...' : 'Google'}
    </button>
  )
}

type AppleButtonProps = {
  onClick: () => void
  isLoading?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>

/**
 * Sign in with Apple. Rendered wherever `canAppleLogin()` allows: inside the iOS app, where Apple
 * requires it and `@capgo/capacitor-social-login` runs the native flow, and in browsers once the
 * Services ID is configured, where it goes through Firebase's popup handler instead.
 *
 * Apple's Human Interface Guidelines want this button no smaller and no less prominent than the
 * other providers, hence the same shape as `GoogleButton`.
 */
export function AppleButton({onClick, isLoading = false, ...props}: AppleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={clsx(
        'w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300',
        'rounded-full shadow-sm text-sm font-medium',
        'hover:bg-canvas-25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        'disabled:opacity-70 disabled:cursor-not-allowed',
      )}
      {...props}
    >
      <FaApple className="w-5 h-5" />
      {isLoading ? 'Loading...' : 'Apple'}
    </button>
  )
}
