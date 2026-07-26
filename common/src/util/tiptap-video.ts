// Modeled on @tiptap/extension-image (there is no official @tiptap/extension-video package).

import {mergeAttributes, Node} from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: {src: string}) => ReturnType
    }
  }
}

const Video = Node.create({
  name: 'video',

  group: 'block',

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [{tag: 'video[src]'}]
  },

  renderHTML({HTMLAttributes}) {
    return ['video', mergeAttributes(HTMLAttributes, {controls: true})]
  },

  addCommands() {
    return {
      setVideo:
        (options: {src: string}) =>
        ({commands}) =>
          commands.insertContent({type: this.name, attrs: options}),
    }
  },
})

export default Video
