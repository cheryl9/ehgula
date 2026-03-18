import React from 'react'
import clsx from 'clsx'

/**
 * Table - Reusable data table component
 * @param {array} columns - Column definitions: {key, label, render?}
 * @param {array} rows - Row data
 * @param {boolean} striped - Alternate row colors
 */
export function Table({ 
  columns, 
  rows, 
  striped = true,
  hoverable = true
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-sm font-medium text-slate-600"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className={clsx(
                'border-b border-slate-200',
                striped && idx % 2 === 1 ? 'bg-slate-50' : 'bg-white',
                hoverable && 'hover:bg-slate-100 transition-colors'
              )}
            >
              {columns.map((column) => (
                <td
                  key={`${idx}-${column.key}`}
                  className="px-4 py-3 text-sm text-slate-700"
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table
