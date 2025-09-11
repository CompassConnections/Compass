'use server'

import * as React from 'react'
import { Html, Head, Preview, Tailwind, Text } from '@react-email/components'

export const Test = ({ name }: { name: string }) => (
  <Html>
    <Head />
    <Preview>Hello {name}</Preview>
    <Tailwind>
      <Text className="text-xl text-blue-800">Hello {name}</Text>
    </Tailwind>
  </Html>
)

Test.PreviewProps = {
  name: 'Friend',
}

export default Test
