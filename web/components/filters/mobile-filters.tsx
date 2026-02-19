import {ChevronDownIcon, ChevronUpIcon} from '@heroicons/react/outline'
import clsx from 'clsx'
import {FilterFields} from 'common/filters'
import {Gender} from 'common/gender'
import {hasKidsLabels} from 'common/has-kids'
import {OptionTableKey} from 'common/profiles/constants'
import {Profile} from 'common/profiles/profile'
import {wantsKidsLabels} from 'common/wants-kids'
import {ReactNode, useState} from 'react'
import {BsPersonHeart, BsPersonVcard} from 'react-icons/bs'
import {FaBriefcase, FaHandsHelping, FaHeart, FaStar} from 'react-icons/fa'
import {FaUserGroup} from 'react-icons/fa6'
import {GiFruitBowl} from 'react-icons/gi'
import {LuCigarette, LuGraduationCap} from 'react-icons/lu'
import {MdLanguage, MdLocalBar} from 'react-icons/md'
import {PiHandsPrayingBold} from 'react-icons/pi'
import {RiScales3Line} from 'react-icons/ri'
import {Big5Filters, Big5FilterText, hasAnyBig5Filter} from 'web/components/filters/big5-filter'
import {DietFilter, DietFilterText} from 'web/components/filters/diet-filter'
import {EducationFilter, EducationFilterText} from 'web/components/filters/education-filter'
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
import {useT} from 'web/lib/locale'
import {DietType, RelationshipType, RomanticType} from 'web/lib/util/convert-types'

import {AgeFilter, AgeFilterText, getNoMinMaxAge} from './age-filter'
import {DrinksFilter, DrinksFilterText, getNoMinMaxDrinks} from './drinks-filter'
import {GenderFilter, GenderFilterText} from './gender-filter'
import {HasKidsFilter, HasKidsLabel} from './has-kids-filter'
import {LocationFilter, LocationFilterProps, LocationFilterText} from './location-filter'
import {MyMatchesToggle} from './my-matches-toggle'
import {RelationshipFilter, RelationshipFilterText} from './relationship-filter'
import {SmokerFilter, SmokerFilterText} from './smoker-filter'

function MobileFilters(props: {
  filters: Partial<FilterFields>
  youProfile: Profile | undefined | null
  updateFilter: (newState: Partial<FilterFields>) => void
  clearFilters: () => void
  setYourFilters: (checked: boolean) => void
  isYourFilters: boolean
  locationFilterProps: LocationFilterProps
  includeRelationshipFilters: boolean | undefined
  choices: Record<OptionTableKey, Record<string, string>>
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
    includeRelationshipFilters,
    choices,
  } = props

  const [openFilter, setOpenFilter] = useState<string | undefined>(undefined)

  function hasAny(filterArray: any[] | undefined | null): boolean {
    return !!filterArray && filterArray.length > 0
  }

  const [noMinAge, noMaxAge] = getNoMinMaxAge(filters.pref_age_min, filters.pref_age_max)

  return (
    <Col className="mb-[calc(20px+env(safe-area-inset-bottom))] mt-[calc(20px+env(safe-area-inset-top))]">
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
        <ResetFiltersButton clearFilters={clearFilters} />
      </Row>

      {/* Short Bios */}
      <Col className="p-4 pb-2">
        <ShortBioToggle updateFilter={updateFilter} filters={filters} hidden={false} />
      </Col>

      {/* CONNECTION */}
      <MobileFilterSection
        title={t('profile.seeking', 'Seeking')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.pref_relation_styles)}
        icon={<FaUserGroup className="h-4 w-4" />}
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
      </MobileFilterSection>

      {/* Relationship Status */}
      <MobileFilterSection
        title={t('profile.optional.relationship_status', 'Relationship status')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.relationship_status || undefined)}
        icon={<BsPersonHeart className="h-4 w-4" />}
        selection={
          <RelationshipStatusFilterText
            options={filters.relationship_status as string[]}
            defaultLabel={t('filter.relationship_status.any', 'Any relationship status')}
            highlightedClass={
              hasAny(filters.relationship_status || undefined) ? 'text-primary-600' : 'text-ink-900'
            }
          />
        }
      >
        <RelationshipStatusFilter filters={filters} updateFilter={updateFilter} />
      </MobileFilterSection>

      {/* LOCATION */}
      <MobileFilterSection
        title={t('profile.optional.location', 'Location')}
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
      </MobileFilterSection>

      {/* AGE RANGE */}
      <MobileFilterSection
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
      </MobileFilterSection>

      {/* GENDER */}
      <MobileFilterSection
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
      </MobileFilterSection>

      {/* PREFERRED GENDER */}
      {/*<MobileFilterSection*/}
      {/*  title={t('filter.gender.they_seek', 'Gender they seek')}*/}
      {/*  openFilter={openFilter}*/}
      {/*  setOpenFilter={setOpenFilter}*/}
      {/*  isActive={hasAny(filters.pref_gender)}*/}
      {/*  selection={*/}
      {/*    <PrefGenderFilterText*/}
      {/*      pref_gender={filters.pref_gender as Gender[]}*/}
      {/*      highlightedClass={*/}
      {/*        hasAny(filters.pref_gender) ? 'text-primary-600' : 'text-ink-900'*/}
      {/*      }*/}
      {/*    />*/}
      {/*  }*/}
      {/*>*/}
      {/*  <PrefGenderFilter filters={filters} updateFilter={updateFilter}/>*/}
      {/*</MobileFilterSection>*/}

      {includeRelationshipFilters && (
        <>
          {/* ROMANTIC STYLE */}
          <MobileFilterSection
            title={t('profile.romantic.style', 'Style')}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            isActive={hasAny(filters.pref_romantic_styles || undefined)}
            icon={<FaHeart className="h-4 w-4" />}
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
          </MobileFilterSection>

          {/* WANTS KIDS */}
          <MobileFilterSection
            title={t('filter.wants_kids.wants_kids', 'Wants kids')}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            isActive={filters.wants_kids_strength != null && filters.wants_kids_strength !== -1}
            // icon={<WantsKidsIcon strength={filters.wants_kids_strength ?? -1}/>}
            selection={
              <KidsLabel
                strength={filters.wants_kids_strength ?? -1}
                highlightedClass={
                  (filters.wants_kids_strength ?? -1) == wantsKidsLabels.no_preference.strength
                    ? 'text-ink-900'
                    : 'text-primary-600'
                }
                mobile
              />
            }
          >
            <WantsKidsFilter filters={filters} updateFilter={updateFilter} />
          </MobileFilterSection>

          {/* HAS KIDS */}
          <MobileFilterSection
            title={t('profile.has_kids', 'Has kids')}
            openFilter={openFilter}
            setOpenFilter={setOpenFilter}
            isActive={filters.has_kids != null && filters.has_kids !== -1}
            // icon={<FaChild className="text-ink-900 h-4 w-4"/>}
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
            <HasKidsFilter filters={filters} updateFilter={updateFilter} />
          </MobileFilterSection>
        </>
      )}

      {/* DIET */}
      <MobileFilterSection
        title={t('profile.optional.diet', 'Diet')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.diet || undefined)}
        icon={<GiFruitBowl className="h-4 w-4" />}
        selection={
          <DietFilterText
            options={filters.diet as DietType[]}
            highlightedClass={
              hasAny(filters.diet || undefined) ? 'text-primary-600' : 'text-ink-900'
            }
          />
        }
      >
        <DietFilter filters={filters} updateFilter={updateFilter} />
      </MobileFilterSection>

      {/* DRINKS PER MONTH */}
      <MobileFilterSection
        title={t('profile.drinks', 'Drinks')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={(() => {
          const [noMin, noMax] = getNoMinMaxDrinks(filters.drinks_min, filters.drinks_max)
          return !noMin || !noMax
        })()}
        icon={<MdLocalBar className="h-4 w-4" />}
        selection={
          <DrinksFilterText
            drinks_min={filters.drinks_min}
            drinks_max={filters.drinks_max}
            highlightedClass={(() => {
              const [noMin, noMax] = getNoMinMaxDrinks(filters.drinks_min, filters.drinks_max)
              return noMin && noMax ? 'text-ink-900' : 'text-primary-600'
            })()}
          />
        }
      >
        <DrinksFilter filters={filters} updateFilter={updateFilter} />
      </MobileFilterSection>

      {/* SMOKER */}
      <MobileFilterSection
        title={t('profile.smokes', 'Smoker')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={filters.is_smoker != null}
        icon={<LuCigarette className="h-4 w-4" />}
        selection={
          <SmokerFilterText
            is_smoker={filters.is_smoker}
            highlightedClass={filters.is_smoker == null ? 'text-ink-900' : 'text-primary-600'}
            mobile
          />
        }
      >
        <SmokerFilter filters={filters} updateFilter={updateFilter} />
      </MobileFilterSection>

      {/* LANGUAGES */}
      <MobileFilterSection
        title={t('profile.optional.languages', 'Languages')}
        // className="col-span-full max-h-80 overflow-y-auto"
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.languages || undefined)}
        icon={<MdLanguage className="h-4 w-4" />}
        selection={
          <LanguageFilterText
            options={filters.languages as string[]}
            highlightedClass={
              hasAny(filters.languages || undefined) ? 'text-primary-600' : 'text-ink-900'
            }
          />
        }
      >
        <LanguageFilter filters={filters} updateFilter={updateFilter} />
      </MobileFilterSection>

      {/* INTERESTS */}
      <MobileFilterSection
        newBadgeClassName={'-top-0 -left-0'}
        title={t('profile.optional.interests', 'Interests')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.interests || undefined)}
        icon={<FaStar className="h-4 w-4" />}
        selection={
          <InterestFilterText
            options={filters.interests as string[]}
            highlightedClass={
              hasAny(filters.interests || undefined) ? 'text-primary-600' : 'text-ink-900'
            }
            label={'interests'}
          />
        }
      >
        <InterestFilter
          filters={filters}
          updateFilter={updateFilter}
          choices={choices.interests}
          label={'interests'}
        />
      </MobileFilterSection>

      {/* CAUSES */}
      <MobileFilterSection
        newBadgeClassName={'-top-0 -left-0'}
        title={t('profile.optional.causes', 'Causes')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.causes || undefined)}
        icon={<FaHandsHelping className="h-4 w-4" />}
        selection={
          <InterestFilterText
            options={filters.causes as string[]}
            highlightedClass={
              hasAny(filters.causes || undefined) ? 'text-primary-600' : 'text-ink-900'
            }
            label={'causes'}
          />
        }
      >
        <InterestFilter
          filters={filters}
          updateFilter={updateFilter}
          choices={choices.causes}
          label={'causes'}
        />
      </MobileFilterSection>

      {/* WORK */}
      <MobileFilterSection
        newBadgeClassName={'-top-0 -left-0'}
        title={t('profile.optional.work', 'Work')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.work || undefined)}
        icon={<FaBriefcase className="h-4 w-4" />}
        selection={
          <InterestFilterText
            options={filters.work as string[]}
            highlightedClass={
              hasAny(filters.work || undefined) ? 'text-primary-600' : 'text-ink-900'
            }
            label={'work'}
          />
        }
      >
        <InterestFilter
          filters={filters}
          updateFilter={updateFilter}
          choices={choices.work}
          label={'work'}
        />
      </MobileFilterSection>

      {/* POLITICS */}
      <MobileFilterSection
        title={t('profile.optional.political_beliefs', 'Politics')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.political_beliefs || undefined)}
        icon={<RiScales3Line className="h-4 w-4" />}
        selection={
          <PoliticalFilterText
            options={filters.political_beliefs as string[]}
            highlightedClass={
              hasAny(filters.political_beliefs || undefined) ? 'text-primary-600' : 'text-ink-900'
            }
          />
        }
      >
        <PoliticalFilter filters={filters} updateFilter={updateFilter} />
      </MobileFilterSection>

      {/* RELIGION */}
      <MobileFilterSection
        title={t('profile.optional.religious_beliefs', 'Religion')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.religion || undefined)}
        icon={<PiHandsPrayingBold className="h-4 w-4" />}
        selection={
          <ReligionFilterText
            options={filters.religion as string[]}
            highlightedClass={
              hasAny(filters.religion || undefined) ? 'text-primary-600' : 'text-ink-900'
            }
          />
        }
      >
        <ReligionFilter filters={filters} updateFilter={updateFilter} />
      </MobileFilterSection>

      {/* MBTI */}
      <MobileFilterSection
        title="MBTI"
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.mbti)}
        icon={<BsPersonVcard className="h-4 w-4" />}
        selection={
          <MbtiFilterText
            options={filters.mbti as string[]}
            highlightedClass={hasAny(filters.mbti) ? 'text-primary-600' : 'text-ink-900'}
            defaultLabel={t('filter.any_mbti', 'Any MBTI')}
          />
        }
      >
        <MbtiFilter filters={filters} updateFilter={updateFilter} />
      </MobileFilterSection>

      {/* BIG FIVE PERSONALITY */}
      <MobileFilterSection
        title={t('profile.big5', 'Personality (Big Five)')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAnyBig5Filter(filters)}
        icon={<BsPersonVcard className="h-4 w-4" />}
        selection={
          <Big5FilterText
            filters={filters}
            highlightedClass={hasAnyBig5Filter(filters) ? 'text-primary-600' : 'text-ink-900'}
          />
        }
      >
        <Big5Filters filters={filters} updateFilter={updateFilter} />
      </MobileFilterSection>

      {/* EDUCATION */}
      <MobileFilterSection
        title={t('profile.education.short_name', 'Education')}
        openFilter={openFilter}
        setOpenFilter={setOpenFilter}
        isActive={hasAny(filters.education_levels)}
        icon={<LuGraduationCap className="h-4 w-4" />}
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
      </MobileFilterSection>
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
  // When true, shows a tiny "new" badge at the top-left of the button
  showNewBadge?: boolean
  // Optional extra classes for the badge container (to tweak position/size)
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
          'text-ink-600 flex w-full flex-row justify-between px-4 pt-4 relative',
          isOpen ? 'pb-2' : 'pb-4',
        )}
        onClick={() => (isOpen ? setOpenFilter(undefined) : setOpenFilter(title))}
      >
        {showNewBadge && <NewBadge classes={newBadgeClassName} />}
        <Row className={clsx('items-center gap-2', isActive && 'font-semibold')}>
          {icon}
          {selection}
          {/*{title}: {selection}*/}
        </Row>
        <div className="text-ink-900">
          {isOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
      </button>
      {isOpen && (
        <div className={clsx('bg-canvas-50 px-4 py-2', childrenClassName)}>{children}</div>
      )}
    </Col>
  )
}
