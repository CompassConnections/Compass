"use client";

import {CompassLoadingIndicator} from "web/components/widgets/loading-indicator";
import {PageBase} from "web/components/page-base";

export default function Loading() {
  return <PageBase trackPageView={'loading'}>
    <CompassLoadingIndicator/>
  </PageBase>;
}
