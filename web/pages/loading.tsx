'use client'

import {PageBase} from 'web/components/page-base'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'

export default function Loading() {
  return (
    <PageBase trackPageView={'loading'}>
      <CompassLoadingIndicator />
    </PageBase>
  )
}
