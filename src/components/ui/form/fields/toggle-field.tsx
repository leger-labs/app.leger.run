import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface ToggleFieldProps {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
}

export function ToggleField({ label, description, checked, onCheckedChange, disabled, id }: ToggleFieldProps) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, "-")
  const descriptionId = description ? `${fieldId}-description` : undefined

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor={fieldId}>{label}</Label>
          {description && (
            <p id={descriptionId} className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <Switch
          id={fieldId}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-describedby={descriptionId}
        />
      </div>
    </div>
  )
}
