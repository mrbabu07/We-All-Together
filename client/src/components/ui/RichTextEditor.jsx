import { useEffect, useRef, useState } from 'react'
import { Bold, Italic, Link, List, ListOrdered, Pilcrow } from 'lucide-react'
import Button from './Button'
import Field from './Field'
import Modal from './Modal'

const toolbarItems = [
  { command: 'bold', icon: Bold, label: 'Bold' },
  { command: 'italic', icon: Italic, label: 'Italic' },
  { command: 'insertUnorderedList', icon: List, label: 'Bullet list' },
  { command: 'insertOrderedList', icon: ListOrdered, label: 'Numbered list' },
]

export default function RichTextEditor({ label, onChange, value = '' }) {
  const editorRef = useRef(null)
  const selectionRangeRef = useRef(null)
  const [focused, setFocused] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  useEffect(() => {
    const editor = editorRef.current

    if (!editor || focused || editor.innerHTML === value) {
      return
    }

    editor.innerHTML = value || ''
  }, [focused, value])

  const emitChange = () => {
    onChange?.(editorRef.current?.innerHTML || '')
  }

  const runCommand = (command, argument = null) => {
    editorRef.current?.focus()
    document.execCommand(command, false, argument)
    emitChange()
  }

  const openLinkModal = () => {
    const selection = window.getSelection()

    if (selection?.rangeCount) {
      selectionRangeRef.current = selection.getRangeAt(0)
    }

    setLinkError('')
    setLinkUrl('')
    setLinkModalOpen(true)
  }

  const closeLinkModal = () => {
    setLinkModalOpen(false)
    setLinkError('')
    setLinkUrl('')
  }

  const restoreSelection = () => {
    const selection = window.getSelection()

    editorRef.current?.focus()
    if (selection && selectionRangeRef.current) {
      selection.removeAllRanges()
      selection.addRange(selectionRangeRef.current)
    }
  }

  const submitLink = (event) => {
    event.preventDefault()
    const url = linkUrl.trim()

    if (!url) {
      setLinkError('Link URL is required.')
      return
    }

    const normalizedUrl = /^(https?:|mailto:|tel:|\/)/i.test(url) ? url : `https://${url}`
    restoreSelection()
    runCommand('createLink', normalizedUrl)
    closeLinkModal()
  }

  return (
    <>
      <label className="grid gap-1.5 text-sm font-medium text-gray-700">
        {label ? <span>{label}</span> : null}
        <div className="overflow-hidden rounded-xl border border-gray-300 bg-white focus-within:border-transparent focus-within:ring-2 focus-within:ring-indigo-500">
          <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-2">
            {toolbarItems.map((item) => {
              const Icon = item.icon

              return (
                <button
                  aria-label={item.label}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white hover:text-indigo-700"
                  key={item.command}
                  onClick={() => runCommand(item.command)}
                  title={item.label}
                  type="button"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </button>
              )
            })}
            <button
              aria-label="Add link"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white hover:text-indigo-700"
              onClick={openLinkModal}
              title="Add link"
              type="button"
            >
              <Link aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              aria-label="Clear formatting"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white hover:text-indigo-700"
              onClick={() => runCommand('removeFormat')}
              title="Clear formatting"
              type="button"
            >
              <Pilcrow aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <div
            aria-label={label || 'Rich text editor'}
            className="min-h-40 px-4 py-3 text-sm leading-relaxed text-gray-900 outline-none [&_a]:text-indigo-700 [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            contentEditable
            dangerouslySetInnerHTML={{ __html: value || '' }}
            onBlur={() => setFocused(false)}
            onFocus={() => setFocused(true)}
            onInput={emitChange}
            ref={editorRef}
            role="textbox"
            suppressContentEditableWarning
          />
        </div>
      </label>
      <Modal onClose={closeLinkModal} open={linkModalOpen} title="Add link">
        <form className="grid gap-4" onSubmit={submitLink}>
          <Field
            autoFocus
            error={linkError}
            label="Link URL"
            onChange={(event) => {
              setLinkError('')
              setLinkUrl(event.target.value)
            }}
            placeholder="https://example.com"
            value={linkUrl}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={closeLinkModal} type="button" variant="secondary">
              Cancel
            </Button>
            <Button icon={Link} type="submit">
              Add link
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
