import { Fragment, useState } from 'react'
import { Title } from 'web/components/widgets/title'
import { Col } from 'web/components/layout/col'
import clsx from 'clsx'
import { MultiCheckbox } from 'web/components/multi-checkbox'
import { Row } from 'web/components/layout/row'
import { Input } from 'web/components/widgets/input'
import { ChoicesToggleGroup } from 'web/components/widgets/choices-toggle-group'
import { Button, IconButton } from 'web/components/buttons/button'
import { colClassName, labelClassName } from 'web/pages/signup'
import { useRouter } from 'next/router'
import { updateLover, updateUser } from 'web/lib/api'
import { Column } from 'common/supabase/utils'
import { User } from 'common/user'
import { track } from 'web/lib/service/analytics'
import { Races } from './race'
import { Carousel } from 'web/components/widgets/carousel'
import { tryCatch } from 'common/util/try-catch'
import { LoverRow } from 'common/love/lover'
import { removeNullOrUndefinedProps } from 'common/util/object'
import { isEqual } from 'lodash'
import { PlatformSelect } from 'web/components/widgets/platform-select'
import { type Site, PLATFORM_LABELS, SITE_ORDER } from 'common/socials'
import { PlusIcon, XIcon } from '@heroicons/react/solid'
import { SocialIcon } from './user/social'

export const OptionalLoveUserForm = (props: {
  lover: LoverRow
  setLover: <K extends Column<'lovers'>>(key: K, value: LoverRow[K]) => void
  user: User
  buttonLabel?: string
  fromSignup?: boolean
  onSubmit?: () => Promise<void>
}) => {
  const { lover, user, buttonLabel, setLover, fromSignup, onSubmit } = props

  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const [heightFeet, setHeightFeet] = useState<number | undefined>(
    lover.height_in_inches
      ? Math.floor((lover['height_in_inches'] ?? 0) / 12)
      : undefined
  )
  const [heightInches, setHeightInches] = useState<number | undefined>(
    lover.height_in_inches
      ? Math.floor((lover['height_in_inches'] ?? 0) % 12)
      : undefined
  )

  const [newLinks, setNewLinks] = useState<Record<string, string | null>>(
    user.link
  )

  const [newLinkPlatform, setNewLinkPlatform] = useState('')
  const [newLinkValue, setNewLinkValue] = useState('')

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const { bio: _, ...otherLoverProps } = lover
    const { error } = await tryCatch(
      updateLover(removeNullOrUndefinedProps(otherLoverProps) as any)
    )
    if (error) {
      console.error(error)
      return
    }
    if (!isEqual(newLinks, user.link)) {
      const { error } = await tryCatch(updateUser({ link: newLinks }))
      if (error) {
        console.error(error)
        return
      }
    }

    onSubmit && (await onSubmit())
    setIsSubmitting(false)
    track('submit love optional profile')
    if (user)
      router.push(`/${user.username}${fromSignup ? '?fromSignup=true' : ''}`)
    else router.push('/')
  }

  const updateUserLink = (platform: string, value: string | null) => {
    setNewLinks((links) => ({ ...links, [platform]: value }))
  }

  const addNewLink = () => {
    if (newLinkPlatform && newLinkValue) {
      updateUserLink(newLinkPlatform.toLowerCase().trim(), newLinkValue.trim())
      setNewLinkPlatform('')
      setNewLinkValue('')
    }
  }

  return (
    <>
      <Title>More about me</Title>
      <div className="text-ink-500 mb-6 text-lg">Optional information</div>

      <Col className={'gap-8'}>
        <Col className={clsx(colClassName, 'pb-4')}>
          <label className={clsx(labelClassName)}>Socials</label>

          <div className="grid w-full grid-cols-[8rem_1fr_auto] gap-2">
            {Object.entries(newLinks)
              .filter(([_, value]) => value != null)
              .map(([platform, value]) => (
                <Fragment key={platform}>
                  <div className="col-span-3 mt-2 flex items-center gap-2 self-center sm:col-span-1">
                    <SocialIcon
                      site={platform as any}
                      className="text-primary-700 h-4 w-4"
                    />
                    {PLATFORM_LABELS[platform as Site] ?? platform}
                  </div>
                  <Input
                    type="text"
                    value={value!}
                    onChange={(e) => updateUserLink(platform, e.target.value)}
                    className="col-span-2 sm:col-span-1"
                  />
                  <IconButton onClick={() => updateUserLink(platform, null)}>
                    <XIcon className="h-6 w-6" />
                    <div className="sr-only">Remove</div>
                  </IconButton>
                </Fragment>
              ))}

            {/* Spacer */}
            <div className="col-span-3 h-4" />

            <PlatformSelect
              value={newLinkPlatform}
              onChange={setNewLinkPlatform}
              className="h-full !w-full"
            />
            <Input
              type="text"
              placeholder={
                SITE_ORDER.includes(newLinkPlatform as any) &&
                newLinkPlatform != 'site'
                  ? 'Username or URL'
                  : 'Site URL'
              }
              value={newLinkValue}
              onChange={(e) => setNewLinkValue(e.target.value)}
              // disable password managers
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-bwignore="true"
              data-protonpass-ignore="true"
            />
            <Button
              color="gray-outline"
              onClick={addNewLink}
              disabled={!newLinkPlatform || !newLinkValue}
            >
              <PlusIcon className="h-6 w-6" />
              <div className="sr-only">Add</div>
            </Button>
          </div>
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Political beliefs</label>
          <MultiCheckbox
            choices={{
              Liberal: 'liberal',
              Moderate: 'moderate',
              Conservative: 'conservative',
              Socialist: 'socialist',
              Libertarian: 'libertarian',
              'e/acc': 'e/acc',
              'Pause AI': 'pause ai',
              Other: 'other',
            }}
            selected={lover['political_beliefs'] ?? []}
            onChange={(selected) => setLover('political_beliefs', selected)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Religious beliefs</label>
          <Input
            type="text"
            onChange={(e) => setLover('religious_beliefs', e.target.value)}
            className={'w-full sm:w-96'}
            value={lover['religious_beliefs'] ?? undefined}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Current number of kids</label>
          <Input
            type="number"
            onChange={(e) => {
              const value =
                e.target.value === '' ? null : Number(e.target.value)
              setLover('has_kids', value)
            }}
            className={'w-20'}
            min={0}
            value={lover['has_kids'] ?? undefined}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Do you smoke?</label>
          <ChoicesToggleGroup
            currentChoice={lover['is_smoker'] ?? undefined}
            choicesMap={{
              Yes: true,
              No: false,
            }}
            setChoice={(c) => setLover('is_smoker', c)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            Alcoholic beverages consumed per month
          </label>
          <Input
            type="number"
            onChange={(e) => {
              const value =
                e.target.value === '' ? null : Number(e.target.value)
              setLover('drinks_per_month', value)
            }}
            className={'w-20'}
            min={0}
            value={lover['drinks_per_month'] ?? undefined}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Height</label>
          <Row className={'gap-2'}>
            <Col>
              <span>Feet</span>
              <Input
                type="number"
                onChange={(e) => {
                  if (e.target.value === '') {
                    setHeightFeet(undefined)
                  } else {
                    setHeightFeet(Number(e.target.value))
                    const heightInInches =
                      Number(e.target.value) * 12 + (heightInches ?? 0)
                    setLover('height_in_inches', heightInInches)
                  }
                }}
                className={'w-16'}
                value={heightFeet ?? ''}
              />
            </Col>
            <Col>
              <span>Inches</span>
              <Input
                type="number"
                onChange={(e) => {
                  if (e.target.value === '') {
                    setHeightInches(undefined)
                  } else {
                    setHeightInches(Number(e.target.value))
                    const heightInInches =
                      Number(e.target.value) + 12 * (heightFeet ?? 0)
                    setLover('height_in_inches', heightInInches)
                  }
                }}
                className={'w-16'}
                value={heightInches ?? ''}
              />
            </Col>
          </Row>
        </Col>

        {/* <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Birthplace</label>
          <Input
            type="text"
            onChange={(e) => setLoverState('born_in_location', e.target.value)}
            className={'w-52'}
            value={lover['born_in_location'] ?? undefined}
          />
        </Col> */}

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Ethnicity/origin</label>
          <MultiCheckbox
            choices={Races}
            selected={lover['ethnicity'] ?? []}
            onChange={(selected) => setLover('ethnicity', selected)}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            Highest completed education level
          </label>
          <Carousel className="max-w-full">
            <ChoicesToggleGroup
              currentChoice={lover['education_level'] ?? ''}
              choicesMap={{
                None: 'none',
                'High school': 'high-school',
                'Some college': 'some-college',
                Bachelors: 'bachelors',
                Masters: 'masters',
                PhD: 'doctorate',
              }}
              setChoice={(c) => setLover('education_level', c)}
            />
          </Carousel>
        </Col>
        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>University</label>
          <Input
            type="text"
            onChange={(e) => setLover('university', e.target.value)}
            className={'w-52'}
            value={lover['university'] ?? undefined}
          />
        </Col>
        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>Company</label>
          <Input
            type="text"
            onChange={(e) => setLover('company', e.target.value)}
            className={'w-52'}
            value={lover['company'] ?? undefined}
          />
        </Col>

        <Col className={clsx(colClassName)}>
          <label className={clsx(labelClassName)}>
            Job title {lover['company'] ? 'at ' + lover['company'] : ''}
          </label>
          <Input
            type="text"
            onChange={(e) => setLover('occupation_title', e.target.value)}
            className={'w-52'}
            value={lover['occupation_title'] ?? undefined}
          />
        </Col>
        <Row className={'justify-end'}>
          <Button
            disabled={isSubmitting}
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {buttonLabel ?? 'Next'}
          </Button>
        </Row>
      </Col>
    </>
  )
}
