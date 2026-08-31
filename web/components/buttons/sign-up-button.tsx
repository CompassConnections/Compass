import clsx from 'clsx'
import {ButtonHTMLAttributes} from 'react'
import {FcGoogle} from 'react-icons/fc'
import {Row} from 'web/components/layout/row'
import {startSignup} from 'web/lib/util/signup'

import {Col} from '../layout/col'
import {Button} from './button'

/**
 * The one look both social buttons wear.
 *
 * Shared rather than duplicated because the constraint that drives it is a *comparison*: Apple's
 * guideline is that Sign in with Apple be no smaller and no less prominent than any other sign-in
 * option on the screen. Two independently-styled buttons drift, and the drift is only ever noticed
 * by App Review. One constant means the question cannot be got wrong by editing one of them.
 *
 * The fill flips with the theme — black on the light canvas, white on the dark one — because Apple
 * ships three button appearances (black, white, white-with-outline) precisely so one of them
 * contrasts with whatever it sits on, and the guideline is to use the one that does. Our dark canvas
 * is very nearly black, so a black button all but vanished into it; what little edge it had came
 * from the mark inside it rather than from the control.
 *
 * Google is happy either way round: their branding permits the full-colour G on both a light and a
 * dark button, and these two fills are in substance their light and dark themes.
 */
const SOCIAL_BUTTON_CLASSES = clsx(
  // gap 12px: Apple's rendered button puts 0.273 of the control's height between mark and label,
  // which is 12px at 44px tall.
  'w-full flex items-center justify-center gap-3 py-2 px-4 min-h-[44px]',
  // `rounded-xl`, matching `AuthSubmitButton` — the email button directly above these two. Apple
  // permits any radius from square to fully rounded, so the constraint here is ours: three sign-up
  // buttons stacked in a column look like three unrelated controls if only one of them is a pill.
  // 19px semibold. Both numbers are measured off Apple's own rendered button rather than picked:
  // the stem-to-height ratio of its label is 0.111, which is SF Pro Semibold territory, and its
  // label block is 0.386 of the button's height — 17px in the 44px control Apple ships in the HIG.
  // Our label renders at 0.887 of its font-size, so 17 / 0.887 ≈ 19px.
  //
  // This is the one place the pair is *larger* than `AuthSubmitButton` above it, which uses 15px.
  // Deliberate: matching Apple's proportion was the ask, and the guideline runs the same direction
  // anyway — the Apple button may not be less prominent than the other ways in.
  //
  // `leading-[1.15]` because Tailwind's arbitrary font sizes do not carry a line-height, and the
  // inherited 1.5 would push the control past 44px and make `min-h-[44px]` stop being the thing
  // that sets the height.
  'rounded-xl shadow-sm text-[19px] leading-[1.15] font-semibold',
  'bg-black text-white border border-black',
  'dark:bg-white dark:text-black dark:border-white',
  'hover:bg-neutral-900 dark:hover:bg-neutral-100',
  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
  'disabled:opacity-70 disabled:cursor-not-allowed',
)

/**
 * The platform's own UI font, which on iOS is SF Pro — what Apple's Sign-in-with-Apple guidance asks
 * for, and what the app's branded font would otherwise override on that one button. Google's button
 * takes it too, since the pair are meant to be indistinguishable apart from the mark and the word.
 */
const SYSTEM_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

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
  /** As with Apple: `/register` says "Sign up with Google", `/signin` takes the default. */
  label?: string
} & ButtonHTMLAttributes<HTMLButtonElement>

/**
 * Sign in with Google, styled to match `AppleButton` exactly — see `SOCIAL_BUTTON_CLASSES` for why
 * they share one definition rather than two similar ones.
 *
 * The label used to be the bare word "Google", which is a mismatch on two counts: it left the Apple
 * button visually longer and heavier than this one, and Google's own branding asks for a full phrase
 * ("Sign in with", "Sign up with" or "Continue with"). `FcGoogle` is the standard full-colour G,
 * which Google permits on either fill, so it needs no theme handling of its own.
 */
export function GoogleButton({onClick, isLoading = false, label, ...props}: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      style={{fontFamily: SYSTEM_FONT_STACK}}
      className={SOCIAL_BUTTON_CLASSES}
      {...props}
    >
      {/* Sized to sit level with `AppleMark` beside it — the G is square where the Apple mark is
          taller than it is wide, so matching optically rather than numerically. Boxed in white so
          the G's own white counters stay legible on the black fill. */}
      <FcGoogle className="w-4 h-4 rounded-full bg-white" />
      {isLoading ? 'Loading...' : (label ?? 'Sign in with Google')}
    </button>
  )
}

type AppleButtonProps = {
  onClick: () => void
  isLoading?: boolean
  /**
   * Apple permits exactly three labels — "Sign in with Apple", "Sign up with Apple" and "Continue
   * with Apple" — and nothing else. `/register` passes the second; the default suits `/signin`.
   */
  label?: string
} & ButtonHTMLAttributes<HTMLButtonElement>

/**
 * The Apple logo mark, taken verbatim from Apple Design Resources.
 *
 * Source: the "Sign in with Apple Logo" download from https://developer.apple.com/design/resources/,
 * file `Logo - SIWA - Logo-only - Black.svg`. The `d` below is Apple's, byte for byte. This replaced
 * `FaApple` from `react-icons` — Font Awesome's *redrawing* of the mark — which is what got 1.42.0
 * rejected under guideline 4, and it is a genuinely different shape rather than a near-miss: Apple's
 * Sign-in-with-Apple glyph is its own simplified drawing, not the marketing logo.
 *
 * The mark may not be redrawn, recoloured beyond black and white, rotated, or given effects. If it
 * ever needs to change, re-download it — do not edit this path.
 *
 * Two things about the shape as Apple ships it, both deliberate here:
 *
 * - Apple's file is a 56×56 square containing a 44×44 button plate and the glyph centred on it. The
 *   plate is the *button*, which we draw ourselves, so `viewBox` crops to the glyph's own box —
 *   x 20.5→35.5, y 16→35, i.e. 15×19. The numbers are measured off Apple's path, not chosen.
 * - Apple ships a black file and a white one, and their paths are identical: only `fill` differs.
 *   So `currentColor` here is exactly equivalent to shipping both, and lets the one copy follow the
 *   button's text colour through the light/dark flip.
 */
function AppleMark({className}: {className?: string}) {
  return (
    <svg className={className} viewBox="20.5 16 15 19" fill="currentColor" aria-hidden="true">
      <path
        fillRule="nonzero"
        d="M28.2226562,20.3846154 C29.0546875,20.3846154 30.0976562,19.8048315 30.71875,19.0317864 C31.28125,18.3312142 31.6914062,17.352829 31.6914062,16.3744437 C31.6914062,16.2415766 31.6796875,16.1087095 31.65625,16 C30.7304687,16.0362365 29.6171875,16.640178 28.9492187,17.4494596 C28.421875,18.06548 27.9414062,19.0317864 27.9414062,20.0222505 C27.9414062,20.1671964 27.9648438,20.3121424 27.9765625,20.3604577 C28.0351562,20.3725366 28.1289062,20.3846154 28.2226562,20.3846154 Z M25.2929688,35 C26.4296875,35 26.9335938,34.214876 28.3515625,34.214876 C29.7929688,34.214876 30.109375,34.9758423 31.375,34.9758423 C32.6171875,34.9758423 33.4492188,33.792117 34.234375,32.6325493 C35.1132812,31.3038779 35.4765625,29.9993643 35.5,29.9389701 C35.4179688,29.9148125 33.0390625,28.9122695 33.0390625,26.0979021 C33.0390625,23.6579784 34.9140625,22.5588048 35.0195312,22.474253 C33.7773438,20.6382708 31.890625,20.5899555 31.375,20.5899555 C29.9804688,20.5899555 28.84375,21.4596313 28.1289062,21.4596313 C27.3554688,21.4596313 26.3359375,20.6382708 25.1289062,20.6382708 C22.8320312,20.6382708 20.5,22.5950413 20.5,26.2911634 C20.5,28.5861411 21.3671875,31.013986 22.4335938,32.5842339 C23.3476562,33.9129053 24.1445312,35 25.2929688,35 Z"
      />
    </svg>
  )
}

/**
 * Sign in with Apple. Rendered wherever `canAppleLogin()` allows: inside the iOS app, where Apple
 * requires it and `@capgo/capacitor-social-login` runs the native flow, and in browsers once the
 * Services ID is configured, where it goes through Firebase's popup handler instead.
 *
 * Everything about the shape is dictated rather than chosen, so it is worth saying what each part is
 * answering. The label is one of the three permitted strings, spelled in full — "Apple" on its own,
 * which is what this button used to say, is not among them. `min-h-[44px]` is Apple's floor for the
 * control, and the mark is sized against it rather than against the text. The font is deliberately
 * the *system* stack and not the app's: on an iPhone that resolves to SF Pro, which is what the
 * guideline asks for.
 *
 * Fill, size and radius all come from `SOCIAL_BUTTON_CLASSES`, which `GoogleButton` also uses — the
 * pill radius is ours (Apple allows anything from square to fully rounded) and the theme-flipping
 * fill is the contrast rule. Sharing the constant is what keeps the two providers identical, which
 * is itself the requirement: the Apple button may not be smaller or less prominent than any other
 * sign-in option on the screen.
 *
 * `AppleMark` paints with `currentColor`, so it follows the text colour through the flip on its own.
 */
export function AppleButton({onClick, isLoading = false, label, ...props}: AppleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      style={{fontFamily: SYSTEM_FONT_STACK}}
      className={SOCIAL_BUTTON_CLASSES}
      {...props}
    >
      {/* 15px tall, width following the artwork's own 15:19 box so nothing is stretched.
          Left alone deliberately when the label grew: measured against Apple's rendered 44px button
          our mark is 0.340 of the control's height and theirs is 0.341, so this was never the part
          that was off. The lockup read small because the *label* was undersized at 0.302 against
          their 0.386, which is what dragged the whole thing down. */}
      <AppleMark className="h-[15px] w-[11.84px]" />
      {isLoading ? 'Loading...' : (label ?? 'Sign in with Apple')}
    </button>
  )
}
