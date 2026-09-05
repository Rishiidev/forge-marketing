import type { InputHTMLAttributes } from 'react'
import { Input } from '@/components/ui/Input'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
}

/** Labeled wrapper around the ui/Input primitive — the standard field shape for every lead form. */
export function TextField({ label, name, ...rest }: TextFieldProps) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={name} className="text-body-sm font-semibold text-ink">
        {label}
      </label>
      <Input id={name} name={name} {...rest} />
    </div>
  )
}
