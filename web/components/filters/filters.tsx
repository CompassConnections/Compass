import {ChevronDownIcon, ChevronUpIcon} from '@heroicons/react/24/outline'
import {XMarkIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {FilterFields} from 'common/filters'
import {formatFilters, SKIPPED_FORMAT_FILTERS_KEYS} from 'common/filters-format'
import {Gender} from 'common/gender'
import {OptionTableKey} from 'common/profiles/constants'
import {Profile} from 'common/profiles/profile'
import {DisplayOptions} from 'common/profiles-rendering'
import {nullifyDictValues, removeNullOrUndefinedProps, sampleDictByPrefix} from 'common/util/object'
import {ReactNode, useState} from 'react'
import {
  Big5Filters,
  Big5FilterText,
  countBig5Filters,
  hasAnyBig5Filter,
} from 'web/components/filters/big5-filter'
import {CardSizeSelector} from 'web/components/filters/card-size-selector'
import {DietFilter, DietFilterText} from 'web/components/filters/diet-filter'
import {EducationFilter, EducationFilterText} from 'web/components/filters/education-filter'
import {FieldToggles} from 'web/components/filters/field-toggles'
import {HasPhotoFilter} from 'web/components/filters/has-photo-filter'
import {InterestFilter, InterestFilterText} from 'web/components/filters/interest-filter'
import {LanguageFilter, LanguageFilterText} from 'web/components/filters/language-filter'
import {MbtiFilter, MbtiFilterText} from 'web/components/filters/mbti-filter'
import {PoliticalFilter, PoliticalFilterText} from 'web/components/filters/political-filter'
import {
  RelationshipStatusFilter,
  RelationshipStatusFilterText,
} from 'web/components/filters/relationship-status-filter'
import {ReligionFilter, ReligionFilterText} from 'web/components/filters/religion-filter'
import {RomanticFilter, RomanticFilterText} from 'web/components/filters/romantic-filter'
import {ShortBioToggle} from 'web/components/filters/short-bio-toggle'
import {KidsLabel, WantsKidsFilter} from 'web/components/filters/wants-kids-filter'
import {FilterGuide} from 'web/components/guidance'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {NewBadge} from 'web/components/new-badge'
import {ResetFiltersButton} from 'web/components/searches/button'
import {useChoicesContext} from 'web/hooks/use-choices'
import {useMeasurementSystem} from 'web/hooks/use-measurement-system'
import {useT} from 'web/lib/locale'
import {DietType, RelationshipType, RomanticType} from 'web/lib/util/convert-types'

import {AgeFilter, AgeFilterText, getNoMinMaxAge} from './age-filter'
import {CannabisFilter, CannabisFilterText} from './cannabis-filter'
import {DrinksFilter, DrinksFilterText, getNoMinMaxDrinks} from './drinks-filter'
import {GenderFilter, GenderFilterText} from './gender-filter'
import {HasKidsFilter, HasKidsLabel} from './has-kids-filter'
import {LastActiveFilter, LastActiveFilterText} from './last-active-filter'
import {LocationFilter, LocationFilterProps, LocationFilterText} from './location-filter'
import {MyMatchesToggle} from './my-matches-toggle'
import {PsychedelicsFilter, PsychedelicsFilterText} from './psychedelics-filter'
import {RelationshipFilter, RelationshipFilterText} from './relationship-filter'
import {SmokerFilter, SmokerFilterText} from './smoker-filter'

function countActiveFilters(
  filters: Partial<FilterFields>,
  locationFilterProps: LocationFilterProps,
  raisedInLocationFilterProps: LocationFilterProps,
) {
  const keys = Object.keys(filters).filter((key) => !key.startsWith('big5_'))
  let count = keys.length
  if (locationFilterProps.location) count = count - 2
  if (raisedInLocationFilterProps.location) count = count - 2
  if (filters.pref_age_min && filters.pref_age_max) count--
  const big5Count = countBig5Filters(filters)
  if (big5Count > 0) count++
  return count
}

function SelectedFiltersSummary(props: {
  filters: Partial<FilterFields>
  locationFilterProps: LocationFilterProps
  raisedInLocationFilterProps: LocationFilterProps
  updateFilter: (newState: Partial<FilterFields>) => void
  clearFilters: () => void
}) {
  const {locationFilterProps, raisedInLocationFilterProps, updateFilter, clearFilters} = props
  const t = useT()
  const choicesIdsToLabels = useChoicesContext()
  const {measurementSystem} = useMeasurementSystem()

  const filters = removeNullOrUndefinedProps({...props.filters, orderBy: undefined})
  const filterCount = countActiveFilters(filters, locationFilterProps, raisedInLocationFilterProps)

  if (filterCount === 0) return null

  const selectedFilters: {label: string; onClear: () => void}[] = []

  function formatLabel(filters: any) {
    return String(
      formatFilters(
        filters,
        locationFilterProps.location as any,
        choicesIdsToLabels,
        measurementSystem,
        t,
      )?.join(' • ') || Object.values(filters)[0],
    )
  }

  Object.entries(filters).forEach(([key, value]) => {
    const typedKey = key as keyof FilterFields
    if (value === undefined || value === null) return
    if (SKIPPED_FORMAT_FILTERS_KEYS.includes(typedKey)) return
    selectedFilters.push({
      label: formatLabel({[key]: value}),
      onClear: () => updateFilter({[key]: undefined}),
    })
  })

  if (locationFilterProps.location) {
    selectedFilters.push({
      label: locationFilterProps.location.name || t('filter.location', 'Location'),
      onClear: () => {
        locationFilterProps.setLocation(null)
        updateFilter({geodbCityIds: undefined, lat: undefined, lon: undefined, radius: undefined})
      },
    })
  }

  if (raisedInLocationFilterProps.location) {
    let label = t('filter.raised_in', 'Grew up')
    if (raisedInLocationFilterProps.location.name)
      label = `${label}: ${raisedInLocationFilterProps.location.name}`
    selectedFilters.push({
      label: label,
      onClear: () => {
        raisedInLocationFilterProps.setLocation(null)
        updateFilter({
          raised_in_lat: undefined,
          raised_in_lon: undefined,
          raised_in_radius: undefined,
        })
      },
    })
  }

  function formatAggregatedFields(prefix: string) {
    const aggFilters = sampleDictByPrefix(filters, prefix)
    if (Object.keys(aggFilters).length > 0) {
      selectedFilters.push({
        label: formatLabel(aggFilters),
        onClear: () => updateFilter(nullifyDictValues(aggFilters)),
      })
    }
  }

  formatAggregatedFields('pref_age')
  formatAggregatedFields('big5')
  formatAggregatedFields('drink')

  if (filters.shortBio) {
    selectedFilters.push({
      label: t('filter.short_bio_toggle', 'Include incomplete profiles'),
      onClear: () => updateFilter({shortBio: undefined}),
    })
  }

  return (
    <Col className="px-4 py-2 gap-2">
      <Row className="items-center justify-between">
        <Row className="items-center gap-2">
          <span className="font-semibold text-sm">{filterCount}</span>
          <span className="text-sm text-ink-600">
            {filterCount === 1
              ? t('filter.selected', 'filter selected')
              : t('filter.selected_plural', 'filters selected')}
          </span>
        </Row>
        <ResetFiltersButton clearFilters={clearFilters} />
      </Row>
      <Row className="flex-wrap gap-2">
        {selectedFilters.map((filter, idx) => (
          <Row
            key={idx}
            className="items-center gap-1 text-primary-700 pl-3 pr-2 py-1 rounded-full text-sm bg-gray-100/70 dark:bg-gray-900"
          >
            <span>{filter.label}</span>
            <button
              onClick={filter.onClear}
              className="hover:text-gray-500 dark:hover:text-gray-50"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </Row>
        ))}
      </Row>
    </Col>
  )
}

function Filters(props: {
  youProfile: Profile | undefined | null
  filters: Partial<FilterFields>
  updateFilter: (newState: Partial<FilterFields>) => void
  clearFilters: () => void
  setYourFilters: (checked: boolean) => void
  isYourFilters: boolean
  locationFilterProps: LocationFilterProps
  raisedInLocationFilterProps: LocationFilterProps
  includeRelationshipFilters: boolean | undefined
  choices: Record<OptionTableKey, Record<string, string>>
  displayOptions: Partial<DisplayOptions>
  updateDisplayOptions: (newState: Partial<DisplayOptions>) => void
}) {
  const t = useT()
  const {
    filters,
    youProfile,
    updateFilter,
    clearFilters,
    setYourFilters,
    isYourFilters,
    locationFilterProps,
    raisedInLocationFilterProps,
    includeRelationshipFilters,
    displayOptions,
    updateDisplayOptions,
    choices,
  } = props

  const [openFilter, setOpenFilter] = useState<string | undefined>(undefined)
  const [openGroup, setOpenGroup] = useState<string | undefined>(undefined)

  function hasAny(filterArray: any[] | undefined | null): boolean {
    return !!filterArray && filterArray.length > 0
  }

  const [noMinAge, noMaxAge] = getNoMinMaxAge(filters.pref_age_min, filters.pref_age_max)

  return (
    <Col className="mb-[calc(var(--filter-offset)+env(safe-area-inset-bottom))] mt-[calc(var(--filter-offset)+env(safe-area-inset-top))] pt-3 pb-1">
      <SelectedFiltersSummary
        filters={filters}
        locationFilterProps={locationFilterProps}
        raisedInLocationFilterProps={raisedInLocationFilterProps}
        updateFilter={updateFilter}
        clearFilters={clearFilters}
      />
      <FilterGuide className={'justify-between px-4 py-2'} />

      <Row className="justify-between px-4">
        <Col className="py-2">
          <MyMatchesToggle
            setYourFilters={setYourFilters}
            youProfile={youProfile}
            on={isYourFilters}
            hidden={!youProfile}
          />
        </Col>
      </Row>

      {/* Short Bios */}
      <Col className="p-4 pb-2">
        <ShortBioToggle updateFilter={updateFilter} filters={filters} hidden={false} />
      </Col>

      {/* ALWAYS VISIBLE FILTERS */}

      {/* CONNECTION - Always visible */}
      <FilterSection
        title={t('profile.seeking', 'Seeking')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.pref_relation_styles)}
        // icon={<FaUserGroup className="h-4 w-4" />}
        selection={
          <RelationshipFilterText
            relationship={filters.pref_relation_styles as RelationshipType[]}
            highlightedClass={
              hasAny(filters.pref_relation_styles) ? 'text-primary-600' : 'text-ink-900'
            }
          />
        }
      >
        <RelationshipFilter filters={filters} updateFilter={updateFilter} />
      </FilterSection>

      {/* LOCATION - Always visible */}
      <FilterSection
        title={t('profile.optional.location', 'Living')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={!!locationFilterProps.location}
        selection={
          <LocationFilterText
            location={locationFilterProps.location}
            radius={locationFilterProps.radius}
            youProfile={youProfile}
            highlightedClass={!locationFilterProps.location ? 'text-ink-900' : 'text-primary-600'}
          />
        }
      >
        <LocationFilter youProfile={youProfile} locationFilterProps={locationFilterProps} />
      </FilterSection>

      {/* AGE RANGE - Always visible */}
      <FilterSection
        title={t('profile.optional.age', 'Age')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        childrenClassName={'pb-6'}
        isActive={!noMinAge || !noMaxAge}
        selection={
          <AgeFilterText
            pref_age_min={filters.pref_age_min}
            pref_age_max={filters.pref_age_max}
            highlightedClass={noMinAge && noMaxAge ? 'text-ink-900' : 'text-primary-600'}
          />
        }
      >
        <AgeFilter filters={filters} updateFilter={updateFilter} />
      </FilterSection>

      {/* GENDER - Always visible */}
      <FilterSection
        title={t('profile.optional.gender', 'Gender')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.genders)}
        selection={
          <GenderFilterText
            gender={filters.genders as Gender[]}
            highlightedClass={hasAny(filters.genders) ? 'text-primary-600' : 'text-ink-900'}
          />
        }
      >
        <GenderFilter filters={filters} updateFilter={updateFilter} />
      </FilterSection>

      {/* ACCORDION GROUPS */}

      {/* Relationship Group */}
      {includeRelationshipFilters && (
        <FilterGroup
          title={t('filter.group.relationship', 'Relationship')}
          openGroup={openGroup}
          setOpenGroup={setOpenGroup}
          // icon={<FaHeart className="h-4 w-4" />}
        >
          {/* Relationship Status */}
          <FilterSection
            title={t('profile.optional.relationship_status', 'Status')}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            isActive={hasAny(filters.relationship_status || undefined)}
            selection={
              <RelationshipStatusFilterText
                options={filters.relationship_status as string[]}
                defaultLabel={t('filter.relationship_status.any', 'Any')}
                highlightedClass={
                  hasAny(filters.relationship_status || undefined)
                    ? 'text-primary-600'
                    : 'text-ink-900'
                }
              />
            }
          >
            <RelationshipStatusFilter filters={filters} updateFilter={updateFilter} />
          </FilterSection>

          {/* Romantic Style */}
          <FilterSection
            title={t('profile.romantic.style', 'Style')}
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
            <RomanticFilter filters={filters} updateFilter={updateFilter} />
          </FilterSection>

          {/* Has Kids */}
          <FilterSection
            title={t('profile.optional.has_kids', 'Has kids')}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            isActive={filters.has_kids != null && filters.has_kids !== -1}
            selection={
              <HasKidsLabel
                has_kids={filters.has_kids ?? -1}
                highlightedClass={
                  filters.has_kids != null && filters.has_kids !== -1
                    ? 'text-primary-600'
                    : 'text-ink-900'
                }
              />
            }
          >
            <HasKidsFilter filters={filters} updateFilter={updateFilter} />
          </FilterSection>

          {/* Wants Kids */}
          <FilterSection
            title={t('filter.wants_kids.wants_kids', 'Wants kids')}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            isActive={filters.wants_kids_strength != null && filters.wants_kids_strength !== -1}
            selection={
              <KidsLabel
                strength={filters.wants_kids_strength ?? -1}
                highlightedClass={
                  filters.wants_kids_strength != null && filters.wants_kids_strength !== -1
                    ? 'text-primary-600'
                    : 'text-ink-900'
                }
              />
            }
          >
            <WantsKidsFilter filters={filters} updateFilter={updateFilter} />
          </FilterSection>
        </FilterGroup>
      )}

      {/* Background Group */}
      <FilterGroup
        title={t('filter.group.background', 'Background')}
        openGroup={openGroup}
        setOpenGroup={setOpenGroup}
        // icon={<BsPersonHeart className="h-4 w-4" />}
      >
        <FilterSection
          title={t('profile.optional.raised_in', 'Grew up')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={!!raisedInLocationFilterProps.location}
          selection={
            <LocationFilterText
              location={raisedInLocationFilterProps.location}
              radius={raisedInLocationFilterProps.radius}
              labelPrefix={t('filter.raised_in', 'Grew up')}
              youProfile={youProfile}
              highlightedClass={
                !raisedInLocationFilterProps.location ? 'text-ink-900' : 'text-primary-600'
              }
            />
          }
        >
          <LocationFilter
            youProfile={youProfile}
            locationFilterProps={raisedInLocationFilterProps}
          />
        </FilterSection>

        <FilterSection
          title={t('profile.optional.education_level', 'Education')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={hasAny(filters.education_levels)}
          selection={
            <EducationFilterText
              options={filters.education_levels as string[]}
              highlightedClass={
                hasAny(filters.education_levels) ? 'text-primary-600' : 'text-ink-900'
              }
            />
          }
        >
          <EducationFilter filters={filters} updateFilter={updateFilter} />
        </FilterSection>

        <FilterSection
          title={t('profile.optional.work', 'Work')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={hasAny(filters.work || undefined)}
          selection={
            <InterestFilterText
              options={filters.work as string[] | undefined}
              label={'work'}
              highlightedClass={
                hasAny(filters.work || undefined) ? 'text-primary-600' : 'text-ink-900'
              }
            />
          }
        >
          <InterestFilter
            filters={filters}
            updateFilter={updateFilter}
            choices={choices.work}
            label="work"
          />
        </FilterSection>
      </FilterGroup>

      {/* Lifestyle Group */}
      <FilterGroup
        title={t('filter.group.lifestyle', 'Lifestyle')}
        openGroup={openGroup}
        setOpenGroup={setOpenGroup}
        // icon={<GiFruitBowl className="h-4 w-4" />}
      >
        <FilterSection
          title={t('profile.optional.interests', 'Interests')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={hasAny(filters.interests || undefined)}
          selection={
            <InterestFilterText
              options={filters.interests as string[] | undefined}
              label={'interests'}
              highlightedClass={
                hasAny(filters.interests || undefined) ? 'text-primary-600' : 'text-ink-900'
              }
            />
          }
        >
          <InterestFilter
            filters={filters}
            updateFilter={updateFilter}
            choices={choices.interests}
            label="interests"
          />
        </FilterSection>

        <FilterSection
          title={t('profile.optional.causes', 'Causes')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={hasAny(filters.causes || undefined)}
          selection={
            <InterestFilterText
              options={filters.causes as string[] | undefined}
              label={'causes'}
              highlightedClass={
                hasAny(filters.causes || undefined) ? 'text-primary-600' : 'text-ink-900'
              }
            />
          }
        >
          <InterestFilter
            filters={filters}
            updateFilter={updateFilter}
            choices={choices.causes}
            label="causes"
          />
        </FilterSection>

        <FilterSection
          title={t('profile.optional.diet', 'Diet')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={hasAny(filters.diet || undefined)}
          selection={
            <DietFilterText
              options={filters.diet as DietType[] | undefined}
              highlightedClass={
                hasAny(filters.diet || undefined) ? 'text-primary-600' : 'text-ink-900'
              }
            />
          }
        >
          <DietFilter filters={filters} updateFilter={updateFilter} />
        </FilterSection>

        <FilterSection
          title={t('profile.optional.drinks_per_month', 'Drinks')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={(() => {
            const [noMinDrinks, noMaxDrinks] = getNoMinMaxDrinks(
              filters.drinks_min,
              filters.drinks_max,
            )
            return !noMinDrinks || !noMaxDrinks
          })()}
          selection={
            <DrinksFilterText
              drinks_min={filters.drinks_min}
              drinks_max={filters.drinks_max}
              highlightedClass={(() => {
                const [noMinDrinks, noMaxDrinks] = getNoMinMaxDrinks(
                  filters.drinks_min,
                  filters.drinks_max,
                )
                return noMinDrinks && noMaxDrinks ? 'text-ink-900' : 'text-primary-600'
              })()}
            />
          }
        >
          <DrinksFilter filters={filters} updateFilter={updateFilter} />
        </FilterSection>

        <FilterSection
          title={t('profile.optional.is_smoker', 'Smoker')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={filters.is_smoker != null}
          selection={
            <SmokerFilterText
              is_smoker={filters.is_smoker}
              highlightedClass={filters.is_smoker == null ? 'text-ink-900' : 'text-primary-600'}
            />
          }
        >
          <SmokerFilter filters={filters} updateFilter={updateFilter} />
        </FilterSection>

        <FilterSection
          title={t('profile.optional.psychedelics', 'Psychedelics')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={hasAny(filters.psychedelics || undefined)}
          selection={
            <PsychedelicsFilterText
              options={filters.psychedelics as string[] | undefined}
              highlightedClass={
                hasAny(filters.psychedelics || undefined) ? 'text-primary-600' : 'text-ink-900'
              }
            />
          }
        >
          <PsychedelicsFilter filters={filters} updateFilter={updateFilter} />
        </FilterSection>

        <FilterSection
          title={t('profile.optional.cannabis', 'Cannabis')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={hasAny(filters.cannabis || undefined)}
          selection={
            <CannabisFilterText
              options={filters.cannabis as string[] | undefined}
              highlightedClass={
                hasAny(filters.cannabis || undefined) ? 'text-primary-600' : 'text-ink-900'
              }
            />
          }
        >
          <CannabisFilter filters={filters} updateFilter={updateFilter} />
        </FilterSection>

        <FilterSection
          title={t('profile.optional.languages', 'Languages')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={hasAny(filters.languages || undefined)}
          selection={
            <LanguageFilterText
              options={filters.languages as string[] | undefined}
              highlightedClass={
                hasAny(filters.languages || undefined) ? 'text-primary-600' : 'text-ink-900'
              }
            />
          }
        >
          <LanguageFilter filters={filters} updateFilter={updateFilter} />
        </FilterSection>
      </FilterGroup>

      {/* Values & Beliefs Group */}
      <FilterGroup
        title={t('filter.group.values', 'Values & Beliefs')}
        openGroup={openGroup}
        setOpenGroup={setOpenGroup}
        // icon={<RiScales3Line className="h-4 w-4" />}
      >
        <FilterSection
          title={t('profile.optional.politics', 'Politics')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={hasAny(filters.political_beliefs || undefined)}
          selection={
            <PoliticalFilterText
              options={filters.political_beliefs as string[] | undefined}
              highlightedClass={
                hasAny(filters.political_beliefs || undefined) ? 'text-primary-600' : 'text-ink-900'
              }
            />
          }
        >
          <PoliticalFilter filters={filters} updateFilter={updateFilter} />
        </FilterSection>

        <FilterSection
          title={t('profile.optional.religion', 'Religion')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={hasAny(filters.religion || undefined)}
          selection={
            <ReligionFilterText
              options={filters.religion as string[] | undefined}
              highlightedClass={
                hasAny(filters.religion || undefined) ? 'text-primary-600' : 'text-ink-900'
              }
            />
          }
        >
          <ReligionFilter filters={filters} updateFilter={updateFilter} className={''} />
        </FilterSection>
      </FilterGroup>

      {/* Personality Group */}
      <FilterGroup
        title={t('filter.group.personality', 'Personality')}
        openGroup={openGroup}
        setOpenGroup={setOpenGroup}
        // icon={<BsPersonVcard className="h-4 w-4" />}
      >
        <FilterSection
          title={t('profile.optional.mbti', 'MBTI')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={hasAny(filters.mbti)}
          selection={
            <MbtiFilterText
              options={filters.mbti as string[] | undefined}
              defaultLabel={t('filter.any_mbti', 'Any MBTI')}
              highlightedClass={hasAny(filters.mbti) ? 'text-primary-600' : 'text-ink-900'}
            />
          }
        >
          <MbtiFilter filters={filters} updateFilter={updateFilter} />
        </FilterSection>

        <FilterSection
          title={t('profile.optional.big5', 'Big Five')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={hasAnyBig5Filter(filters)}
          selection={
            <Big5FilterText
              filters={filters}
              highlightedClass={hasAnyBig5Filter(filters) ? 'text-primary-600' : 'text-ink-900'}
            />
          }
        >
          <Big5Filters filters={filters} updateFilter={updateFilter} />
        </FilterSection>
      </FilterGroup>

      {/* Advanced */}
      <FilterGroup
        title={t('filter.group.advanced', 'Advanced')}
        openGroup={openGroup}
        setOpenGroup={setOpenGroup}
      >
        {/* LAST ACTIVE */}
        <FilterSection
          title={t('filter.last_active.title', 'Last active')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={!!filters.last_active}
          selection={
            <LastActiveFilterText
              last_active={filters.last_active}
              highlightedClass={!filters.last_active ? 'text-ink-900' : 'text-primary-600'}
            />
          }
        >
          <LastActiveFilter filters={filters} updateFilter={updateFilter} />
        </FilterSection>

        {/* HAS PHOTO */}
        <FilterSection
          title={t('filter.has_photo.title', 'Has photos')}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          isActive={!!filters.hasPhoto}
          selection={
            <span className={clsx(!filters.hasPhoto ? 'text-ink-900' : 'text-primary-600')}>
              {filters.hasPhoto
                ? t('filter.has_photo', 'Has photos')
                : t('filter.has_photo.photos', 'Photos')}
            </span>
          }
        >
          <HasPhotoFilter filters={filters} updateFilter={updateFilter} />
        </FilterSection>
      </FilterGroup>

      <hr className="border-gray-500 my-2 mx-4" />

      {/* Rendering */}
      <FilterGroup
        title={t('filter.group.display', 'Display')}
        openGroup={openGroup}
        setOpenGroup={setOpenGroup}
      >
        <div className="px-4">
          <CardSizeSelector
            updateDisplayOptions={updateDisplayOptions}
            displayOptions={displayOptions}
          />
        </div>
        <Col className="p-4">
          <FieldToggles
            updateDisplayOptions={updateDisplayOptions}
            displayOptions={displayOptions}
          />
        </Col>
      </FilterGroup>
    </Col>
  )
}

export function FilterSection(props: {
  title: string
  children: ReactNode
  openFilter: string | undefined
  setOpenFilter: (openFilter: string | undefined) => void
  isActive?: boolean
  className?: string
  childrenClassName?: string
  icon?: ReactNode
  selection?: ReactNode
  showNewBadge?: boolean
  newBadgeClassName?: string
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
    showNewBadge,
    newBadgeClassName,
  } = props
  const isOpen = openFilter == title
  return (
    <Col className={clsx(className)}>
      <button
        className={clsx(
          'text-ink-600 flex w-full flex-row justify-between px-4 pt-4 relative hover-bold',
          isOpen ? 'pb-2' : 'pb-4',
        )}
        onClick={() => (isOpen ? setOpenFilter(undefined) : setOpenFilter(title))}
      >
        {showNewBadge && <NewBadge classes={newBadgeClassName} />}
        <Row className={clsx('items-center gap-2', isActive && 'font-semibold')}>
          {icon}
          {selection}
        </Row>
        <div className="text-ink-900">
          {isOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
      </button>
      {isOpen && <div className={clsx('px-4 py-2', childrenClassName)}>{children}</div>}
    </Col>
  )
}

function FilterGroup(props: {
  title: string
  children: ReactNode
  openGroup: string | undefined
  setOpenGroup: (openGroup: string | undefined) => void
  icon?: ReactNode
}) {
  const {title, children, openGroup, setOpenGroup, icon} = props
  const isOpen = openGroup === title
  return (
    <Col className="border-t border-ink-200">
      <button
        className="flex w-full flex-row items-center justify-between px-4 py-3 text-ink-600"
        onClick={() => (isOpen ? setOpenGroup(undefined) : setOpenGroup(title))}
      >
        <Row className="items-center gap-2 font-semibold">
          {icon}
          {title}
        </Row>
        {isOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
      </button>
      {isOpen && <div className="px-2 pb-4">{children}</div>}
    </Col>
  )
}

export function FiltersElement(props: {
  filters: Partial<FilterFields>
  youProfile: Profile | undefined | null
  updateFilter: (newState: Partial<FilterFields>) => void
  clearFilters: () => void
  setYourFilters: (checked: boolean) => void
  isYourFilters: boolean
  locationFilterProps: LocationFilterProps
  raisedInLocationFilterProps: LocationFilterProps
  displayOptions: Partial<DisplayOptions>
  updateDisplayOptions: (newState: Partial<DisplayOptions>) => void
}) {
  const {
    filters,
    youProfile,
    updateFilter,
    clearFilters,
    setYourFilters,
    isYourFilters,
    locationFilterProps,
    raisedInLocationFilterProps,
    displayOptions,
    updateDisplayOptions,
  } = props
  const youSeekingRelationship = youProfile?.pref_relation_styles?.includes('relationship')
  const _choices = useChoicesContext()
  const choices = {interests: _choices.interests, causes: _choices.causes, work: _choices.work}
  return (
    <Filters
      filters={filters}
      youProfile={youProfile}
      updateFilter={updateFilter}
      clearFilters={clearFilters}
      setYourFilters={setYourFilters}
      isYourFilters={isYourFilters}
      locationFilterProps={locationFilterProps}
      raisedInLocationFilterProps={raisedInLocationFilterProps}
      includeRelationshipFilters={youSeekingRelationship}
      choices={choices}
      displayOptions={displayOptions}
      updateDisplayOptions={updateDisplayOptions}
    />
  )
}
