/**
 * Type definitions for core schema and release catalog data structures
 * Based on the JSON schemas from the schemas repository
 */

/**
 * Tailscale MagicDNS configuration
 */
export interface TailscaleConfig {
  full_hostname: string;
  hostname?: string;
  tailnet?: string;
}

/**
 * Infrastructure configuration
 */
export interface InfrastructureConfig {
  [key: string]: any;
}

/**
 * Features configuration
 */
export interface FeaturesConfig {
  [key: string]: any;
}

/**
 * Providers configuration
 */
export interface ProvidersConfig {
  [key: string]: any;
}

/**
 * Leger infrastructure configuration schema
 */
export interface LegerConfig {
  tailscale: TailscaleConfig;
  infrastructure: InfrastructureConfig;
  features: FeaturesConfig;
  providers: ProvidersConfig;
  [key: string]: any;
}

/**
 * JSON Schema definition
 */
export interface JSONSchema {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  schema_version?: string;
  type?: string | string[];
  required?: string[];
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  enum?: any[];
  const?: any;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  format?: string;
  default?: any;
  examples?: any[];
  'x-category'?: string;
  'x-display-order'?: number;
  'x-readonly'?: boolean;
  [key: string]: any;
}

/**
 * Release catalog entry
 */
export interface ReleaseCatalogEntry {
  version: string;
  release_date: string;
  schema_url: string;
  notes?: string;
  breaking_changes?: string[];
  deprecated?: string[];
}

/**
 * Release catalog structure
 */
export interface ReleaseCatalog {
  current_version: string;
  releases: ReleaseCatalogEntry[];
}

/**
 * Schema metadata
 */
export interface SchemaMetadata {
  version: string;
  schema: JSONSchema;
  uiSchema?: Record<string, any>;
  generated_at?: string;
}
