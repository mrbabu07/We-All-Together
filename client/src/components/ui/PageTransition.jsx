import { motion } from 'framer-motion'
import { pageTransition } from '../../animations/variants'

export default function PageTransition({ children }) {
  return (
    <motion.div
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      initial={pageTransition.initial}
      transition={pageTransition.transition}
    >
      {children}
    </motion.div>
  )
}
