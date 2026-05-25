import Button from './Button'

export default function Table({ columns, emptyText = 'কোনো তথ্য নেই', rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  key={column.key}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr className="transition hover:bg-gray-50" key={row._id || row.id}>
                {columns.map((column) => (
                  <td className="px-4 py-3 text-sm text-gray-700" key={column.key}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-white px-4 py-3">
        <Button variant="secondary">পূর্ববর্তী</Button>
        <Button variant="secondary">পরবর্তী</Button>
      </div>
    </div>
  )
}
