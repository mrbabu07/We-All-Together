import { motion } from 'framer-motion'

const variants = {
  base: 'premium-card',
  elevated: 'border border-[color-mix(in_srgb,var(--brand-200)_55%,transparent)] bg-[var(--surface-0)] shadow-[var(--shadow-lg-token)]',
}

export default function Card({
  as = 'section',
  children,
  className = '',
  elevated = false,
  flush = false,
  hover = true,
}) {
  const Component = motion[as] || motion.section

  return (
    <Component
      className={`rounded-[var(--radius-md)] ${
        flush ? '' : 'p-6'
      } ${elevated ? variants.elevated : variants.base} transition-all duration-200 ${className}`}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      whileHover={
        hover
          ? {
              borderColor: 'color-mix(in srgb, var(--gray-300) 60%, transparent)',
              boxShadow: 'var(--shadow-md-token)',
              y: -1,
            }
          : undefined
      }
    >
      {children}
    </Component>
  )
}
