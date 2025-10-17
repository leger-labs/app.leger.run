// src/components/ui/form/fields/select-field.stories.tsx
import type { Story } from '@ladle/react'
import { SelectField } from './select-field'
import { useState } from 'react'

export default {
  title: 'Form Fields / SelectField',
}

const frameworkOptions = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'next', label: 'Next.js' },
]

export const Basic: Story = () => {
  const [value, setValue] = useState('')
  
  return (
    <div className="max-w-md p-8">
      <SelectField
        label="Framework"
        description="Choose your preferred framework"
        options={frameworkOptions}
        value={value}
        onChange={setValue}
        placeholder="Select a framework"
      />
    </div>
  )
}

Basic.meta = {
  description: 'Basic select field with multiple options',
}

export const WithPreselected: Story = () => {
  const [value, setValue] = useState('react')
  
  return (
    <div className="max-w-md p-8">
      <SelectField
        label="Default Framework"
        description="Framework used for new projects"
        options={frameworkOptions}
        value={value}
        onChange={setValue}
      />
    </div>
  )
}

export const WithError: Story = () => {
  const [value, setValue] = useState('')
  
  return (
    <div className="max-w-md p-8">
      <SelectField
        label="Region"
        description="Select deployment region"
        options={[
          { value: 'us-east', label: 'US East' },
          { value: 'us-west', label: 'US West' },
          { value: 'eu-west', label: 'EU West' },
        ]}
        value={value}
        onChange={setValue}
        error="Region selection is required"
      />
    </div>
  )
}

export const Disabled: Story = () => {
  return (
    <div className="max-w-md p-8">
      <SelectField
        label="Plan"
        description="Current subscription plan"
        options={[
          { value: 'free', label: 'Free' },
          { value: 'pro', label: 'Pro' },
          { value: 'enterprise', label: 'Enterprise' },
        ]}
        value="pro"
        onChange={() => {}}
        disabled
      />
    </div>
  )
}

export const LongList: Story = () => {
  const [value, setValue] = useState('')
  
  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'gb', label: 'United Kingdom' },
    { value: 'fr', label: 'France' },
    { value: 'de', label: 'Germany' },
    { value: 'jp', label: 'Japan' },
    { value: 'au', label: 'Australia' },
    { value: 'br', label: 'Brazil' },
    { value: 'in', label: 'India' },
    { value: 'cn', label: 'China' },
  ]
  
  return (
    <div className="max-w-md p-8">
      <SelectField
        label="Country"
        description="Select your country"
        options={countries}
        value={value}
        onChange={setValue}
        placeholder="Search countries..."
      />
    </div>
  )
}

LongList.meta = {
  description: 'Select field with many options (scrollable)',
}
