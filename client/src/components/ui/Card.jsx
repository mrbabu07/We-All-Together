import { motion } from 'framer-motion'

export default function Card({ children, className = '', hover = true }) {
  return (
    <motion.section
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
      transition={{ duration: 0.18 }}
      whileHover={hover ? { y: -2, boxShadow: '0 10px 24px rgb(17 24 39 / 0.08)' } : undefined}
    >
      {children}
    </motion.section>
  )
}
