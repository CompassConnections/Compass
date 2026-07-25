/**
 * Base64-encodes a Blob, without the `data:...;base64,` prefix.
 *
 * FileReader rather than `Buffer`/`btoa`: it streams, so a multi-megabyte audio recording does not
 * have to be materialised as a JS string of char codes first.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Unexpected FileReader result'))
        return
      }
      const comma = result.indexOf(',')
      resolve(comma === -1 ? result : result.slice(comma + 1))
    }
    reader.readAsDataURL(blob)
  })
}
