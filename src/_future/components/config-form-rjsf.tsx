// src/components/config-form-rjsf.tsx
import React, { useState, useEffect, useCallback } from 'react'
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import type { ConfigData } from '@/types'
import { configDataToRjsf, rjsfToConfigData } from '@/_future/form/data-transformers'
import widgets from '@/_future/form/widgets'
import SimpleFieldTemplate from '@/_future/form/SimpleFieldTemplate'
import SimpleObjectFieldTemplate from '@/_future/form/SimpleObjectFieldTemplate'
import SimpleArrayFieldTemplate from '@/_future/form/SimpleArrayFieldTemplate'
import { cn } from '@/lib/utils'

// Import generated schemas from TypeScript (no JSON files!)
import { configSchema, uiSchema, schemaMetadata, getAllFieldNames } from '@/schemas/generated-schemas'

interface ConfigFormRJSFProps {
  data: ConfigData
  onDataChange: (data: ConfigData) => void
  className?: string
}

export function ConfigFormRJSF({ data, onDataChange, className }: ConfigFormRJSFProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Array<{ message: string }>>([])
  const [isValid, setIsValid] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general']))
  const [isLoading, setIsLoading] = useState(true)

  // Get top-level categories from schema
  const topLevelCategories = Object.keys(configSchema.properties || {})

  // Transform flat ConfigData to nested RJSF format
  useEffect(() => {
    try {
      setIsLoading(true)
      const transformedData = configDataToRjsf(data, configSchema)
      setFormData(transformedData)
      setErrors([])
      setIsValid(true)
    } catch (error) {
      console.error('Error transforming data:', error)
      setErrors([{ message: `Failed to load configuration data: ${error}` }])
      setIsValid(false)
    } finally {
      setIsLoading(false)
    }
  }, [data])

  // Handle form changes
  const handleChange = useCallback((e: any) => {
    try {
      setFormData(e.formData)
      const flatData = rjsfToConfigData(e.formData)
      onDataChange(flatData)
      setErrors(e.errors || [])
      setIsValid((e.errors?.length || 0) === 0)
    } catch (error) {
      console.error('Error handling form change:', error)
      setErrors([{ message: `Failed to process form changes: ${error}` }])
    }
  }, [onDataChange])

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(section)) {
        newExpanded.delete(section)
      } else {
        newExpanded.add(section)
      }
      return newExpanded
    })
  }, [])

  // Custom templates
  const templates = {
    FieldTemplate: SimpleFieldTemplate,
    ObjectFieldTemplate: SimpleObjectFieldTemplate,
    ArrayFieldTemplate: SimpleArrayFieldTemplate,
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <div className="text-muted-foreground">Loading configuration...</div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Schema Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Schema generated from OpenAPI spec • {schemaMetadata.categoryCount} categories • {schemaMetadata.fieldCount} fields
            </div>
            <div className="text-xs">
              Last updated: {new Date(schemaMetadata.generatedAt).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topLevelCategories.map(category => (
              <Button
                key={category}
                variant={expandedSections.has(category) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSection(category)}
                className="text-xs"
              >
                {expandedSections.has(category) ? (
                  <ChevronDown className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-1" />
                )}
                {category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedSections(new Set(topLevelCategories))}
              className="text-xs"
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedSections(new Set())}
              className="text-xs"
            >
              Collapse All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Validation Status */}
      {!isValid && errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix the validation errors before proceeding.
          </AlertDescription>
        </Alert>
      )}
      
      {isValid && formData && Object.keys(formData).length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Configuration is valid and ready for export.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Form */}
      <Card>
        <CardContent className="pt-6">
          <Form
            schema={configSchema}
            uiSchema={uiSchema}
            formData={formData}
            onChange={handleChange}
            validator={validator}
            widgets={widgets}
            templates={templates}
            showErrorList={false}
            noHtml5Validate
            liveValidate={false}
            omitExtraData={false}
            experimental_defaultFormStateBehavior={{
              arrayMinItems: { populate: 'never' },
              emptyObjectFields: 'skipDefaults'
            }}
          >
            <div style={{ display: 'none' }} />
          </Form>
        </CardContent>
      </Card>

      {/* Debug Information (only in development) */}
      {import.meta.env.DEV && (
        <Card>
          <CardContent className="pt-6">
            <details>
              <summary className="text-sm font-medium cursor-pointer">
                Debug: Schema Information
              </summary>
              <div className="mt-2 space-y-2 text-xs">
                <div>Total fields available: {getAllFieldNames().length}</div>
                <div>Categories: {topLevelCategories.join(', ')}</div>
                <div>Current form data keys: {Object.keys(formData).length}</div>
                {errors.length > 0 && (
                  <pre className="overflow-auto max-h-32 p-2 bg-muted rounded">
                    {JSON.stringify(errors, null, 2)}
                  </pre>
                )}
              </div>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ConfigFormRJSF
