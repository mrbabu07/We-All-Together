import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { modalBackdrop, modalPanel } from '../../animations/variants'

export default function Modal({ children, className = '', onClose, open, title }) {
  return (
    <Dialog className="relative z-50" onClose={onClose} open={open}>
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              animate={modalBackdrop.animate}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              exit={modalBackdrop.exit}
              initial={modalBackdrop.initial}
            />
            <div className="fixed inset-0 flex items-end justify-center overflow-y-auto px-2 py-2 sm:items-center sm:px-4 sm:py-6">
              <DialogPanel
                as={motion.div}
                animate={modalPanel.animate}
                className={`max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto rounded-t-[var(--radius-2xl)] border border-[var(--gray-200)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-xl-token)] sm:max-h-[calc(100dvh-3rem)] sm:rounded-[var(--radius-2xl)] sm:p-6 ${className}`}
                exit={modalPanel.exit}
                initial={modalPanel.initial}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <DialogTitle className="min-w-0 text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                    {title}
                  </DialogTitle>
                  <button
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-full)] text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                    onClick={onClose}
                    type="button"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
                {children}
              </DialogPanel>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    </Dialog>
  )
}
