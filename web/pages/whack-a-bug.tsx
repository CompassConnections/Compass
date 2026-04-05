'use client'

import WhackABug from 'web/components/game/whack-a-bug'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'

export default function WhackABugPage() {
  return (
    <PageBase trackPageView={'whack-a-bug'} className="relative p-2 sm:pt-0">
      <SEO
        title="Whack-A-Bug"
        description="Blame the bugs for the error - a fun game"
        url="/whack-a-bug"
      />
      <div className="max-w-lg mx-auto">
        <WhackABug />
      </div>
    </PageBase>
  )
}
