import type { SelectHTMLAttributes, ReactNode } from 'react'
import { Select } from '@/components/ui/Select'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  name: string
  children: ReactNode
}

export function SelectField({ label, name, children, ...rest }: SelectFieldProps) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={name} className="text-body-sm font-semibold text-ink">
        {label}
      </label>
      <Select id={name} name={name} {...rest}>
        {children}
      </Select>
    </div>
  )
}
