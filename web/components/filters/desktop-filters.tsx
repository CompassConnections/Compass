import {ChevronDownIcon, ChevronUpIcon} from '@heroicons/react/outline'
import {RelationshipType, RomanticType} from 'web/lib/util/convert-relationship-type'
import {ReactNode} from 'react'
import {FaUserGroup} from 'react-icons/fa6'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {CustomizeableDropdown} from 'web/components/widgets/customizeable-dropdown'
import {Gender} from 'common/gender'
import {AgeFilter, AgeFilterText} from './age-filter'
import {GenderFilter, GenderFilterText} from './gender-filter'
import {LocationFilter, LocationFilterProps, LocationFilterText,} from './location-filter'
import {RelationshipFilter, RelationshipFilterText,} from './relationship-filter'
import {MyMatchesToggle} from './my-matches-toggle'
import {Profile} from 'common/profiles/profile'
import {FilterFields} from "common/filters";
import {ShortBioToggle} from "web/components/filters/short-bio-toggle";
import {PrefGenderFilter, PrefGenderFilterText} from "web/components/filters/pref-gender-filter";
import DropdownMenu from "web/components/comments/dropdown-menu";
import {KidsLabel, wantsKidsLabelsWithIcon} from "web/components/filters/wants-kids-filter";
import {hasKidsLabels} from "common/has-kids";
import {HasKidsLabel} from "web/components/filters/has-kids-filter";
import {RomanticFilter, RomanticFilterText} from "web/components/filters/romantic-filter";
import {FaHeart} from "react-icons/fa";

export function DesktopFilters(props: {
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

  return (
    <>
      <MyMatchesToggle
        setYourFilters={setYourFilters}
        youProfile={youProfile}
        on={isYourFilters}
        hidden={!youProfile}
      />

      {/* CONNECTION */}
      <CustomizeableDropdown
        buttonContent={(open) => (
          <DropdownButton
            open={open}
            content={
              <Row className="items-center gap-1">
                <FaUserGroup className="h-4 w-4"/>
                <RelationshipFilterText
                  relationship={
                    filters.pref_relation_styles as
                      | RelationshipType[]
                      | undefined
                  }
                  highlightedClass={open ? 'text-primary-500' : undefined}
                />
              </Row>
            }
          />
        )}
        dropdownMenuContent={
          <RelationshipFilter filters={filters} updateFilter={updateFilter}/>
        }
        popoverClassName="bg-canvas-50"
        menuWidth="w-50"
      />

      {/* LOCATION */}
      <CustomizeableDropdown
        buttonContent={(open: boolean) => (
          <DropdownButton
            content={
              <LocationFilterText
                youProfile={youProfile}
                location={locationFilterProps.location}
                radius={locationFilterProps.radius}
                highlightedClass={open ? 'text-primary-500' : ''}
              />
            }
            open={open}
          />
        )}
        dropdownMenuContent={
          <LocationFilter
            youProfile={youProfile}
            locationFilterProps={locationFilterProps}
          />
        }
        popoverClassName="bg-canvas-50"
        menuWidth="w-80"
      />

      {/* AGE RANGE */}
      <CustomizeableDropdown
        buttonContent={(open: boolean) => (
          <DropdownButton
            open={open}
            content={
              <AgeFilterText
                pref_age_min={filters.pref_age_min}
                pref_age_max={filters.pref_age_max}
                highlightedClass={open ? 'text-primary-500' : ''}
              />
            }
          />
        )}
        dropdownMenuContent={
          <Col className="mx-2 mb-4">
            <AgeFilter filters={filters} updateFilter={updateFilter}/>
          </Col>
        }
        popoverClassName="bg-canvas-50"
        menuWidth="w-80"
      />

      {/* GENDER */}
      <CustomizeableDropdown
        buttonContent={(open: boolean) => (
          <DropdownButton
            content={
              <GenderFilterText
                gender={filters.genders as Gender[]}
                highlightedClass={open ? 'text-primary-500' : undefined}
              />
            }
            open={open}
          />
        )}
        dropdownMenuContent={
          <Col>
            <GenderFilter filters={filters} updateFilter={updateFilter}/>
          </Col>
        }
        popoverClassName="bg-canvas-50"
      />

      {/* GENDER THEY SEEK */}
      <CustomizeableDropdown
        buttonContent={(open: boolean) => (
          <DropdownButton
            content={
              <PrefGenderFilterText
                pref_gender={filters.pref_gender as Gender[]}
                highlightedClass={open ? 'text-primary-500' : undefined}
              />
            }
            open={open}
          />
        )}
        dropdownMenuContent={
          <Col>
            <PrefGenderFilter filters={filters} updateFilter={updateFilter}/>
          </Col>
        }
        popoverClassName="bg-canvas-50"
      />

      {includeRelationshipFilters && <>

        {/* CONNECTION */}
          <CustomizeableDropdown
              buttonContent={(open) => (
                <DropdownButton
                  open={open}
                  content={
                    <Row className="items-center gap-1">
                      <FaHeart className="h-4 w-4"/>
                      <RomanticFilterText
                        relationship={
                          filters.pref_romantic_styles as
                            | RomanticType[]
                            | undefined
                        }
                        highlightedClass={open ? 'text-primary-500' : undefined}
                      />
                    </Row>
                  }
                />
              )}
              dropdownMenuContent={
                <RomanticFilter filters={filters} updateFilter={updateFilter}/>
              }
              popoverClassName="bg-canvas-50"
              menuWidth="w-50"
          />

      {/* WANTS KIDS */}
      <DropdownMenu
        items={[
          {
            name: wantsKidsLabelsWithIcon.no_preference.name,
            icon: wantsKidsLabelsWithIcon.no_preference.icon,
            onClick: () => {
              updateFilter({
                wants_kids_strength: wantsKidsLabelsWithIcon.no_preference.strength,
              })
            },
          },
          {
            name: wantsKidsLabelsWithIcon.wants_kids.name,
            icon: wantsKidsLabelsWithIcon.wants_kids.icon,
            onClick: () => {
              updateFilter({
                wants_kids_strength: wantsKidsLabelsWithIcon.wants_kids.strength,
              })
            },
          },
          {
            name: wantsKidsLabelsWithIcon.doesnt_want_kids.name,
            icon: wantsKidsLabelsWithIcon.doesnt_want_kids.icon,
            onClick: () => {
              updateFilter({
                wants_kids_strength: wantsKidsLabelsWithIcon.doesnt_want_kids.strength,
              })
            },
          },
        ]}
        closeOnClick
        buttonClass={'!text-ink-600 !hover:!text-ink-600'}
        buttonContent={(open: boolean) => (
          <DropdownButton
            content={
              <KidsLabel
                strength={
                  filters.wants_kids_strength ??
                  wantsKidsLabelsWithIcon.no_preference.strength
                }
                highlightedClass={open ? 'text-primary-500' : ''}
              />
            }
            open={open}
          />
        )}
        menuItemsClass={'bg-canvas-50'}
        menuWidth="w-48"
      />

      {/* HAS KIDS */}
      <DropdownMenu
        items={[
          {
            name: hasKidsLabels.no_preference.name,
            onClick: () => {
              updateFilter({has_kids: hasKidsLabels.no_preference.value})
            },
          },
          {
            name: hasKidsLabels.doesnt_have_kids.name,
            onClick: () => {
              updateFilter({has_kids: hasKidsLabels.doesnt_have_kids.value})
            },
          },
          {
            name: hasKidsLabels.has_kids.name,
            onClick: () => {
              updateFilter({has_kids: hasKidsLabels.has_kids.value})
            },
          },
        ]}
        closeOnClick
        buttonClass={'!text-ink-600 !hover:!text-ink-600'}
        buttonContent={(open: boolean) => (
          <DropdownButton
            content={
              <HasKidsLabel
                has_kids={filters.has_kids ?? -1}
                highlightedClass={open ? 'text-primary-500' : ''}
              />
            }
            open={open}
          />
        )}
        menuItemsClass="bg-canvas-50"
        menuWidth="w-40"
      />

      </>
      }

      {/* Short Bios */}
      <ShortBioToggle
        updateFilter={updateFilter}
        filters={filters}
        hidden={false}
      />

      <button
        className="text-ink-900 hover:text-primary-500 underline"
        onClick={clearFilters}
      >
        Clear filters
      </button>
    </>
  )
}

export function DropdownButton(props: { open: boolean; content: ReactNode }) {
  const {open, content} = props
  return (
    <Row className="hover:text-ink-700 items-center gap-0.5 transition-all">
      {content}
      <span className="text-ink-400">
        {open ? (
          <ChevronUpIcon className="h-4 w-4"/>
        ) : (
          <ChevronDownIcon className="h-4 w-4"/>
        )}
      </span>
    </Row>
  )
}
