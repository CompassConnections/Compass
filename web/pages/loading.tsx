"use client";

import {CompassLoadingIndicator} from "web/components/widgets/loading-indicator";
import {LovePage} from "web/components/love-page";

export default function Loading() {
  return <LovePage trackPageView={'loading'}>
    <CompassLoadingIndicator/>
  </LovePage>;
}
