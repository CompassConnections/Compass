export const sendDiscordMessage = async (content: string, channel: string) => {
  const webhookUrl = {
    members: process.env.DISCORD_WEBHOOK_MEMBERS,
    general: process.env.DISCORD_WEBHOOK_GENERAL,
  }[channel]

  if (!webhookUrl) return

  const response = await fetch(webhookUrl!, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({content}),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(text)
  }
}