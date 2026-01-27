import {useEffect} from 'react'
import {run} from 'common/supabase/utils'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {db} from 'web/lib/supabase/db'
import {useLocale} from "web/lib/locale";
import {OptionTableKey} from "common/profiles/constants";

export async function fetchChoices(label: OptionTableKey, locale: string) {
  let choicesById: Record<string, string> = {};
  const {data} = await run(
    db
      .from(label)
      .select(`
        id,
        name,
        ${label}_translations!left (
          locale,
          name
        )
      `)
      .eq(`${label}_translations.locale`, locale)
      .order('name', {ascending: true})
  )

  data.forEach((row: any) => {
    const translated = row[`${label}_translations`]?.[0]?.name ?? row.name
    choicesById[row.id] = translated
  })

  return choicesById
}

export const useChoices = (label: OptionTableKey) => {
  const [choices, setChoices] = usePersistentInMemoryState<Record<string, string>>({}, `${label}-choices`)
  const {locale} = useLocale()

  const refreshChoices = async () => {
    try {
      const results = await fetchChoices(label, locale)
      setChoices(results)
    } catch (err) {
      console.error('Error fetching choices:', err)
      return {}
    }
  }

  useEffect(() => {
    console.log('Fetching choices in use effect...')
    refreshChoices()
  }, [locale])

  return {choices, refreshChoices}
}

export const useAllChoices = () => {
  const {choices: interests, refreshChoices: refreshInterests} = useChoices('interests')
  const {choices: causes, refreshChoices: refreshCauses} = useChoices('causes')
  const {choices: work, refreshChoices: refreshWork} = useChoices('work')
  return {interests, causes, work, refreshInterests, refreshCauses, refreshWork}
}
