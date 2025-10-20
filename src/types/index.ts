/**
 * Type definitions for Leger v0.1.0
 * Mirrors backend API models
 */

/**
 * User profile (returned from API)
 */
export interface User {
  user_uuid: string;
  email: string;
  display_name: string | null;
  tailnet: string;
  created_at: string;
}

/**
 * Secret metadata (without value)
 */
export interface SecretMetadata {
  name: string;
  created_at: string;
  updated_at: string;
  version: number;
}

/**
 * Secret with plaintext value
 */
export interface SecretWithValue extends SecretMetadata {
  value: string;
}

/**
 * Release record
 */
export interface Release {
  id: string;
  user_uuid: string;
  name: string;
  git_url: string;
  git_branch: string;
  description: string | null;
  version: number;
  created_at: string;
  updated_at: string;
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
    action: string;
  };
}

/**
 * Auth validation response
 */
export interface AuthResponse {
  user: User;
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
  releases: Release[];
}
