/**
 * Type definitions for Leger v0.1.0
 * Mirrors backend API models exactly
 */

/**
 * User public profile (safe to return to clients)
 * From api/models/user.ts
 */
export interface UserProfile {
  user_uuid: string;
  email: string;
  display_name: string | null;
  tailnet: string;
  created_at: string;
}

/**
 * Secret metadata (without plaintext value)
 * From api/models/secret.ts
 */
export interface SecretMetadata {
  name: string;
  created_at: string;
  updated_at: string;
  version: number;
}

/**
 * Secret with plaintext value (for CLI sync)
 * From api/models/secret.ts
 */
export interface SecretWithValue {
  name: string;
  value: string; // Decrypted plaintext
  version: number;
  created_at: string;
}

/**
 * Release record stored in D1
 * From api/models/release.ts
 */
export interface ReleaseRecord {
  id: string; // UUID v4
  user_uuid: string; // Owner
  name: string; // User-chosen name (e.g., "my-app-prod")
  version: number; // Auto-increment per user (1, 2, 3...)
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // Last modification time
}

/**
 * Release creation input
 * From api/models/release.ts
 */
export interface CreateReleaseInput {
  name: string;
}

/**
 * Release update input
 * From api/models/release.ts
 */
export interface UpdateReleaseInput {
  name?: string;
}

/**
 * API response wrapper
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    action?: string;
    docs?: string;
  };
}

/**
 * Session type for atomic JWT storage
 */
export interface Session {
  jwt: string;
  user: UserProfile;
  expiresAt: string;
}

/**
 * Auth validation response
 */
export interface AuthResponse {
  user: UserProfile;
  token: string;
}

/**
 * Secrets list response
 */
export interface SecretsListResponse {
  secrets: SecretWithValue[];
}

/**
 * Releases list response
 */
export interface ReleasesListResponse {
  releases: ReleaseRecord[];
}

/**
 * Configuration data (v0.2.0+)
 * User configuration in schema.json format
 */
export interface ConfigData {
  infrastructure?: {
    network?: {
      name: string;
      subnet: string;
      [key: string]: unknown;
    };
    services?: {
      [serviceName: string]: {
        container_name: string;
        [key: string]: unknown;
      };
    };
  };
  features?: {
    [feature: string]: boolean;
  };
  providers?: {
    [providerType: string]: string;
  };
  provider_config?: {
    [key: string]: unknown;
  };
  secrets?: {
    [key: string]: string;
  };
  models?: {
    cloud?: string[];
    local?: string[];
  };
  litellm?: {
    database_url?: string;
    drop_params?: boolean;
  };
  local_inference?: {
    groups?: Record<string, unknown>;
    defaults?: Record<string, unknown>;
  };
  tailscale?: {
    full_hostname: string;
    hostname: string;
    tailnet: string;
  };
}

/**
 * Configuration record
 * From api/models/configuration.ts
 */
export interface ConfigurationRecord {
  id: string;
  user_uuid: string;
  release_id: string | null;
  config_data: string; // JSON string
  schema_version: string;
  version: number;
  created_at: string;
}

/**
 * Deployment status
 * From api/models/deployment.ts
 */
export type DeploymentStatus = 'rendering' | 'uploading' | 'ready' | 'deployed' | 'failed';

/**
 * Deployment record
 * From api/models/deployment.ts
 */
export interface DeploymentRecord {
  id: string;
  release_id: string;
  user_uuid: string;
  status: DeploymentStatus;
  r2_path: string | null;
  manifest_url: string | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

/**
 * Deployment status response
 * From api/services/deployment-orchestrator.ts
 */
export interface DeploymentStatusResponse {
  deployment: DeploymentRecord | null;
  hasConfiguration: boolean;
}

/**
 * App mode (legacy - for future form/raw editor toggle)
 */
export type AppMode = 'form' | 'raw';

/**
 * Validation error (legacy - for form validation)
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Import result (legacy - for file import functionality)
 */
export interface ImportResult {
  success: boolean;
  data?: ConfigData;
  errors?: ValidationError[];
}

/**
 * Environment variable (legacy - for .env editor)
 */
export interface EnvVariable {
  key: string;
  value: string;
  comment?: string;
}

/**
 * Storage configuration (legacy)
 */
export interface StorageConfig {
  key: string;
  value: ConfigData | string;
  timestamp: number;
  version: string;
}

/**
 * Storage history (legacy)
 */
export interface StorageHistory {
  configs: StorageConfig[];
  maxSize: number;
}

/**
 * Auto-save options (legacy)
 */
export interface AutoSaveOptions {
  debounce?: number;
  debounceMs?: number;
  enabled?: boolean;
  maxHistorySize?: number;
}
