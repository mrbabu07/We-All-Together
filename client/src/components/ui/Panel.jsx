import Card from './Card'

export default function Panel({ children, className = '', flush = false, hover = true }) {
  return (
    <Card className={className} flush={flush} hover={hover}>
      {children}
    </Card>
  )
}
