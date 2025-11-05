/**
 * Type definitions for marketplace services
 * Based on the service JSONs from the marketplace repository
 */

/**
 * Variable definition for a service
 */
export interface ServiceVariable {
  name: string;
  type: 'str' | 'int' | 'float' | 'bool';
  default: string | number | boolean | null;
  description: string | null;
  options: string[];
}

/**
 * Service definition
 */
export interface Service {
  id: string;
  name: string;
  category: string;
  requires_api_key: boolean;
  logo: string; // path to asset (e.g., "/assets/qdrant.png")
  openwebui_variables: ServiceVariable[];
}

/**
 * Service categories
 */
export const SERVICE_CATEGORIES = [
  'llm',
  'rag',
  'image-generation',
  'speech-to-text',
  'text-to-speech',
  'web-search',
  'storage',
  'database',
  'cache',
  'code-execution',
  'document-integration',
  'content-extraction',
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

/**
 * Category display metadata
 */
export interface CategoryMetadata {
  id: ServiceCategory | 'all';
  name: string;
  count?: number;
}

/**
 * Marketplace service state
 */
export interface MarketplaceData {
  services: Map<string, Service>;
  servicesByCategory: Map<string, Service[]>;
}

/**
 * Filter options for browsing services
 */
export interface ServiceFilters {
  search?: string;
  category?: string;
  requiresApiKey?: boolean;
}

/**
 * Installed service configuration
 */
export interface InstalledService {
  serviceId: string;
  config: Record<string, any>;
  installedAt: string;
}
