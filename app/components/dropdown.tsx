'use client';

type DropdownProps = {
  id: string
  options?: string[]
  value: string
  onChange: (id: string, value: string) => void
  onFocus?: (id: string) => void
  onKeyDown?: (id: string, key: string) => void
  onClick: (id: string) => void
}

export default function Dropdown(
  {
    id,
    options,
    value,
    onChange,
    onFocus,
    onKeyDown,
    onClick,
  }: DropdownProps
) {
  return (
    <div className="relative">
      <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(id, e.target.value)}
          onFocus={() => onFocus?.(id)}
          onKeyDown={(e) => onKeyDown?.(id, e.key)}
          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border-0 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Type to search"
        />
        <button
          type="button"
          onClick={(e) => onClick?.(id)}
          className="px-3 py-2 border-l border-gray-300 text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
               fill="currentColor">
            <path fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>

  )
}
