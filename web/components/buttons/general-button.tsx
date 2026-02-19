import Link from 'next/link'

export const GeneralButton = (props: {url: string; content: string}) => {
  const {url, content} = props

  return (
    <div className="rounded-xl p-3 flex flex-col items-center group">
      <Link
        href={url}
        className="w-full px-8 py-3 rounded-full border-2 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white font-medium text-lg 
                  hover:translate-y-[-2px] transition-transform duration-200 ease-in-out
                  bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800/50"
        target={url.startsWith('http') ? '_blank' : undefined}
        rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        <div className="flex items-center justify-center w-full h-full flex-col text-center">
          <div className="flex items-center justify-center">{content}</div>
        </div>
      </Link>
    </div>
  )
}
