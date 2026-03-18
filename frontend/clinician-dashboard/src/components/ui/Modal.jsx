import React from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

/**
 * Modal - Reusable modal dialog
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Callback when close button clicked
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Modal content
 * @param {React.ReactNode} footer - Modal footer (typically buttons)
 * @param {boolean} isDanger - Style as dangerous action (red header)
 */
export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  isDanger = false
}) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
          {/* Header */}
          <div className={clsx(
            'flex items-center justify-between border-b px-6 py-4',
            isDanger ? 'border-danger-red-200 bg-danger-red-50' : 'border-slate-200 bg-slate-50'
          )}>
            <h2 className={clsx(
              'text-lg font-semibold',
              isDanger ? 'text-danger-red-900' : 'text-slate-900'
            )}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Modal
