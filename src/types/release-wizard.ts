/**
 * Type definitions for Release Wizard
 * Used for the 4-step configuration wizard
 */

/**
 * Model definition from JSON files
 */
export interface ModelDefinition {
  id: string;
  name: string;
  maker: string;
  providers: Array<{
    id: string;
    litellm_model_name?: string;
    model_uri?: string;
    is_default: boolean;
  }>;
  icon?: string;
  description: string;
  capabilities: string[];
  context_window: number;
  enabled: boolean;
  // Cloud models
  pricing?: {
    input_per_1m: string;
    output_per_1m: string;
    tier: string;
  };
  // Local models
  quantization?: string;
  ram_required_gb?: number;
  group?: string;
  family?: string;
}

/**
 * Provider definition from JSON files
 */
export interface ProviderDefinition {
  id: string;
  name: string;
  requires_api_key: boolean;
  logo?: string;
  description?: string;
}

/**
 * Marketplace service definition from JSON files
 */
export interface MarketplaceService {
  id: string;
  name: string;
  category: string; // e.g., "rag", "web-search", "stt", "tts", "image-generation", "code-execution"
  requires_api_key: boolean;
  logo?: string;
  description?: string;
  activation_condition?: {
    type: 'provider_selected';
    provider_path: string; // e.g., "providers.vector_db"
    exclude_values: string[]; // e.g., [""]
  };
  openwebui_variables: Array<{
    name: string;
    type: string;
    default: string | number | boolean | null;
    description: string;
    options: string[];
  }>;
}

/**
 * Step 1: Model Selection
 */
export interface ModelSelection {
  selected: Array<{
    model_id: string;
    provider: string;
    type: 'cloud' | 'local';
  }>;
}

/**
 * Step 2: Service Selection
 * One provider per feature type
 */
export interface ServiceSelection {
  rag: string | null;
  'web-search': string | null;
  stt: string | null;
  tts: string | null;
  'image-generation': string | null;
  'code-execution': string | null;
  [key: string]: string | null; // Allow for dynamic feature types
}

/**
 * Step 3: OpenWebUI Configuration
 * Environment variables for OpenWebUI
 */
export interface OpenWebUIConfig {
  // General
  WEBUI_NAME?: string;
  DEFAULT_LOCALE?: string;
  CUSTOM_NAME?: string;

  // RAG (only if rag service selected)
  RAG_TOP_K?: number;
  CHUNK_SIZE?: number;
  CHUNK_OVERLAP?: number;
  RAG_EMBEDDING_MODEL?: string;

  // Search (only if search service selected)
  WEB_LOADER_ENGINE?: string;
  TASK_MODEL_SEARCH_QUERY?: string;

  // Task models
  TASK_MODEL?: string;
  TASK_MODEL_TAGS?: string;
  TASK_MODEL_AUTOCOMPLETE?: string;

  // Advanced
  LOG_LEVEL?: string;
  REDIS_KEY_PREFIX?: string;
  OPENWEBUI_TIMEOUT_START?: number;

  // Allow for dynamic variables based on selected services
  [key: string]: string | number | boolean | undefined;
}

/**
 * Step 4: Caddy Routes
 */
export interface CaddyRoute {
  service: string;
  subdomain: string;
  port: number;
  enabled: boolean;
  websocket: boolean;
}

export interface CaddyConfig {
  routes: CaddyRoute[];
}

/**
 * Complete crystallized configuration
 * Output of the wizard, ready for deployment
 */
export interface CrystallizedConfig {
  models: ModelSelection;
  services: ServiceSelection;
  openwebui: OpenWebUIConfig;
  caddy: CaddyConfig;
}

/**
 * Field definition for OpenWebUI config step
 */
export interface ConfigField {
  name: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'model-selector';
  default?: string | number | boolean;
  label?: string;
  description?: string;
  options?: string[];
  filter?: string; // For model-selector: 'embeddings', 'ultra-lightweight', 'lightweight'
  min?: number;
  max?: number;
  required?: boolean;
}

/**
 * Field group for OpenWebUI config step
 */
export interface ConfigFieldGroup {
  id: string;
  label: string;
  description?: string;
  fields: ConfigField[];
  collapsible: boolean;
  defaultExpanded: boolean;
}
