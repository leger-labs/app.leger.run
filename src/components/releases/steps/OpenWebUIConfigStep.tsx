/**
 * Step 3: OpenWebUI Configuration
 * Configure OpenWebUI environment variables
 * Fields shown dynamically based on selected services
 */

import { useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldGroup } from '@/components/releases/FieldGroup';
import type { CrystallizedConfig, ConfigFieldGroup, ConfigField } from '@/types/release-wizard';
import type { FieldGroup as FieldGroupType } from '@/lib/field-grouping';

interface OpenWebUIConfigStepProps {
  config: Partial<CrystallizedConfig>;
  onUpdate: (data: Partial<CrystallizedConfig>) => void;
}

export function OpenWebUIConfigStep({ config, onUpdate }: OpenWebUIConfigStepProps) {
  const [formData, setFormData] = useState(config.openwebui || {});

  // Get selected models for model-selector fields
  const selectedModels = useMemo(() => config.models?.selected || [], [config.models]);

  // Dynamically determine which field groups to show based on Step 2 selections
  const fieldGroups = useMemo((): FieldGroupType[] => {
    const groups: FieldGroupType[] = [];

    // General Settings (always shown)
    groups.push({
      id: 'general',
      label: 'General Settings',
      description: 'Basic OpenWebUI configuration',
      fields: [
        { name: 'WEBUI_NAME', type: 'text', default: 'Leger AI', label: 'WebUI Name' },
        {
          name: 'DEFAULT_LOCALE',
          type: 'select',
          options: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
          default: 'en',
          label: 'Default Locale',
        },
        { name: 'CUSTOM_NAME', type: 'text', default: '', label: 'Custom Name (Optional)' },
      ],
      collapsible: false,
      defaultExpanded: true,
    });

    // RAG Configuration (only if RAG service selected)
    if (config.services?.rag) {
      groups.push({
        id: 'rag',
        label: 'RAG Configuration',
        description: 'Settings for Retrieval-Augmented Generation',
        fields: [
          {
            name: 'RAG_TOP_K',
            type: 'number',
            default: 5,
            min: 1,
            max: 50,
            label: 'Top K Results',
          },
          {
            name: 'CHUNK_SIZE',
            type: 'number',
            default: 1500,
            min: 100,
            max: 10000,
            label: 'Chunk Size',
          },
          {
            name: 'CHUNK_OVERLAP',
            type: 'number',
            default: 100,
            min: 0,
            max: 1000,
            label: 'Chunk Overlap',
          },
          {
            name: 'RAG_EMBEDDING_MODEL',
            type: 'model-selector',
            filter: 'embeddings',
            default: 'qwen3-embedding-8b',
            label: 'Embedding Model',
          },
        ],
        collapsible: true,
        defaultExpanded: true,
      });
    }

    // Search Configuration (only if search service selected)
    if (config.services?.['web-search']) {
      groups.push({
        id: 'search',
        label: 'Web Search Configuration',
        description: 'Settings for web search functionality',
        fields: [
          {
            name: 'WEB_LOADER_ENGINE',
            type: 'select',
            options: ['requests', 'selenium', 'playwright'],
            default: 'requests',
            label: 'Web Loader Engine',
          },
          {
            name: 'TASK_MODEL_SEARCH_QUERY',
            type: 'model-selector',
            filter: 'lightweight',
            default: 'qwen3-4b',
            label: 'Search Query Model',
          },
        ],
        collapsible: true,
        defaultExpanded: false,
      });
    }

    // Task Models (always shown)
    groups.push({
      id: 'task-models',
      label: 'AI Task Models',
      description: 'Models for automated tasks (title generation, tags, autocomplete)',
      fields: [
        {
          name: 'TASK_MODEL',
          type: 'model-selector',
          filter: 'ultra-lightweight',
          default: 'qwen3-0.6b',
          label: 'Title Generation Model',
        },
        {
          name: 'TASK_MODEL_TAGS',
          type: 'model-selector',
          filter: 'lightweight',
          default: 'qwen3-4b',
          label: 'Tag Generation Model',
        },
        {
          name: 'TASK_MODEL_AUTOCOMPLETE',
          type: 'model-selector',
          filter: 'ultra-lightweight',
          default: 'qwen3-0.6b',
          label: 'Autocomplete Model',
        },
      ],
      collapsible: true,
      defaultExpanded: true,
    });

    // Advanced Settings
    groups.push({
      id: 'advanced',
      label: 'Advanced Settings',
      description: 'Advanced OpenWebUI configuration',
      fields: [
        {
          name: 'LOG_LEVEL',
          type: 'select',
          options: ['DEBUG', 'INFO', 'WARNING', 'ERROR'],
          default: 'INFO',
          label: 'Log Level',
        },
        {
          name: 'REDIS_KEY_PREFIX',
          type: 'text',
          default: 'open-webui',
          label: 'Redis Key Prefix',
        },
        {
          name: 'OPENWEBUI_TIMEOUT_START',
          type: 'number',
          default: 900,
          min: 60,
          max: 1800,
          label: 'Startup Timeout (seconds)',
        },
      ],
      collapsible: true,
      defaultExpanded: false,
    });

    return groups as FieldGroupType[];
  }, [config.services]);

  const handleFieldChange = (fieldName: string, value: string | number | boolean) => {
    const newFormData = {
      ...formData,
      [fieldName]: value,
    };
    setFormData(newFormData);
    onUpdate({ openwebui: newFormData });
  };

  // Render a single field
  const renderField = (field: any) => {
    const value = formData[field.name] ?? field.default;

    if (field.type === 'text') {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label || field.name}</Label>
          <Input
            id={field.name}
            type="text"
            value={value as string}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.default as string}
          />
        </div>
      );
    }

    if (field.type === 'number') {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label || field.name}</Label>
          <Input
            id={field.name}
            type="number"
            value={value as number}
            onChange={(e) => handleFieldChange(field.name, parseInt(e.target.value) || 0)}
            min={field.min}
            max={field.max}
            placeholder={String(field.default)}
          />
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label || field.name}</Label>
          <Select
            value={value as string}
            onValueChange={(val) => handleFieldChange(field.name, val)}
          >
            <SelectTrigger id={field.name}>
              <SelectValue placeholder={`Select ${field.label || field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (field.type === 'model-selector') {
      // Filter models based on field.filter criteria
      const filteredModels = selectedModels.filter((m) => {
        const modelId = m.model_id.toLowerCase();

        switch (field.filter) {
          case 'embeddings':
            return modelId.includes('embed') || modelId.includes('embedding');
          case 'ultra-lightweight':
            // Models with less than 1B parameters (0.6b, etc.)
            return modelId.includes('0.6b') || modelId.includes('tiny');
          case 'lightweight':
            // Models with less than 5B parameters (4b, etc.)
            return (
              modelId.includes('4b') ||
              modelId.includes('3b') ||
              modelId.includes('0.6b') ||
              modelId.includes('tiny')
            );
          default:
            return true;
        }
      });

      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label || field.name}</Label>
          <Select
            value={value as string}
            onValueChange={(val) => handleFieldChange(field.name, val)}
          >
            <SelectTrigger id={field.name}>
              <SelectValue placeholder={`Select ${field.label || field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {filteredModels.length === 0 ? (
                <SelectItem value={field.default as string} disabled>
                  No suitable models selected in Step 1
                </SelectItem>
              ) : (
                filteredModels.map((model) => (
                  <SelectItem key={model.model_id} value={model.model_id}>
                    {model.model_id}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {filteredModels.length === 0 && (
            <p className="text-xs text-amber-600">
              Please select a {field.filter} model in Step 1
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>OpenWebUI Configuration</AlertTitle>
        <AlertDescription>
          Configure environment variables for OpenWebUI. Settings shown are based on your service
          selections from the previous step.
        </AlertDescription>
      </Alert>

      {/* Render field groups */}
      <div className="space-y-6">
        {fieldGroups.map((group) => (
          <FieldGroup key={group.id} group={group}>
            <div className="space-y-4">
              {group.fields.map((field) => renderField(field))}
            </div>
          </FieldGroup>
        ))}
      </div>
    </div>
  );
}
