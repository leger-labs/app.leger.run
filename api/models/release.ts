/**
 * Release data models
 * A release is a named configuration container
 */

/**
 * Release record stored in D1
 */
export interface ReleaseRecord {
  id: string // UUID v4
  user_uuid: string // Owner
  name: string // User-chosen name (e.g., "my-app-prod")
  version: number // Auto-increment per user (1, 2, 3...)
  created_at: string // ISO 8601 timestamp
  updated_at: string // Last modification time
}

/**
 * Release creation input
 */
export interface CreateReleaseInput {
  name: string
}

/**
 * Release update input
 */
export interface UpdateReleaseInput {
  name?: string
}

/**
 * Validate release name
 * Rules: alphanumeric, underscore, hyphen only; 1-64 characters
 */
export function isValidReleaseName(name: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(name)
}
