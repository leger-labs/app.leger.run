/**
 * Utility functions for loading and processing marketplace service definitions
 */

import type { MarketplaceService } from '@/types/release-wizard';
import type { ConfigField } from '@/types/release-wizard';

/**
 * Load a specific marketplace service by ID
 */
export async function loadMarketplaceService(
  serviceId: string
): Promise<MarketplaceService | null> {
  try {
    const module = await import(
      `/src/data/marketplace/${serviceId}.json`
    );
    return module.default;
  } catch (error) {
    console.error(`Failed to load marketplace service: ${serviceId}`, error);
    return null;
  }
}

/**
 * Load all marketplace services
 */
export async function loadAllMarketplaceServices(): Promise<MarketplaceService[]> {
  try {
    const files = import.meta.glob('/src/data/marketplace/*.json');
    const services: MarketplaceService[] = [];

    for (const path in files) {
      const module = (await files[path]()) as { default: MarketplaceService };
      services.push(module.default);
    }

    return services;
  } catch (error) {
    console.error('Failed to load marketplace services:', error);
    return [];
  }
}

/**
 * Convert marketplace variable definition to ConfigField format
 */
export function marketplaceVariableToConfigField(
  variable: MarketplaceService['openwebui_variables'][number]
): ConfigField {
  const field: Partial<ConfigField> = {
    name: variable.name,
    label: variable.name.replace(/_/g, ' '),
    description: variable.description,
  };

  // Map variable type to field type
  switch (variable.type) {
    case 'str':
      if (variable.options && variable.options.length > 0) {
        field.type = 'select';
        field.options = variable.options;
      } else {
        field.type = 'text';
      }
      field.default = variable.default as string;
      break;

    case 'int':
      field.type = 'number';
      field.default = variable.default as number;
      // Set reasonable min/max if not specified
      if (variable.name.includes('SIZE') || variable.name.includes('COUNT')) {
        field.min = 0;
        field.max = 100000;
      }
      if (variable.name.includes('TOP_K')) {
        field.min = 1;
        field.max = 100;
      }
      if (variable.name.includes('THRESHOLD')) {
        field.min = 0;
        field.max = 1;
      }
      if (variable.name.includes('OVERLAP')) {
        field.min = 0;
        field.max = 5000;
      }
      if (variable.name.includes('PORT')) {
        field.min = 1;
        field.max = 65535;
      }
      if (variable.name.includes('TIMEOUT')) {
        field.min = 1;
        field.max = 300;
      }
      break;

    case 'float':
      field.type = 'number';
      field.default = variable.default as number;
      // Floats typically have smaller ranges
      field.min = 0;
      field.max = 1;
      break;

    case 'bool':
      field.type = 'checkbox';
      // Handle string boolean defaults
      if (typeof variable.default === 'string') {
        field.default = variable.default.toLowerCase() === 'true';
      } else {
        field.default = variable.default as boolean;
      }
      break;

    case 'list':
      field.type = 'text';
      field.default = Array.isArray(variable.default)
        ? variable.default.join(', ')
        : '';
      field.description = (field.description || '') + ' (comma-separated list)';
      break;

    default:
      field.type = 'text';
      field.default = String(variable.default || '');
  }

  return field as ConfigField;
}

/**
 * Convert marketplace service to field group configuration
 */
export function marketplaceServiceToFieldGroup(
  service: MarketplaceService,
  collapsible: boolean = true,
  defaultExpanded: boolean = true
) {
  const fields = service.openwebui_variables.map(marketplaceVariableToConfigField);

  return {
    id: service.id,
    label: service.name,
    description: service.description,
    fields,
    collapsible,
    defaultExpanded,
  };
}
