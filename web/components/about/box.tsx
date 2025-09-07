export function AboutBox(props: {
  title: string
  text: string
}) {
  const {title, text} = props
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">
        {text}
      </p>
    </div>
  )
}
