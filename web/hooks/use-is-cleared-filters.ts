import {FilterFields, initialFilters} from 'common/filters'
import {isEqual} from 'lodash'
import {useMemo} from 'react'
import {removeNullOrUndefinedProps} from 'common/util/object'

export function useIsClearedFilters(filters: Partial<FilterFields>): boolean {
  return useMemo(
    () =>
      isEqual(
        removeNullOrUndefinedProps({...filters, orderBy: undefined}),
        removeNullOrUndefinedProps({...initialFilters, orderBy: undefined}),
      ),
    [filters],
  )
}
