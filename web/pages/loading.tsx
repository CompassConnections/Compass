'use client'

import {HomeLoadingAnimation} from 'web/components/home/home-loading-animation'
import {PageBase} from 'web/components/page-base'

export default function Loading() {
  return (
    <PageBase trackPageView={'loading'} className={'col-span-10 lg:!mt-0 xl:!px-0'}>
      <HomeLoadingAnimation />
    </PageBase>
  )
}
