import Compressor from 'compressorjs'
import {getDownloadURL, ref, uploadBytesResumable} from 'firebase/storage'
import {nanoid} from 'nanoid'

import {storage} from './init'

const ONE_YEAR_SECS = 60 * 60 * 24 * 365

const isHeic = (file: File) =>
  file.type === 'image/heic' || file.type === 'image/heif' || /\.heic$/i.test(file.name)

export const uploadImage = async (
  username: string,
  file: File,
  prefix?: string,
  onProgress?: (progress: number, isRunning: boolean) => void,
) => {
  // Replace filename with a nanoid to avoid collisions
  let [, ext] = file.name.split('.')
  const stem = nanoid(10)

  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/heic',
    'image/heif',
  ]

  if (!ALLOWED_TYPES.includes(file.type)) {
    // throw new Error('Unsupported image format')
    console.warn('Likely unsupported image format', file.type)
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
  const storageRef = ref(
    storage,
    `user-images/${username}${prefix ? '/' + prefix : ''}/${filename}`,
  )

  if (file.size > 20 * 1024 ** 2) {
    return Promise.reject('File is over 20 MB')
  }

  // 2️⃣ Compress if > 1MB
  if (file.size > 1024 ** 2) {
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

  const uploadTask = uploadBytesResumable(storageRef, file, {
    cacheControl: `public, max-age=${ONE_YEAR_SECS}`,
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
