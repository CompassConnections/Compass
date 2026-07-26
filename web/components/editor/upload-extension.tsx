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
        let trans = editor.chain().focus()
        uploads.forEach(({src, isVideo}) => {
          trans = isVideo ? trans.setVideo({src}) : trans.setImage({src})
          trans = trans.createParagraphNear()
        })
        trans.run()
      },
      onError(error: any) {
        toast.error(error.message ?? error)
      },
    },
  )

export type UploadMutation = ReturnType<typeof useUploadMutation>
