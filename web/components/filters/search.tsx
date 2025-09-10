import { Lover, LoverRow } from 'common/love/lover'
import { useState } from 'react'
import { IoFilterSharp } from 'react-icons/io5'
import { Button } from 'web/components/buttons/button'
import { Col } from 'web/components/layout/col'
import { RightModal } from 'web/components/layout/right-modal'
import { Row } from 'web/components/layout/row'
import { Input } from 'web/components/widgets/input'
import { Select } from 'web/components/widgets/select'
import { DesktopFilters } from './desktop-filters'
import { LocationFilterProps } from './location-filter'
import { MobileFilters } from './mobile-filters'

export type FilterFields = {
  orderBy: 'last_online_time' | 'created_time' | 'compatibility_score'
  geodbCityIds: string[] | null
  genders: string[]
  name: string | undefined
} & Pick<
  LoverRow,
  | 'wants_kids_strength'
  | 'pref_relation_styles'
  | 'is_smoker'
  | 'has_kids'
  | 'pref_gender'
  | 'pref_age_min'
  | 'pref_age_max'
>

function isOrderBy(input: string): input is FilterFields['orderBy'] {
  return ['last_online_time', 'created_time', 'compatibility_score'].includes(
    input
  )
}

export const Search = (props: {
  youLover: Lover | undefined | null
  starredUserIds: string[]
  // filter props
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
  clearFilters: () => void
  setYourFilters: (checked: boolean) => void
  isYourFilters: boolean
  locationFilterProps: LocationFilterProps
}) => {
  const {
    youLover,
    updateFilter,
    clearFilters,
    setYourFilters,
    isYourFilters,
    locationFilterProps,
    filters,
  } = props

  const [openFiltersModal, setOpenFiltersModal] = useState(false)

  return (
    <Col className={'text-ink-600 w-full gap-2 py-2 text-sm'}>
      <Row className={'mb-2 justify-between gap-2'}>
        <Input
          value={filters.name ?? ''}
          placeholder={'Search anything...'}
          className={'w-full max-w-xs'}
          onChange={(e) => {
            updateFilter({ name: e.target.value })
          }}
        />

        <Row className="gap-2">
          <Select
            onChange={(e) => {
              if (isOrderBy(e.target.value)) {
                updateFilter({
                  orderBy: e.target.value,
                })
              }
            }}
            value={filters.orderBy || 'created_time'}
            className={'w-18 border-ink-300 rounded-md'}
          >
            <option value="created_time">New</option>
            {youLover && (
              <option value="compatibility_score">Compatible</option>
            )}
            <option value="last_online_time">Active</option>
          </Select>
          <Button
            color="none"
            size="sm"
            className="border-ink-300 border sm:hidden "
            onClick={() => setOpenFiltersModal(true)}
          >
            <IoFilterSharp className="h-5 w-5" />
          </Button>
        </Row>
      </Row>
      <Row
        className={
          'border-ink-300 dark:border-ink-300 hidden flex-wrap items-center gap-4 pb-4 pt-1 sm:inline-flex'
        }
      >
        <DesktopFilters
          filters={filters}
          youLover={youLover}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
          setYourFilters={setYourFilters}
          isYourFilters={isYourFilters}
          locationFilterProps={locationFilterProps}
        />
      </Row>
      <RightModal
        className="bg-canvas-0 w-2/3 text-sm sm:hidden"
        open={openFiltersModal}
        setOpen={setOpenFiltersModal}
      >
        <MobileFilters
          filters={filters}
          youLover={youLover}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
          setYourFilters={setYourFilters}
          isYourFilters={isYourFilters}
          locationFilterProps={locationFilterProps}
        />
      </RightModal>
    </Col>
  )
}
