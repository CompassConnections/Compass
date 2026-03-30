export const CustomMushroom = ({className}: {className: string}) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* cap */}
    <path d="M4 11a8 6 0 0 1 16 0H4z" />

    {/* stem */}
    <path d="M10 11v5a2 2 0 0 0 4 0v-5" />

    {/* cap spots */}
    <path d="M8 8h.01" />
    <path d="M12 7h.01" />
    <path d="M16 8h.01" />
  </svg>
)
