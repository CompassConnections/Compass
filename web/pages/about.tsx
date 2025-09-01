import { LovePage } from 'web/components/love-page'

export default function About() {
  return (
    <LovePage trackPageView={'user profiles'}>
      🚧 🏗️ Manifold love is under new construction.
      <br />
      Expect incredible new things soon. 🚧 🏗️
      <br />
      Hopefully.
      <br />
      <br />
      You answer questions and get a compatibility score.
      <br />
      Then you can like someone once a day to unlock the ability to message
      them.
      <br />
      <br />
      <span>
        Join the{' '}
        <a
          href="https://discord.gg/8Vd7jzqjun"
          className="hover:text-primary-700 cursor-pointer underline"
        >
          discord
        </a>{' '}
        to ask for help and give feedback.
      </span>
    </LovePage>
  )
}
