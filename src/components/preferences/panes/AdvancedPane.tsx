import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SettingsField: React.FC<{
  label: string
  children: React.ReactNode
  description?: string
}> = ({ label, children, description }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-foreground">{label}</Label>
    {children}
    {description && (
      <p className="text-sm text-muted-foreground">{description}</p>
    )}
  </div>
)

const SettingsSection: React.FC<{
  title: string
  children: React.ReactNode
}> = ({ title, children }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <Separator className="mt-2" />
    </div>
    <div className="space-y-4">{children}</div>
  </div>
)

export const AdvancedPane: React.FC = () => {
  // Example local state - these are NOT persisted to disk
  // To add persistent preferences:
  // 1. Add the field to AppPreferences in both Rust and TypeScript
  // 2. Use usePreferencesManager() and updatePreferences()
  const [exampleAdvancedToggle, setExampleAdvancedToggle] = useState(false)
  const [exampleDropdown, setExampleDropdown] = useState('option1')

  return (
    <div className="space-y-6">
      <SettingsSection title="Example Advanced Settings">
        <SettingsField
          label="Example Advanced Toggle"
          description="This is an example advanced toggle setting (not persisted)"
        >
          <div className="flex items-center space-x-2">
            <Switch
              id="example-advanced-toggle"
              checked={exampleAdvancedToggle}
              onCheckedChange={setExampleAdvancedToggle}
            />
            <Label htmlFor="example-advanced-toggle" className="text-sm">
              {exampleAdvancedToggle ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        </SettingsField>

        <SettingsField
          label="Example Dropdown Setting"
          description="This is an example dropdown/select setting (not persisted)"
        >
          <Select value={exampleDropdown} onValueChange={setExampleDropdown}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Example Option 1</SelectItem>
              <SelectItem value="option2">Example Option 2</SelectItem>
              <SelectItem value="option3">Example Option 3</SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>
      </SettingsSection>
    </div>
  )
}
