import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { modalBackdrop, modalPanel } from '../../animations/variants'
import Button from './Button'

export default function ConfirmDialog({
  confirmLabel = 'Confirm',
  message,
  onCancel,
  onConfirm,
  open,
  title,
  variant = 'primary',
}) {
  return (
    <Dialog className="relative z-50" onClose={onCancel} open={open}>
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              animate={modalBackdrop.animate}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              exit={modalBackdrop.exit}
              initial={modalBackdrop.initial}
            />
            <div className="fixed inset-0 flex items-center justify-center px-4 py-6">
              <DialogPanel
                as={motion.div}
                animate={modalPanel.animate}
                className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
                exit={modalPanel.exit}
                initial={modalPanel.initial}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <DialogTitle className="text-lg font-semibold tracking-tight text-gray-900">
                    {title}
                  </DialogTitle>
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    onClick={onCancel}
                    type="button"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{message}</p>
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <Button onClick={onCancel} variant="secondary">
                    বাতিল
                  </Button>
                  <Button onClick={onConfirm} variant={variant}>
                    {confirmLabel}
                  </Button>
                </div>
              </DialogPanel>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    </Dialog>
  )
}
