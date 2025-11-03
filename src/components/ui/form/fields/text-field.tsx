import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
  error?: string
  maxLength?: number
  showCharCount?: boolean
}

export function TextField({
  label,
  description,
  error,
  maxLength,
  showCharCount,
  className,
  id,
  ...props
}: TextFieldProps) {
  const [charCount, setCharCount] = React.useState(props.value?.toString().length || 0)
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-")
  const descriptionId = description ? `${fieldId}-description` : undefined

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCharCount(e.target.value.length)
    props.onChange?.(e)
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={fieldId} className={error ? "text-destructive" : ""}>
          {label}
        </Label>
        {showCharCount && maxLength && (
          <span
            className={cn(
              "text-xs text-muted-foreground",
              charCount > maxLength * 0.8 && "text-amber-500",
              charCount >= maxLength && "text-destructive",
            )}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </div>
      <Input
        id={fieldId}
        className={cn(error && "border-destructive", className)}
        maxLength={maxLength}
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
