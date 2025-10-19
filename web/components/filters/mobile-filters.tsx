import {ChevronDownIcon, ChevronUpIcon} from '@heroicons/react/outline'
import clsx from 'clsx'
import {ReactNode, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {AgeFilter, AgeFilterText, getNoMinMaxAge} from './age-filter'
import {GenderFilter, GenderFilterText} from './gender-filter'
import {LocationFilter, LocationFilterProps, LocationFilterText,} from './location-filter'
import {RelationshipFilter, RelationshipFilterText,} from './relationship-filter'
import {MyMatchesToggle} from './my-matches-toggle'
import {Profile} from 'common/love/profile'
import {Gender} from 'common/gender'
import {RelationshipType, RomanticType} from 'web/lib/util/convert-relationship-type'
import {FilterFields} from "common/filters";
import {ShortBioToggle} from "web/components/filters/short-bio-toggle";
import {PrefGenderFilter, PrefGenderFilterText} from "./pref-gender-filter"
import {KidsLabel, WantsKidsFilter, WantsKidsIcon} from "web/components/filters/wants-kids-filter";
import {wantsKidsLabels} from "common/wants-kids";
import {FaChild} from "react-icons/fa"
import {HasKidsFilter, HasKidsLabel} from "./has-kids-filter"
import {hasKidsLabels} from "common/has-kids";
import {RomanticFilter, RomanticFilterText} from "web/components/filters/romantic-filter";

function MobileFilters(props: {
  filters: Partial<FilterFields>
  youProfile: Profile | undefined | null
  updateFilter: (newState: Partial<FilterFields>) => void
  clearFilters: () => void
  setYourFilters: (checked: boolean) => void
  isYourFilters: boolean
  locationFilterProps: LocationFilterProps
  includeRelationshipFilters: boolean | undefined
}) {
  const {
    filters,
    youProfile,
    updateFilter,
    clearFilters,
    setYourFilters,
    isYourFilters,
    locationFilterProps,
    includeRelationshipFilters,
  } = props

  const [openFilter, setOpenFilter] = useState<string | undefined>(undefined)

  function hasAny(filterArray: any[] | undefined) {
    return filterArray && filterArray.length > 0
  }

  const [noMinAge, noMaxAge] = getNoMinMaxAge(
    filters.pref_age_min,
    filters.pref_age_max
  )

  return (
    <Col>
      <Col className="p-4 pb-2">
        <MyMatchesToggle
          setYourFilters={setYourFilters}
          youProfile={youProfile}
          on={isYourFilters}
          hidden={!youProfile}
        />
      </Col>

      {/* RELATIONSHIP STYLE */}
      <MobileFilterSection
        title="Seeking"
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.pref_relation_styles)}
        selection={
          <RelationshipFilterText
            relationship={filters.pref_relation_styles as RelationshipType[]}
            highlightedClass={
              hasAny(filters.pref_relation_styles)
                ? 'text-primary-600'
                : 'text-ink-900'
            }
          />
        }
      >
        <RelationshipFilter filters={filters} updateFilter={updateFilter}/>
      </MobileFilterSection>

      {/* LOCATION */}
      <MobileFilterSection
        title="Location"
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={!!locationFilterProps.location}
        selection={
          <LocationFilterText
            location={locationFilterProps.location}
            radius={locationFilterProps.radius}
            youProfile={youProfile}
            highlightedClass={
              !locationFilterProps.location
                ? 'text-ink-900'
                : 'text-primary-600'
            }
          />
        }
      >
        <LocationFilter
          youProfile={youProfile}
          locationFilterProps={locationFilterProps}
        />
      </MobileFilterSection>

      {/* AGE RANGE */}
      <MobileFilterSection
        title="Age"
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        childrenClassName={'pb-6'}
        isActive={!noMinAge || !noMaxAge}
        selection={
          <AgeFilterText
            pref_age_min={filters.pref_age_min}
            pref_age_max={filters.pref_age_max}
            highlightedClass={
              noMinAge && noMaxAge ? 'text-ink-900' : 'text-primary-600'
            }
          />
        }
      >
        <AgeFilter filters={filters} updateFilter={updateFilter}/>
      </MobileFilterSection>

      {/* GENDER */}
      <MobileFilterSection
        title="Gender"
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.genders)}
        selection={
          <GenderFilterText
            gender={filters.genders as Gender[]}
            highlightedClass={
              hasAny(filters.genders) ? 'text-primary-600' : 'text-ink-900'
            }
          />
        }
      >
        <GenderFilter filters={filters} updateFilter={updateFilter}/>
      </MobileFilterSection>

      {/* PREFERRED GENDER */}
      <MobileFilterSection
        title="Gender they seek"
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.pref_gender)}
        selection={
          <PrefGenderFilterText
            pref_gender={filters.pref_gender as Gender[]}
            highlightedClass={
              hasAny(filters.pref_gender) ? 'text-primary-600' : 'text-ink-900'
            }
          />
        }
      >
        <PrefGenderFilter filters={filters} updateFilter={updateFilter}/>
      </MobileFilterSection>

      {includeRelationshipFilters && <>

        {/* ROMANTIC STYLE */}
          <MobileFilterSection
              title="Style"
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
              isActive={hasAny(filters.pref_romantic_styles || undefined)}
              selection={
                <RomanticFilterText
                  relationship={filters.pref_romantic_styles as RomanticType[]}
                  highlightedClass={
                    hasAny(filters.pref_romantic_styles || undefined)
                      ? 'text-primary-600'
                      : 'text-ink-900'
                  }
                />
              }
          >
              <RomanticFilter filters={filters} updateFilter={updateFilter}/>
          </MobileFilterSection>

      {/* WANTS KIDS */}
      <MobileFilterSection
        title="Wants kids"
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={
          filters.wants_kids_strength != null &&
          filters.wants_kids_strength !== -1
        }
        icon={<WantsKidsIcon strength={filters.wants_kids_strength ?? -1}/>}
        selection={
          <KidsLabel
            strength={filters.wants_kids_strength ?? -1}
            highlightedClass={
              (filters.wants_kids_strength ?? -1) ==
              wantsKidsLabels.no_preference.strength
                ? 'text-ink-900'
                : 'text-primary-600'
            }
            mobile
          />
        }
      >
        <WantsKidsFilter filters={filters} updateFilter={updateFilter}/>
      </MobileFilterSection>

      {/* HAS KIDS */}
      <MobileFilterSection
        title="Has kids"
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={filters.has_kids != null && filters.has_kids !== -1}
        icon={<FaChild className="text-ink-900 h-4 w-4"/>}
        selection={
          <HasKidsLabel
            has_kids={filters.has_kids ?? -1}
            highlightedClass={
              (filters.has_kids ?? -1) == hasKidsLabels.no_preference.value
                ? 'text-ink-900'
                : 'text-primary-600'
            }
            mobile
          />
        }
      >
        <HasKidsFilter filters={filters} updateFilter={updateFilter}/>
      </MobileFilterSection>

      </>}

      {/* Short Bios */}
      <Col className="p-4 pb-2">
        <ShortBioToggle
          updateFilter={updateFilter}
          filters={filters}
          hidden={false}
        />
      </Col>
      <button
        className="text-ink-500 hover:text-primary-500 underline"
        onClick={clearFilters}
      >
        Reset filters
      </button>
    </Col>
  )
}

export default MobileFilters

export function MobileFilterSection(props: {
  title: string
  children: ReactNode
  openFilter: string | undefined
  setOpenFilter: (openFilter: string | undefined) => void
  isActive?: boolean
  className?: string
  childrenClassName?: string
  icon?: ReactNode
  selection?: ReactNode
}) {
  const {
    title,
    children,
    openFilter,
    setOpenFilter,
    isActive,
    className,
    childrenClassName,
    icon,
    selection,
  } = props
  const isOpen = openFilter == title
  return (
    <Col className={clsx(className)}>
      <button
        className={clsx(
          'text-ink-600 flex w-full flex-row justify-between px-4 pt-4',
          isOpen ? 'pb-2' : 'pb-4'
        )}
        onClick={() =>
          isOpen ? setOpenFilter(undefined) : setOpenFilter(title)
        }
      >
        <Row
          className={clsx('items-center gap-0.5', isActive && 'font-semibold')}
        >
          {icon}
          {title}: {selection}
        </Row>
        <div className="text-ink-900">
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5"/>
          ) : (
            <ChevronDownIcon className="h-5 w-5"/>
          )}
        </div>
      </button>
      {isOpen && (
        <div className={clsx('bg-canvas-50 px-4 py-2', childrenClassName)}>
          {children}
        </div>
      )}
    </Col>
  )
}
