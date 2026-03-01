export function SkipLink() {
  return (
    <>
      <a
        href="#main-content"
        className="absolute -top-10 left-4 z-50 bg-primary-500 px-4 py-2 text-white transition-all focus:top-4"
      >
        Skip to main content
      </a>
      <a
        href="#main-navigation"
        className="absolute -top-10 left-4 z-50 bg-primary-500 px-4 py-2 text-white transition-all focus:top-4"
      >
        Skip to navigation
      </a>
    </>
  )
}
