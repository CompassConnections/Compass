import {useEffect} from 'react'
import {run} from 'common/supabase/utils'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {db} from 'web/lib/supabase/db'

export async function fetchChoices(label: string) {
  const {data} = await run(db.from(label).select('name').order('name'))
  console.log('Fetched choices:', data)
  const results = Object.fromEntries(data.map((row: { name: string }) => [row.name, row.name]))
  return results;
}

export const useChoices = (label: string) => {
  const [choices, setChoices] = usePersistentInMemoryState({}, `${label}-choices`)

  const refreshChoices = async () => {
    try {
      const results = await fetchChoices(label)
      setChoices(results)
    } catch (err) {
      console.error('Error fetching choices:', err)
      return {}
    }
  }

  useEffect(() => {
    console.log('Fetching choices in use effect...')
    refreshChoices()
  }, [])

  return {choices, refreshChoices}
}
