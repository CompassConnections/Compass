import {captureMessage} from '@sentry/nextjs'
import {YEAR_SECONDS} from 'common/util/time'
import Compressor from 'compressorjs'
import {getDownloadURL, ref, uploadBytesResumable} from 'firebase/storage'
import {nanoid} from 'nanoid'

import {storage} from './init'
import {auth} from './users'

/**
 * Uploads `file` to the public bucket and resolves with its download URL.
 *
 * The object always lands under `user-images/<the caller's own uid>/`, and never under a folder the
 * caller names. `backend/firebase/storage.rules` enforces the same thing server-side — it used to
 * allow any signed-in member to write any path, so anyone who read another member's (public) photo
 * URL could overwrite the file it pointed at. Anything the caller could pass here would be a value
 * the rules cannot verify, which is why there is no folder-owner parameter: uploads that used to be
 * filed under a username now go under that member's uid, which is the same id Supabase stores as
 * `users.id`.
 */
export const uploadImage = async (
  file: File,
  prefix?: string,
  onProgress?: (progress: number, isRunning: boolean) => void,
) => {
  const uid = auth.currentUser?.uid
  if (!uid) return Promise.reject('You must be signed in to upload')

  const fileType = await getFileType(file)

  const lastDot = file.name.lastIndexOf('.')
  let ext = lastDot !== -1 ? file.name.slice(lastDot + 1) : undefined
  ext ??= fileType?.split('/')[1]
  ext ??= 'bin'
  ext = ext.toLowerCase()

  // Replace filename with a nanoid to avoid collisions
  const stem = nanoid(10)

  const ALLOWED_TYPES = [
    'video/mp4',
    'video/webm',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/heic',
    'image/heif',
  ]

  if (!ALLOWED_TYPES.includes(fileType || '')) {
    captureMessage('Likely unsupported image format', {attributes: {type: file.type}})
    console.warn('Likely unsupported image format', file.type)
  }

  // The storage rules only accept `image/*` and `video/*`, so anything else would come back as an
  // opaque 403 from the upload task. Say what is actually wrong instead. Sniffing above means a file
  // the browser gave no type for still gets here on its magic number rather than on its extension.
  if (!/^(image|video)\//.test(fileType || '')) {
    return Promise.reject('Only images and videos can be uploaded')
  }

  if (isHeic(file) && typeof window !== 'undefined') {
    file = await convertHeicToJpeg(file)
    ext = 'jpg'
  }

  if (file.type === 'image/webp') {
    file = await convertWebpToJpeg(file)
    ext = 'jpg'
  }

  const filename = `${stem}.${ext}`
  console.log('filename', filename)
  const storageRef = ref(storage, `user-images/${uid}${prefix ? '/' + prefix : ''}/${filename}`)

  if (file.size > 20 * 1024 ** 2) {
    return Promise.reject('File is over 20 MB')
  }

  // 2️⃣ Compress if > 1MB (images only; Compressor operates on raster images)
  if (file.size > 1024 ** 2 && file.type.startsWith('image')) {
    file = await new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 0.6,
        maxHeight: 1920,
        maxWidth: 1920,
        convertSize: 1000000, // if result >1MB turn to jpeg
        success: (file: File) => resolve(file),
        error: (error) => reject(error.message),
      })
    })
  }

  // Set explicitly rather than left to the SDK's `file.type`: a file the browser typed as `''` would
  // otherwise be stored as `application/octet-stream`, which the storage rules reject and which
  // browsers will not render anyway. `fileType` is the sniffed fallback for exactly that case, and
  // `file.type` wins because the conversion and compression steps above may have replaced the file.
  const contentType = file.type || fileType

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType,
    cacheControl: `public, max-age=${YEAR_SECONDS}`,
  })

  let resolvePromise: (url: string) => void
  let rejectPromise: (reason?: any) => void

  const promise = new Promise<string>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })

  const unsubscribe = uploadTask.on(
    'state_changed',
    (snapshot) => {
      const progress = snapshot.bytesTransferred / snapshot.totalBytes
      const isRunning = snapshot.state === 'running'
      if (onProgress) onProgress(progress, isRunning)
    },
    (error) => {
      // A full list of error codes is available at
      // https://firebase.google.com/docs/storage/web/handle-errors
      rejectPromise(error)
      unsubscribe()
    },
    () => {
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        resolvePromise(downloadURL)
      })

      unsubscribe()
    },
  )

  return await promise
}

export async function convertWebpToJpeg(file: File): Promise<File> {
  if (file.type !== 'image/webp') return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (!blob) return reject(new Error('Conversion failed'))
          resolve(new File([blob], file.name.replace(/\.webp$/, '.jpg'), {type: 'image/jpeg'}))
        },
        'image/jpeg',
        0.92,
      )
    }
    img.onerror = reject
    img.src = url
  })
}

const isHeic = (file: File) =>
  file.type === 'image/heic' || file.type === 'image/heif' || /\.heic$/i.test(file.name)

export async function convertHeicToJpeg(file: File): Promise<File> {
  // Convert HEIC → JPEG immediately (as HEIC not rendered)
  // heic2any available in client only
  const {default: heic2any} = await import('heic2any')
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.9,
  })

  return new File([converted as Blob], file.name.replace(/\.heic$/, '.jpg'), {
    type: 'image/jpeg',
  })
}

async function getFileType(file: File): Promise<string | undefined> {
  if (file.type) return file.type

  const buf = await file.slice(0, 12).arrayBuffer()
  const bytes = new Uint8Array(buf)

  // MP4/MOV: bytes 4-8 = "ftyp"
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70)
    return 'video/mp4'

  // WebM: starts with 0x1A45DFA3
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3)
    return 'video/webm'

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return 'image/png'

  return undefined
}

export function isVideo(url: string) {
  return url.match(/\.(mp4|webm|mov|ogg)/)
}
