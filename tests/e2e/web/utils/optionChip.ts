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

/** The clickable chip for `label` — its enclosing <label> element. See {@link clickCheckbox}. */
export function optionChip(page: Page, label: string): Locator {
  return page.locator('label').filter({has: page.getByRole('checkbox', {name: label, exact: true})})
}

/** The chip's underlying checkbox — for `toBeChecked()` assertions, which need the input itself. */
export function optionChipInput(page: Page, label: string): Locator {
  return page.getByRole('checkbox', {name: label, exact: true})
}
