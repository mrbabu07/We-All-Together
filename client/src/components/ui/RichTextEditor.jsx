import { useEffect, useRef, useState } from 'react'
import { Bold, Italic, Link, List, ListOrdered, Pilcrow } from 'lucide-react'

const toolbarItems = [
  { command: 'bold', icon: Bold, label: 'Bold' },
  { command: 'italic', icon: Italic, label: 'Italic' },
  { command: 'insertUnorderedList', icon: List, label: 'Bullet list' },
  { command: 'insertOrderedList', icon: ListOrdered, label: 'Numbered list' },
]

export default function RichTextEditor({ label, onChange, value = '' }) {
  const editorRef = useRef(null)
  const [focused, setFocused] = useState(false)

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

  const addLink = () => {
    const url = window.prompt('Paste link URL')

    if (!url) {
      return
    }

    runCommand('createLink', url)
  }

  return (
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
            onClick={addLink}
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
  )
}
