'use client'

import { cn } from '@/lib/utils'

export default function FormField({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
  value,
  onChange,
  options,
  rows,
  className,
  error,
}) {
  const inputClasses = cn(
    'w-full px-4 py-3 bg-titos-card border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-400 focus:outline-none focus:border-titos-gold/50 focus:ring-1 focus:ring-titos-gold/25 transition-colors',
    error && 'border-status-live/50',
    className
  )

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-titos-gray-200">
          {label}
          {required && <span className="text-titos-gold ml-1">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={rows || 4}
          className={inputClasses}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          required={required}
          value={value}
          onChange={onChange}
          className={inputClasses}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {options?.map((opt) => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={inputClasses}
        />
      )}

      {error && <p className="text-status-live text-sm">{error}</p>}
    </div>
  )
}
