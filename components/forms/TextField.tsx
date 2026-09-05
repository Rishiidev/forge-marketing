import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
}

export function TextField({ label, name, ...rest }: TextFieldProps) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={name} className="text-xs font-semibold text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="min-h-[48px] w-full rounded-xl border border-ink/10 bg-paper px-4 text-sm text-ink outline-none transition-colors focus:border-ground focus:bg-white"
        {...rest}
      />
    </div>
  )
}
