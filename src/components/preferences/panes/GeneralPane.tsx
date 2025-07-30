import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'

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

export const GeneralPane: React.FC = () => {
  // Example local state - these are NOT persisted to disk
  // To add persistent preferences:
  // 1. Add the field to AppPreferences in both Rust and TypeScript
  // 2. Use usePreferencesManager() and updatePreferences()
  const [exampleText, setExampleText] = useState('Example value')
  const [exampleToggle, setExampleToggle] = useState(true)

  return (
    <div className="space-y-6">
      <SettingsSection title="Example Settings">
        <SettingsField
          label="Example Text Setting"
          description="This is an example text input setting (not persisted)"
        >
          <Input
            value={exampleText}
            onChange={e => setExampleText(e.target.value)}
            placeholder="Enter example text"
          />
        </SettingsField>

        <SettingsField
          label="Example Toggle Setting"
          description="This is an example switch/toggle setting (not persisted)"
        >
          <div className="flex items-center space-x-2">
            <Switch
              id="example-toggle"
              checked={exampleToggle}
              onCheckedChange={setExampleToggle}
            />
            <Label htmlFor="example-toggle" className="text-sm">
              {exampleToggle ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        </SettingsField>
      </SettingsSection>
    </div>
  )
}
