import { Search } from 'lucide-react'
import Button from './Button'
import Card from './Card'

export function EmptyState({
  action,
  icon: Icon = Search,
  message = 'কোনো তথ্য নেই',
  title = 'কিছু পাওয়া যায়নি',
}) {
  return (
    <div className="grid place-items-center px-4 py-16 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-[var(--radius-full)] bg-[var(--brand-50)] text-[var(--brand-600)]">
        <Icon aria-hidden="true" className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-[var(--text-primary)]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export default function Table({
  columns,
  emptyAction,
  emptyIcon,
  emptyText = 'কোনো তথ্য নেই',
  emptyTitle = 'কিছু পাওয়া যায়নি',
  rows,
  striped = false,
}) {
  return (
    <Card className="overflow-hidden p-0" flush hover={false}>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-[var(--surface-1)]">
            <tr>
              {columns.map((column) => (
                <th
                  className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]"
                  key={column.key}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    action={emptyAction}
                    icon={emptyIcon}
                    message={emptyText}
                    title={emptyTitle}
                  />
                </td>
              </tr>
            ) : null}
            {rows.map((row, index) => (
              <tr
                className={`border-b border-[var(--gray-200)] transition-colors hover:bg-[var(--surface-1)] ${
                  striped && index % 2 ? 'bg-[color-mix(in_srgb,var(--surface-1)_50%,transparent)]' : ''
                }`}
                key={row._id || row.id}
              >
                {columns.map((column) => (
                  <td className="px-4 py-3.5 text-sm text-[var(--text-secondary)]" key={column.key}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-[var(--gray-200)] bg-[var(--surface-0)] px-4 py-3">
        <Button disabled variant="secondary">
          পূর্ববর্তী
        </Button>
        <Button disabled variant="secondary">
          পরবর্তী
        </Button>
      </div>
    </Card>
  )
}
