'use client'

import {useEffect, useState} from 'react'
import {useLocale} from 'web/lib/locale'
import {defaultLocale} from 'common/constants'
import {MD_PATHS} from 'web/components/markdown'

export function useMarkdown(filename: (typeof MD_PATHS)[number]) {
  const {locale} = useLocale()
  const lang = locale ?? defaultLocale
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    const loadMarkdown = async () => {
      try {
        let path = `/md/${lang}/${filename}.md`
        let res = await fetch(path)

        if (!res.ok) {
          // fallback to default locale
          path = `/md/${filename}.md`
          res = await fetch(path)
        }

        const text = await res.text()
        if (!cancelled) setContent(text)
      } catch (e) {
        console.error(e)
        if (!cancelled) setContent('Error loading content')
      }
    }

    loadMarkdown()

    return () => {
      cancelled = true
    }
  }, [filename, lang])

  return content
}
