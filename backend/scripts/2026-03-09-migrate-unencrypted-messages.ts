import {convertPrivateChatMessage} from 'shared/supabase/messages'
import {encryptMessage} from 'shared/encryption' // adjust path as needed
import chalk from 'chalk'
import {runScript} from './run-script'

// Migrates all unencrypted private_user_messages (content column non-empty)
// to the encrypted format (ciphertext, iv, tag) and clears the content column.
//
// Safe to re-run: rows that already have ciphertext set are skipped.

const BATCH_SIZE = 10000

runScript(async ({pg}) => {
  console.log(chalk.cyan('Starting migration of unencrypted messages…'))

  let lastId = 0
  let totalMigrated = 0
  let totalSkipped = 0
  let totalFailed = 0

  while (true) {
    // Fetch a batch of messages where content is non-null/non-empty
    // and the row has NOT yet been encrypted (ciphertext IS NULL).
    const rows = await pg.map(
      `SELECT * FROM private_user_messages m
       WHERE m.id > $1
         AND m.content IS NOT NULL
       ORDER BY m.id
       LIMIT $2`,
      [lastId, BATCH_SIZE],
      convertPrivateChatMessage,
    )

    if (rows.length === 0) {
      console.log(chalk.green('No more unencrypted messages found. Done.'))
      break
    }

    console.log(
      chalk.blue(`Processing batch of ${rows.length} messages (starting after id=${lastId})…`),
    )

    for (const message of rows) {
      lastId = Math.max(lastId, message.id as number)

      // console.log(chalk.blue(JSON.stringify(message, null, 2)))

      // --- Guard: skip if somehow already encrypted ---
      if (message.ciphertext) {
        totalSkipped++
        continue
      }

      const plaintext = JSON.stringify(message.content)

      // --- Encrypt ---
      let encrypted: {ciphertext: string; iv: string; tag: string}
      try {
        encrypted = encryptMessage(plaintext)
      } catch (err) {
        console.error(chalk.red(`  [ERROR] id=${message.id} — encryption failed:`), err)
        totalFailed++
        continue
      }

      // --- Persist: write encrypted fields, clear content ---
      try {
        await pg.none(
          `UPDATE private_user_messages
           SET ciphertext = $1,
               iv         = $2,
               tag        = $3
--                content    = NULL
           WHERE id = $4`,
          [encrypted.ciphertext, encrypted.iv, encrypted.tag, message.id],
        )
        totalMigrated++
        console.debug(chalk.green(`  [OK]   id=${message.id}`) + chalk.gray(` (${plaintext})`))
      } catch (err) {
        console.error(chalk.red(`  [ERROR] id=${message.id} — DB update failed:`), err)
        totalFailed++
      }
    }
  }

  console.log(chalk.cyan('\n── Migration complete ──────────────────────────────'))
  console.log(chalk.green(`  Migrated : ${totalMigrated}`))
  console.log(chalk.yellow(`  Skipped  : ${totalSkipped}`))
  console.log(chalk.red(`  Failed   : ${totalFailed}`))
  console.log(chalk.cyan('────────────────────────────────────────────────────'))

  process.exit(totalFailed > 0 ? 1 : 0)
})
