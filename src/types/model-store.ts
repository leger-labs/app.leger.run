/**
 * Type definitions for model-store data structures
 * Based on the JSON schemas and data from the model-store submodule
 */

/**
 * Maker represents a company or organization that creates AI models
 */
export interface Maker {
  id: string;
  name: string;
  icon: string; // path to asset (e.g., "assets/makers/anthropic.svg")
  website: string;
  description: string;
  models?: string[];
}

/**
 * Provider represents a service that provides access to AI models
 */
export interface Provider {
  id: string;
  name: string;
  icon: string; // path to asset (e.g., "assets/providers/anthropic.svg")
  website: string;
  requires_api_key: string | null; // env var name (e.g., "ANTHROPIC_API_KEY") or null for llama-cpp
  api_key_register_url?: string;
  description: string;
  provider_type: 'api' | 'cloud' | 'local';
  models?: ProviderModelDetails[];
}

export interface ProviderModelDetails {
  id: string;
  maker: string;
  context: number | null;
  input_cost_per_million: number | null;
  output_cost_per_million: number | null;
}

/**
 * ModelProvider represents a specific provider's offering of a model
 */
export interface ModelProvider {
  id: string; // provider ID
  litellm_model_name?: string; // for cloud models (e.g., "anthropic/claude-sonnet-4-5-20250929")
  model_uri?: string; // for local models (e.g., "huggingface://...")
  is_default: boolean;
}

/**
 * Pricing information for cloud models
 */
export interface ModelPricing {
  input_per_1m: string; // e.g., "$3.00"
  output_per_1m: string; // e.g., "$15.00"
  cache_read_per_1m?: string;
  cache_write_per_1m?: string;
  tier: string; // e.g., "standard", "premium"
}

/**
 * Base model interface with common properties
 */
export interface BaseModel {
  id: string;
  name: string;
  maker: string; // maker ID (references Maker.id)
  providers: ModelProvider[];
  icon: string; // path to asset (usually same as maker icon)
  description: string;
  capabilities: string[]; // e.g., ["chat", "code", "vision", "tool_calling"]
  context_window: number;
  max_output?: number;
  use_cases?: string[];
  release_date?: string;
  notes?: string;
  features?: string[];
  enabled: boolean;
}

/**
 * Cloud model with pricing information
 */
export interface CloudModel extends BaseModel {
  pricing?: ModelPricing;
}

/**
 * Local model with hardware requirements
 */
export interface LocalModel extends BaseModel {
  quantization: string; // e.g., "Q4_K_M"
  ram_required_gb: number;
  group?: string; // e.g., "task", "reasoning"
  family?: string; // e.g., "qwen", "llama"
  ctx_size?: number;
  ttl?: number;
  hf_repo?: string; // HuggingFace repository
  hf_file?: string; // HuggingFace file name
  vulkan_driver?: string;
  flash_attn?: boolean;
  shortname?: string;
}

/**
 * Union type for all models
 */
export type Model = CloudModel | LocalModel;

/**
 * Type guard to check if a model is a cloud model
 */
export function isCloudModel(model: Model): model is CloudModel {
  return 'pricing' in model;
}

/**
 * Type guard to check if a model is a local model
 */
export function isLocalModel(model: Model): model is LocalModel {
  return 'quantization' in model;
}

/**
 * Model store service state
 */
export interface ModelStoreData {
  makers: Map<string, Maker>;
  providers: Map<string, Provider>;
  models: Map<string, Model>;
  modelsByMaker: Map<string, Model[]>;
  providersByModel: Map<string, Provider[]>;
}

/**
 * Filter options for browsing models
 */
export interface ModelFilters {
  search?: string;
  capability?: string; // e.g., "chat", "code", "vision"
  provider?: string; // provider ID
  type?: 'cloud' | 'local' | 'all';
}
