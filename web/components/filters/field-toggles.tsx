import clsx from 'clsx'
import {DisplayOptions} from 'common/profiles-rendering'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

const TOGGLE_FIELDS: Array<{key: keyof DisplayOptions; labelKey: string; fallbackLabel: string}> = [
  {key: 'showGender', labelKey: 'filter.show_gender', fallbackLabel: 'Gender'},
  {key: 'showCity', labelKey: 'filter.show_city', fallbackLabel: 'City'},
  {key: 'showAge', labelKey: 'filter.show_age', fallbackLabel: 'Age'},
  {key: 'showHeadline', labelKey: 'filter.show_headline', fallbackLabel: 'Headline'},
  {key: 'showKeywords', labelKey: 'filter.show_keywords', fallbackLabel: 'Keywords'},
  {key: 'showSeeking', labelKey: 'filter.show_seeking', fallbackLabel: 'What they seek'},
  {key: 'showOccupation', labelKey: 'filter.show_occupation', fallbackLabel: 'Work'},
  {key: 'showInterests', labelKey: 'filter.show_interests', fallbackLabel: 'Interests'},
  {key: 'showCauses', labelKey: 'filter.show_causes', fallbackLabel: 'Causes'},
  {key: 'showDiet', labelKey: 'filter.show_diet', fallbackLabel: 'Diet'},
  {key: 'showSmoking', labelKey: 'filter.show_smoking', fallbackLabel: 'Smoking'},
  {key: 'showDrinks', labelKey: 'filter.show_drinks', fallbackLabel: 'Drinks'},
  {key: 'showMBTI', labelKey: 'filter.show_mbti', fallbackLabel: 'MBTI'},
  {key: 'showLanguages', labelKey: 'filter.show_languages', fallbackLabel: 'Languages'},
  {key: 'showBio', labelKey: 'filter.show_bio', fallbackLabel: 'Bio'},
  {key: 'showPhotos', labelKey: 'filter.show_photos', fallbackLabel: 'Profile photo'},
]

export function FieldToggles(props: {
  displayOptions: Partial<DisplayOptions>
  updateDisplayOptions: (newState: Partial<DisplayOptions>) => void
}) {
  const {displayOptions, updateDisplayOptions} = props
  const t = useT()

  return (
    <Col className="gap-2">
      {TOGGLE_FIELDS.map((field) => {
        const isBooleanOption = field.key !== 'cardSize'
        const value = isBooleanOption ? (displayOptions[field.key] ?? true) : true
        return (
          <Row
            key={field.key}
            className={clsx('mr-2 items-center hover-bold', value && 'font-semibold')}
          >
            <input
              id={field.key}
              type="checkbox"
              className="border-ink-300 bg-canvas-0 dark:border-ink-500 text-primary-600 focus:ring-primary-500 h-4 w-4 rounded hover:bg-canvas-200 cursor-pointer"
              checked={value as boolean}
              onChange={() => {
                const newValue = !(displayOptions[field.key] ?? true)
                updateDisplayOptions({[field.key]: newValue})
              }}
            />
            <label htmlFor={field.key} className={clsx('text-ink-600 ml-2 text-sm cursor-pointer')}>
              {t(field.labelKey, field.fallbackLabel)}
            </label>
          </Row>
        )
      })}
    </Col>
  )
}
