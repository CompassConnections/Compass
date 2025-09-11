'use server'

import { Head, Html, Preview, Tailwind, Text } from '@react-email/components'
import React from 'react'

export const Test = (props: { name: string }) => {
  return (
    <Html>
      <Head />
      <Preview>Helloo {props.name}</Preview>
      <Tailwind>
        <Text className="text-xl text-blue-800">Hello {props.name}</Text>
      </Tailwind>
    </Html>
  )
}

Test.PreviewProps = {
  name: 'Friend',
}

export default Test
