import {IS_DEV} from 'common/envs/constants'

export const sendDiscordMessage = async (content: string, channel: string) => {
  let webhookUrl = {
    members: process.env.DISCORD_WEBHOOK_MEMBERS,
    general: process.env.DISCORD_WEBHOOK_GENERAL,
    health: process.env.DISCORD_WEBHOOK_HEALTH,
    reports: process.env.DISCORD_WEBHOOK_REPORTS,
    contact: process.env.DISCORD_WEBHOOK_CONTACT,
  }[channel]

  if (IS_DEV) webhookUrl = process.env.DISCORD_WEBHOOK_DEV

  // console.log(`Discord webhook URL: ${webhookUrl}`, channel, content)

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
