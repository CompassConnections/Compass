import clsx from 'clsx'
import {ChevronDownIcon} from 'lucide-react'
import {useEffect, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Modal, MODAL_CLASS} from 'web/components/layout/modal'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

type FormSection = {id: string; title: string}

/**
 * The profile form's sections and which one is currently being read.
 *
 * The list is read from the DOM rather than declared here. The form's markup is the source of truth
 * for what exists and in what order, and a hand-kept copy of that list would silently drift the first
 * time a section moved — which it did.
 *
 * Shared by both presentations below so the rail and the mobile chip cannot disagree about where you
 * are.
 */
function useFormSections() {
  const [sections, setSections] = useState<FormSection[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const form = document.querySelector('[data-profile-form]')
    if (!form) return

    // Bail when the list is unchanged. `setSections` with a fresh array on every call re-renders,
    // which mutates the DOM, which fires the observer again — a loop that also thrashed the scroll
    // listener below, since it re-subscribes whenever `sections` changes identity.
    const read = () =>
      setSections((prev) => {
        const next = Array.from(form.querySelectorAll<HTMLElement>('[data-form-section]')).map(
          (node) => ({id: node.id, title: node.dataset.formSection ?? ''}),
        )
        const same =
          prev.length === next.length &&
          prev.every((p, i) => p.id === next[i].id && p.title === next[i].title)
        return same ? prev : next
      })

    read()

    // Sections come and go with the form's own conditionals — Family only exists once a relationship
    // is being sought — so the list is re-read when the form's subtree changes.
    const mutations = new MutationObserver(read)
    mutations.observe(form, {childList: true, subtree: true})
    return () => mutations.disconnect()
  }, [])

  useEffect(() => {
    if (sections.length === 0) return

    // Read straight from scroll position rather than with an IntersectionObserver. The observer
    // version needed a band across the upper viewport to fire in, and a section heading is a few
    // pixels tall — during any normal scroll the headings jumped clean over the band and nothing ever
    // became active. Position always answers: the active section is simply the last one whose heading
    // has passed the line.
    const update = () => {
      const line = window.innerHeight * 0.25
      let current = sections[0].id
      for (const {id} of sections) {
        const el = document.getElementById(id)
        if (!el || el.getBoundingClientRect().top > line) break
        current = id
      }
      setActiveId(current)
    }

    update()
    window.addEventListener('scroll', update, {passive: true})
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [sections])

  const activeIndex = sections.findIndex((s) => s.id === activeId)

  return {
    sections,
    activeId,
    activeIndex: activeIndex === -1 ? 0 : activeIndex,
    goTo: (id: string) => document.getElementById(id)?.scrollIntoView({behavior: 'smooth'}),
  }
}

/**
 * Sticky section index for wide screens, in the gutter beside the form.
 *
 * The form is eighteen sections and several thousand pixels tall. Without an index the only way to
 * reach Substances is to scroll past everything before it, and there is no way to tell how much is
 * left — which is the difference between a form that feels long and one that feels endless.
 */
export function ProfileFormNav(props: {className?: string}) {
  const {className} = props
  const {sections, activeId, goTo} = useFormSections()

  if (sections.length === 0) return null

  return (
    <nav className={clsx('flex flex-col gap-0.5', className)} aria-label="Form sections">
      {sections.map(({id, title}) => {
        const isActive = id === activeId
        return (
          <button
            key={id}
            type="button"
            onClick={() => goTo(id)}
            aria-current={isActive ? 'true' : undefined}
            className={clsx(
              'border-l-2 py-1.5 pl-3 text-left text-sm transition-colors',
              isActive
                ? 'border-primary-500 text-ink-1000'
                : 'border-canvas-300 text-ink-500 hover:border-primary-400 hover:text-ink-800',
            )}
          >
            {title}
          </button>
        )
      })}
    </nav>
  )
}

/**
 * The same index for narrow screens, as one sticky row: position in the form, the current section,
 * and the full list one tap away.
 *
 * Not a reflow of the rail — stacked above the form, eighteen links would be a screenful of
 * navigation to scroll past before reaching the first field, on the very form whose problem is
 * length. The need is greater here than on desktop, since every field stacks and the page runs
 * roughly three times longer; the answer just has to cost one row instead of a screen.
 *
 * It stays pinned for the whole form. It previously hid on scroll down to save 44px of a short
 * viewport, but a bar that is only there when you scroll the wrong way reads as gone — you cannot
 * see where you are without scrolling backwards first, which is exactly what the index exists to
 * avoid.
 */
export function ProfileFormSectionBar(props: {className?: string}) {
  const {className} = props
  const {sections, activeId, activeIndex, goTo} = useFormSections()
  const [open, setOpen] = useState(false)
  const t = useT()

  if (sections.length === 0) return null

  const active = sections[activeIndex]

  return (
    <>
      {/* `--tnh` is the native top inset (globals.css). Pinned at `top-0` this sat under the Android
          status bar in the Capacitor shell; the variable is 0 in a browser, so one rule covers both. */}
      <div
        className={clsx(
          'bg-canvas-100/95 border-canvas-300 sticky top-[var(--tnh)] z-20 -mx-6 border-b px-6 backdrop-blur',
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="flex w-full items-center gap-3 py-3 text-left"
        >
          <span className="text-ink-400 font-dm-sans tabular-nums" style={{fontSize: '11px'}}>
            {activeIndex + 1}/{sections.length}
          </span>
          <span className="text-ink-900 min-w-0 flex-1 truncate text-sm">{active?.title}</span>
          <ChevronDownIcon className="text-ink-500 h-4 w-4 flex-none" />
        </button>
      </div>

      <Modal open={open} setOpen={setOpen}>
        <Col className={MODAL_CLASS}>
          <div
            className="text-ink-400 font-dm-sans mb-2 uppercase"
            style={{fontSize: '10px', letterSpacing: '0.18em'}}
          >
            {t('profile.form.sections', 'Sections')}
          </div>
          <Col className="w-full">
            {sections.map(({id, title}, i) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setOpen(false)
                  goTo(id)
                }}
                aria-current={id === activeId ? 'true' : undefined}
                className={clsx(
                  'border-canvas-200 flex w-full items-center gap-3 border-b py-3 text-left text-sm last:border-b-0',
                  id === activeId ? 'text-primary-700' : 'text-ink-700',
                )}
              >
                <Row className="text-ink-400 w-6 flex-none tabular-nums" style={{fontSize: '11px'}}>
                  {i + 1}
                </Row>
                {title}
              </button>
            ))}
          </Col>
        </Col>
      </Modal>
    </>
  )
}
