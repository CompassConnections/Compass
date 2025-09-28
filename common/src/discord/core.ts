import {User} from "common/user";

export const sendDiscordNewUser = async (user: User) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_NEW_USERS

  if (!webhookUrl) return

  const response = await fetch(webhookUrl!, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({content: `**${user.name}** just created a profile at https://www.compassmeet.com/${user.username}`}),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(text)
  }
}