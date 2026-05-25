import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'

export default function Modal({ children, onClose, open, title }) {
  return (
    <Dialog className="relative z-50" onClose={onClose} open={open}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center px-4 py-6">
        <DialogPanel className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
          <div className="mb-5 flex items-start justify-between gap-4">
            <DialogTitle className="text-lg font-semibold tracking-tight text-gray-900">
              {title}
            </DialogTitle>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
