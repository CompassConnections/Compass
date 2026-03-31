import {debug} from 'common/logger'
import {OptionTableKey} from 'common/profiles/constants'
import {run} from 'common/supabase/utils'
import {createContext, ReactNode, useContext, useEffect} from 'react'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {useLocale} from 'web/lib/locale'
import {db} from 'web/lib/supabase/db'

const ChoicesContext = createContext<UseAllChoices | null>(null)

export const ChoicesProvider = ({children}: {children: ReactNode}) => {
  const choices = useAllChoices()
  return <ChoicesContext.Provider value={choices}>{children}</ChoicesContext.Provider>
}

export const useChoicesContext = () => {
  const ctx = useContext(ChoicesContext)
  if (!ctx) throw new Error('useChoicesContext must be used within a ChoicesProvider')
  return ctx
}

export async function fetchChoices(label: OptionTableKey, locale: string) {
  debug('Fetching choices for', label)
  const choicesById: Record<string, string> = {}
  const {data} = await run(
    db
      .from(label)
      .select(
        `
        id,
        name,
        ${label}_translations!left (
          locale,
          name
        )
      `,
      )
      .eq(`${label}_translations.locale`, locale)
      .order('name', {ascending: true}),
  )

  data.forEach((row: any) => {
    const translated = row[`${label}_translations`]?.[0]?.name ?? row.name
    choicesById[row.id] = translated
  })

  return choicesById
}

const useChoices = (label: OptionTableKey) => {
  const [choices, setChoices] = usePersistentInMemoryState<Record<string, string>>(
    {},
    `${label}-choices`,
  )
  const {locale} = useLocale()

  const refreshChoices = async () => {
    fetchChoices(label, locale)
      .then(setChoices)
      .catch((err) => {
        console.error('Error fetching choices:', err?.message ?? err)
        return {}
      })
  }

  useEffect(() => {
    refreshChoices()
  }, [locale])

  return {choices, refreshChoices}
}

export type ChoiceMap = Record<string, string>
export type ChoiceSetter = React.Dispatch<React.SetStateAction<ChoiceMap>>

export type UseAllChoices = {
  interests: ChoiceMap
  causes: ChoiceMap
  work: ChoiceMap
  refreshInterests: () => void
  refreshCauses: () => void
  refreshWork: () => void
}

const useAllChoices = () => {
  const {choices: interests, refreshChoices: refreshInterests} = useChoices('interests')
  const {choices: causes, refreshChoices: refreshCauses} = useChoices('causes')
  const {choices: work, refreshChoices: refreshWork} = useChoices('work')
  return {interests, causes, work, refreshInterests, refreshCauses, refreshWork}
}
