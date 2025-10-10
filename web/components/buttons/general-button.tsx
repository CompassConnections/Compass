import Link from "next/link";

export const GeneralButton = (props: {
  url: string
  content: string
}) => {
  const {url, content} = props
  return <div className="rounded-xl shadow p-6 flex flex-col items-center">
    <Link
      href={url}
      className="px-6 py-2 rounded-full bg-gray-200 text-gray-800 font-semibold text-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition"
      target={url.startsWith('http') ? '_blank' : undefined}
      rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {content}
    </Link>
  </div>;
}