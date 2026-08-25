import {clampQuestionIndex} from 'web/components/answers/answer-compatibility-question-button'

/**
 * The answer-questions modal walks a list by index, and that list is refetched underneath it: every
 * answer submitted moves a question out of the "unanswered" group, so the array shrinks while the
 * index only counts up. When the two crossed, the render read `.id` off `undefined` and threw —
 * inside render, so the error boundary took the whole page, not just the dialog. It showed up as
 * the onboarding E2E flow failing on the profile behind the modal.
 *
 * So what is pinned here is that the cursor never leaves the array, and that an emptied list
 * reports the one value the caller treats as "nothing to show" rather than a valid index.
 */

describe('clampQuestionIndex', () => {
  it('leaves an in-range index alone', () => {
    expect(clampQuestionIndex(0, 3)).toBe(0)
    expect(clampQuestionIndex(1, 3)).toBe(1)
    expect(clampQuestionIndex(2, 3)).toBe(2)
  })

  it('pulls an index back to the last question when the list shrinks under it', () => {
    // Held index 4, but two of the five were answered while the modal was open.
    expect(clampQuestionIndex(4, 3)).toBe(2)
    expect(clampQuestionIndex(4, 1)).toBe(0)
  })

  it('reports -1 once the list is empty, so the caller can close instead of indexing', () => {
    expect(clampQuestionIndex(0, 0)).toBe(-1)
    expect(clampQuestionIndex(7, 0)).toBe(-1)
  })

  it('never returns a negative index for a non-empty list', () => {
    expect(clampQuestionIndex(-1, 3)).toBe(0)
  })
})
