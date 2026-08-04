import {Locator, Page} from '@playwright/test'

/**
 * Selectable options (connection type, gender, interests, education, ...) render as chips —
 * `OptionChip` in web/components/multi-checkbox.tsx. The chip keeps a real `<input type="checkbox">`
 * for accessibility, but it is `sr-only` and the label's text span sits on top of it. Playwright
 * still considers the 1px input "visible", so clicking it gets as far as the click and then fails
 * with `<span> intercepts pointer events`.
 *
 * So: click the enclosing <label> when there is one — the same target a real user hits, toggling the
 * checkbox through the native label association. Checkboxes that aren't chips (the display field
 * toggles, which pair a visible input with a sibling `htmlFor` label) have no ancestor label and are
 * clicked directly, so this is safe to use for any checkbox.
 *
 * Assertions (`toBeChecked`) still belong on the input itself — pass the original locator for those.
 */
export async function clickCheckbox(checkbox: Locator) {
  const label = checkbox.locator('xpath=ancestor::label[1]')
  const target = (await label.count()) > 0 ? label.first() : checkbox
  await target.click()
}

/**
 * The clickable chip for `label` — its enclosing <label> element. See {@link clickCheckbox}.
 *
 * `root` is usually the page, but pass a section locator where the same option label appears in more
 * than one group on screen (Work Area / Causes / Interests all offer the same free-form options), or
 * the locator resolves to several chips and Playwright fails on strict mode.
 */
export function optionChip(root: Page | Locator, label: string): Locator {
  // The `has:` locator is re-rooted at each candidate <label>, selector chain and all — so it has to be
  // built from the page, not from `root`. Scoped from `root` it would look for a section *inside* the
  // label and match nothing.
  const page = 'goto' in root ? root : root.page()
  return root.locator('label').filter({has: optionChipInput(page, label)})
}

/** The chip's underlying checkbox — for `toBeChecked()` assertions, which need the input itself. */
export function optionChipInput(root: Page | Locator, label: string): Locator {
  return root.getByRole('checkbox', {name: label, exact: true})
}
