import {FilterFields, initialFilters} from "common/filters";
import {isEqual} from "lodash";
import {useMemo} from "react";

export function useIsClearedFilters(filters: Partial<FilterFields>): boolean {
  return useMemo(() =>
    isEqual(
      {...filters, orderBy: undefined},
      {...initialFilters, orderBy: undefined}
    ), [filters]
  )
}