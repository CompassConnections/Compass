import {Editor, Extension} from '@tiptap/core'
import toast from 'react-hot-toast'
import {useMutation} from 'web/hooks/use-mutation'
import {uploadImage} from 'web/lib/firebase/storage'

export const Upload = Extension.create({
  name: 'upload',

  addStorage: () => ({mutation: {}}),
})

export const useUploadMutation = (editor: Editor | null) =>
  useMutation(
    (files: File[]) =>
      // TODO: Images should be uploaded under a particular username
      Promise.all(
        files.map(async (file) => ({
          src: await uploadImage('default', file),
          isVideo: file.type.startsWith('video'),
        })),
      ),
    {
      onSuccess(uploads) {
        if (!editor || !uploads.length) return
        // Built as one node list and inserted in a single step. Chaining `setImage` per upload
        // inserts each one at the current selection, which lands after the previous node's
        // paragraph — that's what kept putting a blank line between images. Here the nodes are
        // adjacent siblings by construction, which is what the editor styles lay out two per line.
        // Videos still get a paragraph after each: two side by side leaves neither watchable.
        const nodes = uploads.flatMap(({src, isVideo}) =>
          isVideo
            ? [{type: 'video', attrs: {src}}, {type: 'paragraph'}]
            : [{type: 'image', attrs: {src}}],
        )
        editor.chain().focus().insertContent(nodes).run()

        // Inserting mid-text already leaves the rest of the paragraph behind the batch; only add one
        // when the media ends the document, so there's somewhere to keep typing. Appending
        // unconditionally is what leaves a stray blank line at the end.
        const {doc} = editor.state
        if (doc.lastChild?.type.name !== 'paragraph') {
          editor.chain().insertContentAt(doc.content.size, {type: 'paragraph'}).focus('end').run()
        }
      },
      onError(error: any) {
        toast.error(error.message ?? error)
      },
    },
  )

export type UploadMutation = ReturnType<typeof useUploadMutation>
