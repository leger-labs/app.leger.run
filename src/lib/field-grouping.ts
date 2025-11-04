/**
 * Field Grouping Utilities
 *
 * Groups configuration fields by provider/feature for better UX
 */

import type { ReleaseCategory, CategoryField } from '@/types/release-schema';
import { getValueAtPath, checkDependencies } from '@/lib/progressive-disclosure';

export interface FieldGroup {
  id: string;
  label: string;
  description?: string;
  fields: CategoryField[];
  icon?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

/**
 * Group provider config fields by their provider
 */
export function groupProviderFields(
  fields: CategoryField[],
  formData: Record<string, any>,
  schema: any
): FieldGroup[] {
  const groups: FieldGroup[] = [];
  const groupedFields = new Map<string, CategoryField[]>();
  const ungroupedFields: CategoryField[] = [];

  // Analyze each field to determine its group
  fields.forEach((field) => {
    const schemaDef = getSchemaForField(schema, field.path);
    if (!schemaDef) {
      ungroupedFields.push(field);
      return;
    }

    // Check dependencies to determine provider group
    const deps = schemaDef['x-depends-on'];
    if (!deps) {
      ungroupedFields.push(field);
      return;
    }

    // Find provider dependency
    const providerDep = Object.entries(deps).find(([key]) =>
      key.startsWith('providers.')
    );

    if (providerDep) {
      const [providerKey, providerValue] = providerDep;
      const providerName = providerKey.split('.')[1];
      const groupKey = `${providerName}:${providerValue}`;

      if (!groupedFields.has(groupKey)) {
        groupedFields.set(groupKey, []);
      }
      groupedFields.get(groupKey)!.push(field);
    } else {
      ungroupedFields.push(field);
    }
  });

  // Create field groups
  groupedFields.forEach((groupFields, groupKey) => {
    const [providerType, providerValue] = groupKey.split(':');
    const label = getProviderLabel(providerType, providerValue as string);

    groups.push({
      id: groupKey,
      label,
      description: getProviderDescription(providerType, providerValue as string),
      fields: groupFields,
      collapsible: true,
      defaultExpanded: true,
    });
  });

  // Add ungrouped fields at the end
  if (ungroupedFields.length > 0) {
    groups.push({
      id: 'general',
      label: 'General Settings',
      fields: ungroupedFields,
      collapsible: false,
      defaultExpanded: true,
    });
  }

  return groups;
}

/**
 * Group RAG-related fields
 */
export function groupRAGFields(
  fields: CategoryField[],
  formData: Record<string, any>,
  schema: any
): FieldGroup[] {
  const groups: FieldGroup[] = [];
  const ragProviders: CategoryField[] = [];
  const ragAdvanced: CategoryField[] = [];
  const ragTaskModels: CategoryField[] = [];
  const otherFields: CategoryField[] = [];

  fields.forEach((field) => {
    const path = field.path.toLowerCase();

    if (path.includes('task_model') && (path.includes('query') || path.includes('rag'))) {
      ragTaskModels.push(field);
    } else if (
      path.includes('rag_top_k') ||
      path.includes('chunk_size') ||
      path.includes('chunk_overlap')
    ) {
      ragAdvanced.push(field);
    } else if (path.startsWith('providers.')) {
      ragProviders.push(field);
    } else {
      otherFields.push(field);
    }
  });

  if (ragProviders.length > 0) {
    groups.push({
      id: 'rag-providers',
      label: 'RAG Providers',
      description: 'Select which providers to use for vector database, embeddings, and document processing',
      fields: ragProviders,
      collapsible: false,
      defaultExpanded: true,
    });
  }

  if (ragTaskModels.length > 0) {
    groups.push({
      id: 'rag-task-models',
      label: 'RAG Task Models',
      description: 'Models used for query generation and RAG template creation',
      fields: ragTaskModels,
      collapsible: true,
      defaultExpanded: false,
    });
  }

  if (ragAdvanced.length > 0) {
    groups.push({
      id: 'rag-advanced',
      label: 'Advanced RAG Settings',
      description: 'Fine-tune RAG behavior (chunk sizes, overlap, top K results)',
      fields: ragAdvanced,
      collapsible: true,
      defaultExpanded: false,
    });
  }

  if (otherFields.length > 0) {
    groups.push({
      id: 'rag-other',
      label: 'Other Settings',
      fields: otherFields,
      collapsible: false,
      defaultExpanded: true,
    });
  }

  return groups;
}

/**
 * Group AI assistance fields
 */
export function groupAIAssistanceFields(
  fields: CategoryField[],
  formData: Record<string, any>
): FieldGroup[] {
  const groups: FieldGroup[] = [];
  const titleFields: CategoryField[] = [];
  const tagsFields: CategoryField[] = [];
  const autocompleteFields: CategoryField[] = [];
  const otherFields: CategoryField[] = [];

  fields.forEach((field) => {
    const path = field.path.toLowerCase();

    if (path.includes('title')) {
      titleFields.push(field);
    } else if (path.includes('tags')) {
      tagsFields.push(field);
    } else if (path.includes('autocomplete')) {
      autocompleteFields.push(field);
    } else {
      otherFields.push(field);
    }
  });

  if (titleFields.length > 0) {
    groups.push({
      id: 'ai-title',
      label: 'Title Generation',
      description: 'Automatically generate conversation titles',
      fields: titleFields,
      collapsible: true,
      defaultExpanded: true,
    });
  }

  if (tagsFields.length > 0) {
    groups.push({
      id: 'ai-tags',
      label: 'Tags Generation',
      description: 'Automatically generate conversation tags',
      fields: tagsFields,
      collapsible: true,
      defaultExpanded: true,
    });
  }

  if (autocompleteFields.length > 0) {
    groups.push({
      id: 'ai-autocomplete',
      label: 'Autocomplete',
      description: 'AI-powered input suggestions',
      fields: autocompleteFields,
      collapsible: true,
      defaultExpanded: true,
    });
  }

  if (otherFields.length > 0) {
    groups.push({
      id: 'ai-other',
      label: 'Other AI Features',
      fields: otherFields,
      collapsible: false,
      defaultExpanded: true,
    });
  }

  return groups;
}

/**
 * Get appropriate grouping strategy for a category
 */
export function getFieldGroups(
  category: ReleaseCategory,
  fields: CategoryField[],
  formData: Record<string, any>,
  schema: any
): FieldGroup[] {
  if (fields.length === 0) {
    return [];
  }

  // Special grouping for specific categories
  switch (category.name) {
    case 'Providers':
      // For providers, just show fields flat (they're already provider selections)
      return [
        {
          id: 'providers-all',
          label: 'Provider Selections',
          description: 'Choose which provider to use for each enabled feature',
          fields,
          collapsible: false,
          defaultExpanded: true,
        },
      ];

    case 'Core':
      // Core fields grouped by provider
      return groupProviderFields(fields, formData, schema);

    case 'Advanced':
      // Group by feature/provider
      return groupProviderFields(fields, formData, schema);

    case 'AI Assistance':
      return groupAIAssistanceFields(fields, formData);

    case 'Features':
      // Features tab - group by category
      const featureGroups = new Map<string, CategoryField[]>();

      fields.forEach((field) => {
        const schemaDef = getSchemaForField(schema, field.path);
        const category = schemaDef?.['x-category'] || 'Other';

        if (!featureGroups.has(category)) {
          featureGroups.set(category, []);
        }
        featureGroups.get(category)!.push(field);
      });

      return Array.from(featureGroups.entries()).map(([category, fields]) => ({
        id: category.toLowerCase().replace(/\s+/g, '-'),
        label: category,
        fields,
        collapsible: false,
        defaultExpanded: true,
      }));

    default:
      // Default: single group
      return [
        {
          id: 'default',
          label: category.name,
          fields,
          collapsible: false,
          defaultExpanded: true,
        },
      ];
  }
}

/**
 * Get schema definition for a field path
 */
function getSchemaForField(schema: any, fieldPath: string): any {
  if (!schema || !fieldPath) return null;

  const segments = fieldPath.split('.');
  let current = schema;

  for (const segment of segments) {
    if (!current) return null;

    if (segment === 'items') {
      if (current.items) {
        current = Array.isArray(current.items) ? current.items[0] : current.items;
      } else {
        return null;
      }
      continue;
    }

    if (current.properties && current.properties[segment]) {
      current = current.properties[segment];
    } else if (current.type === 'object' && current.properties) {
      current = current.properties[segment];
    } else {
      return null;
    }
  }

  return current;
}

/**
 * Get human-readable label for a provider
 */
function getProviderLabel(providerType: string, providerValue: string): string {
  const labels: Record<string, Record<string, string>> = {
    vector_db: {
      qdrant: 'Qdrant Vector Database',
      pgvector: 'PostgreSQL with pgvector',
      chroma: 'ChromaDB',
    },
    rag_embedding: {
      openai: 'OpenAI Embeddings',
      ollama: 'Ollama Embeddings',
    },
    content_extraction: {
      tika: 'Apache Tika',
      docling: 'Docling',
    },
    web_search_engine: {
      searxng: 'SearXNG',
      tavily: 'Tavily',
      brave: 'Brave Search',
    },
    image_engine: {
      comfyui: 'ComfyUI',
      automatic1111: 'Automatic1111',
      openai: 'OpenAI DALL-E',
    },
    stt_engine: {
      whisper: 'Whisper STT',
      openai: 'OpenAI Whisper',
    },
    tts_engine: {
      edgetts: 'Edge TTS',
      elevenlabs: 'ElevenLabs',
      openai: 'OpenAI TTS',
    },
    code_execution_engine: {
      jupyter: 'Jupyter',
      pyodide: 'Pyodide',
    },
    code_interpreter_engine: {
      jupyter: 'Jupyter',
      e2b: 'E2B',
    },
  };

  return labels[providerType]?.[providerValue] || `${providerValue} Configuration`;
}

/**
 * Get description for a provider
 */
function getProviderDescription(providerType: string, providerValue: string): string | undefined {
  const descriptions: Record<string, Record<string, string>> = {
    vector_db: {
      qdrant: 'Configure your Qdrant vector database connection and settings',
      pgvector: 'PostgreSQL with pgvector extension for vector search',
      chroma: 'Configure ChromaDB settings',
    },
    web_search_engine: {
      searxng: 'Self-hosted meta-search engine configuration',
      tavily: 'Tavily API settings for AI-powered search',
      brave: 'Brave Search API configuration',
    },
    image_engine: {
      comfyui: 'ComfyUI workspace and execution settings',
    },
    stt_engine: {
      whisper: 'Faster Whisper speech-to-text configuration',
    },
    tts_engine: {
      edgetts: 'Microsoft Edge text-to-speech settings',
    },
  };

  return descriptions[providerType]?.[providerValue];
}
