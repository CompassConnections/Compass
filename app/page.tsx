export const dynamic = "force-dynamic"; // This disables SSG and ISR

import Link from "next/link";


export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-6 max-w-6xl mx-auto w-full">

      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 text-center px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 max-w-3xl leading-tight">
          BayesBond
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl">
          The bonding platform for rational thinkers
        </p>
        <div className="mt-8 flex space-x-4">
          <Link
            href="/learn-more"
            className="px-6 py-3 bg-gray-200 text-gray-800 text-lg rounded-lg hover:bg-gray-300 transition"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 text-center text-gray-500">
        © {new Date().getFullYear()} BayesBond. All rights reserved.
      </footer>
    </main>
  );
}

