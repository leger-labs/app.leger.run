import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface NumberFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'step'> {
  label: string
  description?: string
  error?: string
  min?: number
  max?: number
  step?: number | string
  value?: number | string
  onChange?: (value: number | undefined) => void
}

export function NumberField({
  label,
  description,
  error,
  min,
  max,
  step = "any",
  value,
  onChange,
  className,
  id,
  ...props
}: NumberFieldProps) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-")
  const descriptionId = description ? `${fieldId}-description` : undefined

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    if (inputValue === "") {
      onChange?.(undefined)
      return
    }
    
    const numericValue = parseFloat(inputValue)
    if (!isNaN(numericValue)) {
      onChange?.(numericValue)
    }
  }

  const displayValue = value === undefined ? "" : value.toString()

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className={error ? "text-destructive" : ""}>
        {label}
      </Label>
      <Input
        id={fieldId}
        type="number"
        className={cn(error && "border-destructive", className)}
        min={min}
        max={max}
        step={step}
        value={displayValue}
        aria-describedby={!error && descriptionId ? descriptionId : undefined}
        onChange={handleChange}
        {...props}
      />
      {description && !error && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  )
}