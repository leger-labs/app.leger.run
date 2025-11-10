/**
 * Step 3: OpenWebUI Configuration
 * Configure OpenWebUI environment variables
 * Fields shown dynamically based on selected services
 * RAG settings are now loaded dynamically from marketplace JSON files
 */

import { useMemo, useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldGroup } from '@/components/releases/FieldGroup';
import type { CrystallizedConfig } from '@/types/release-wizard';
import type { FieldGroup as FieldGroupType } from '@/lib/field-grouping';
import { loadMarketplaceService, marketplaceServiceToFieldGroup } from '@/lib/marketplace-loader';

interface OpenWebUIConfigStepProps {
  config: Partial<CrystallizedConfig>;
  onUpdate: (data: Partial<CrystallizedConfig>) => void;
}

export function OpenWebUIConfigStep({ config, onUpdate }: OpenWebUIConfigStepProps) {
  const [formData, setFormData] = useState(config.openwebui || {});
  const [ragSharedGroup, setRagSharedGroup] = useState<FieldGroupType | null>(null);
  const [ragProviderGroup, setRagProviderGroup] = useState<FieldGroupType | null>(null);

  // Get selected models for model-selector fields
  const selectedModels = useMemo(() => config.models?.selected || [], [config.models]);

  // Determine selected services from Step 2
  const selectedRAG = config.services?.rag;
  const selectedSearch = config.services?.['web-search'];
  const selectedSTT = config.services?.stt;
  const selectedTTS = config.services?.tts;
  const selectedImage = config.services?.['image-generation'];
  const selectedCode = config.services?.['code-execution'];

  // Load RAG shared settings dynamically from marketplace
  useEffect(() => {
    if (selectedRAG) {
      loadMarketplaceService('rag-shared').then((service) => {
        if (service) {
          const group = marketplaceServiceToFieldGroup(service, true, true);
          setRagSharedGroup(group);
        }
      });
    } else {
      setRagSharedGroup(null);
    }
  }, [selectedRAG]);

  // Load RAG provider-specific settings dynamically from marketplace
  useEffect(() => {
    if (selectedRAG) {
      loadMarketplaceService(selectedRAG).then((service) => {
        if (service) {
          const group = marketplaceServiceToFieldGroup(service, true, false);
          // Update the label to indicate it's provider-specific
          group.label = `${service.name} Settings`;
          group.description = service.description || `Provider-specific configuration for ${service.name}`;
          setRagProviderGroup(group);
        } else {
          setRagProviderGroup(null);
        }
      });
    } else {
      setRagProviderGroup(null);
    }
  }, [selectedRAG]);

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
          options: ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ko', 'pt', 'ru', 'ar'],
          default: 'en',
          label: 'Default Locale',
        },
        { name: 'CUSTOM_NAME', type: 'text', default: '', label: 'Custom Name (Optional)' },
      ],
      collapsible: false,
      defaultExpanded: true,
    });

    // Task Models (always shown)
    groups.push({
      id: 'task-models',
      label: 'AI Task Models',
      description: 'Models for automated tasks (title generation, tags, autocomplete)',
      fields: [
        {
          name: 'TASK_MODEL_TITLE',
          type: 'model-selector',
          filter: 'ultra-lightweight',
          default: 'qwen3-0.6b',
          label: 'Title Generation Model',
          required: false,
        },
        {
          name: 'TASK_MODEL_TAGS',
          type: 'model-selector',
          filter: 'lightweight',
          default: 'qwen3-4b',
          label: 'Tag Generation Model',
          required: false,
        },
        {
          name: 'TASK_MODEL_AUTOCOMPLETE',
          type: 'model-selector',
          filter: 'ultra-lightweight',
          default: 'qwen3-0.6b',
          label: 'Autocomplete Model',
          required: false,
        },
        {
          name: 'AUTOCOMPLETE_INPUT_MAX_LENGTH',
          type: 'number',
          default: -1,
          min: -1,
          max: 10000,
          label: 'Autocomplete Max Input Length (-1 = unlimited)',
        },
      ],
      collapsible: true,
      defaultExpanded: true,
    });

    // RAG Shared Settings (dynamically loaded from rag-shared.json)
    // Only shown when ANY RAG provider is selected
    if (ragSharedGroup) {
      groups.push(ragSharedGroup);
    }

    // RAG Provider-Specific Settings (dynamically loaded from provider's JSON)
    // Only shown when a specific RAG provider is selected (e.g., qdrant, chroma)
    if (ragProviderGroup) {
      groups.push(ragProviderGroup);
    }

    // Search Configuration (only if search service selected)
    if (selectedSearch) {
      groups.push({
        id: 'search',
        label: 'Web Search Configuration',
        description: 'Settings for web search functionality',
        fields: [
          {
            name: 'WEB_LOADER_ENGINE',
            type: 'select',
            options: ['requests', 'selenium', 'playwright', 'safe_web'],
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
          {
            name: 'WEB_SEARCH_RESULT_COUNT',
            type: 'number',
            default: 3,
            min: 1,
            max: 20,
            label: 'Max Search Results',
          },
          {
            name: 'WEB_LOADER_CONCURRENT_REQUESTS',
            type: 'number',
            default: 10,
            min: 1,
            max: 50,
            label: 'Concurrent Web Requests',
          },
        ],
        collapsible: true,
        defaultExpanded: false,
      });
    }

    // Image Generation Configuration (only if image service selected)
    if (selectedImage) {
      groups.push({
        id: 'image',
        label: 'Image Generation Configuration',
        description: 'Settings for image generation functionality',
        fields: [
          {
            name: 'IMAGE_SIZE',
            type: 'text',
            default: '512x512',
            label: 'Default Image Size (WIDTHxHEIGHT)',
          },
          {
            name: 'IMAGE_STEPS',
            type: 'number',
            default: 50,
            min: 1,
            max: 150,
            label: 'Diffusion Steps',
          },
          {
            name: 'ENABLE_IMAGE_PROMPT_GENERATION',
            type: 'checkbox',
            default: true,
            label: 'Enable AI Prompt Enhancement',
          },
        ],
        collapsible: true,
        defaultExpanded: false,
      });
    }

    // Code Execution Configuration (only if code execution service selected)
    if (selectedCode) {
      groups.push({
        id: 'code',
        label: 'Code Execution Configuration',
        description: 'Settings for code execution functionality',
        fields: [
          {
            name: 'CODE_INTERPRETER_BLACKLISTED_MODULES',
            type: 'text',
            default: '',
            label: 'Blacklisted Modules (comma-separated)',
          },
        ],
        collapsible: true,
        defaultExpanded: false,
      });
    }

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
          name: 'CACHE_CONTROL',
          type: 'text',
          default: '',
          label: 'HTTP Cache Control Header',
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
  }, [
    ragSharedGroup,
    ragProviderGroup,
    selectedRAG,
    selectedSearch,
    selectedSTT,
    selectedTTS,
    selectedImage,
    selectedCode,
  ]);

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
          <Label htmlFor={field.name}>
            {field.label || field.name}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={field.name}
            type="text"
            value={value as string}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.default as string}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {field.description}
            </p>
          )}
        </div>
      );
    }

    if (field.type === 'number') {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label || field.name}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={field.name}
            type="number"
            step={field.name.includes('THRESHOLD') || field.name.includes('WEIGHT') ? '0.1' : '1'}
            value={value as number}
            onChange={(e) => {
              const numValue = field.name.includes('THRESHOLD') || field.name.includes('WEIGHT')
                ? parseFloat(e.target.value) || 0
                : parseInt(e.target.value) || 0;
              handleFieldChange(field.name, numValue);
            }}
            min={field.min}
            max={field.max}
            placeholder={String(field.default)}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {field.description}
            </p>
          )}
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div key={field.name} className="space-y-2">
          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id={field.name}
              checked={value as boolean}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <Label htmlFor={field.name} className="cursor-pointer">
              {field.label || field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
          {field.description && (
            <p className="text-xs text-muted-foreground">
              {field.description}
            </p>
          )}
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label || field.name}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
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
          {field.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {field.description}
            </p>
          )}
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
          <Label htmlFor={field.name}>
            {field.label || field.name}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select
            value={value as string}
            onValueChange={(val) => handleFieldChange(field.name, val)}
          >
            <SelectTrigger id={field.name}>
              <SelectValue placeholder={`Select ${field.label || field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {filteredModels.length === 0 ? (
                <SelectItem value={field.default as string}>
                  {field.default as string} (default)
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
              Using default model. Select a {field.filter} model in Step 1 to customize.
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
