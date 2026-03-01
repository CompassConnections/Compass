import {computePosition, flip, offset, shift} from '@floating-ui/dom'
import type {MentionOptions} from '@tiptap/extension-mention'
import {ReactRenderer} from '@tiptap/react'
import {beginsWith} from 'common/util/parse'
import {sortBy} from 'lodash'
import {searchUsers} from 'web/lib/supabase/users'

import {MentionList} from './mention-list'

type Render = Suggestion['render']
type Suggestion = MentionOptions['suggestion']

export const mentionSuggestion: Suggestion = {
  allowedPrefixes: [' '],
  items: async ({query}) =>
    sortBy(await searchUsers(query, 6), (u) =>
      [u.name, u.username].some((s) => beginsWith(s, query)) ? -1 : 0,
    ),
  render: makeMentionRender(MentionList),
}

export function makeMentionRender(mentionList: any): Render {
  return () => {
    let component: ReactRenderer
    let container: HTMLDivElement

    const updatePosition = (clientRect: (() => DOMRect | null) | null | undefined) => {
      if (!clientRect || !container) return
      const rect = clientRect()
      if (!rect) return

      // Virtual element from the cursor position
      const virtualEl = {
        getBoundingClientRect: () => rect,
      }

      computePosition(virtualEl as Element, container, {
        placement: 'bottom-start',
        middleware: [offset(8), flip(), shift({padding: 8})],
      }).then(({x, y}) => {
        Object.assign(container.style, {
          left: `${x}px`,
          top: `${y}px`,
        })
      })
    }

    return {
      onStart(props) {
        component = new ReactRenderer(mentionList, {
          props,
          editor: props.editor,
        })

        container = document.createElement('div')
        container.style.cssText = 'position:fixed;z-index:9999;'
        container.appendChild(component.element)
        document.body.appendChild(container)

        updatePosition(props.clientRect)
      },

      onUpdate(props) {
        component?.updateProps(props)
        updatePosition(props.clientRect)
      },

      onKeyDown(props) {
        if (
          props.event.key === 'Escape' ||
          (props.event.key === 'Enter' && !container?.isConnected)
        ) {
          container?.remove()
          component?.destroy()
          return false
        }
        return (component?.ref as any)?.onKeyDown(props)
      },

      onExit() {
        container?.remove()
        component?.destroy()
      },
    }
  }
}
