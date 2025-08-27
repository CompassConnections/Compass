"use client";

import {Suspense} from "react";
import OnboardingForm from "@/components/onboarding";


export default function RegisterPage() {
  return (
    <Suspense fallback={<div></div>}>
      <RegisterComponent/>
    </Suspense>
  );
}

function RegisterComponent() {


  return (
    <div className="min-h-screen flex items-center justify-center  py-12 px-4 sm:px-6 lg:px-8">
      <OnboardingForm/>
    </div>
  );
}
