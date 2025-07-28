import Link from "next/link";

export default function AuthError({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const error = searchParams?.error;
  let errorMessage = "An error occurred during authentication.";

  switch (error) {
    case "InvalidToken":
      errorMessage = "The verification link is invalid.";
      break;
    case "InvalidOrExpiredToken":
      errorMessage = "The verification link is invalid or has expired. Please request a new one.";
      break;
    case "VerificationFailed":
      errorMessage = "Email verification failed. Please try again later.";
      break;
    default:
      errorMessage = "An unexpected error occurred. Please try again.";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="rounded-full bg-red-100 p-3 inline-flex items-center justify-center">
          <svg
            className="h-12 w-12 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Verification Error
        </h2>
        <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
        <div className="mt-6 space-y-4">
          <Link
            href="/register"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Registration
          </Link>
          <Link
            href="/login"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
