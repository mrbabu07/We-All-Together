export const pageTransition = {
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  initial: { opacity: 0, y: 14 },
  transition: { duration: 0.22, ease: 'easeOut' },
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
  initial: {},
}

export const fadeInUp = {
  animate: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 12 },
  transition: { duration: 0.24, ease: 'easeOut' },
}

export const modalBackdrop = {
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  initial: { opacity: 0 },
}

export const modalPanel = {
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 8 },
  initial: { opacity: 0, scale: 0.92, y: 8 },
}
