import {ENV_CONFIG} from 'common/envs/constants'
import crypto from 'crypto'

/**
 * MASTER_KEY must be a 32-byte Buffer (AES-256).
 * Load it from a secrets manager at runtime; do NOT hardcode.
 */
let _MASTER_KEY: Buffer | null = null
const getMasterKey = () => {
  if (_MASTER_KEY) return _MASTER_KEY

  if (ENV_CONFIG.dbEncryptionKey) {
    const MASTER_KEY_BASE64 = ENV_CONFIG.dbEncryptionKey
    _MASTER_KEY = Buffer.from(MASTER_KEY_BASE64, 'base64')
    if (_MASTER_KEY.length !== 32) throw new Error('MASTER_KEY must be 32 bytes')
  }

  if (!_MASTER_KEY) throw new Error('MASTER_KEY not set')

  return _MASTER_KEY
}

/**
 * Encrypt a UTF-8 message string into base64 ciphertext + iv + tag.
 * The IV makes the encryption probabilistic to ensure uniqueness in ciphertexts even when encrypting the same plaintext
 * multiple times and has therefore no intent of being secret. The authentication tag works similar to a MAC.
 * It's used to prove the authenticity and integrity of a message
 */
export function encryptMessage(plaintext: string) {
  const iv = crypto.randomBytes(12) // 96-bit IV, recommended for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', getMasterKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  // console.debug(plaintext, iv, ciphertext, tag)

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  }
}

/**
 * Decrypt base64 ciphertext + iv + tag -> plaintext string.
 * Throws on auth failure.
 */
export function decryptMessage({
  ciphertext,
  iv,
  tag,
}: {
  ciphertext: string
  iv: string
  tag: string
}) {
  const ivBuf = Buffer.from(iv, 'base64')
  const ctBuf = Buffer.from(ciphertext, 'base64')
  const tagBuf = Buffer.from(tag, 'base64')

  const decipher = crypto.createDecipheriv('aes-256-gcm', getMasterKey(), ivBuf)
  decipher.setAuthTag(tagBuf)
  const plaintext = Buffer.concat([decipher.update(ctBuf), decipher.final()]).toString('utf8')
  // console.debug("Decrypted message:", plaintext);
  return plaintext
}
