/**
 * Deployment data models
 * For tracking deployment status in D1
 */

/**
 * Deployment status enum
 */
export type DeploymentStatus = 'rendering' | 'uploading' | 'ready' | 'deployed' | 'failed'

/**
 * Deployment record stored in D1
 */
export interface DeploymentRecord {
  id: string // UUID v4
  release_id: string // Link to release
  user_uuid: string // Owner
  status: DeploymentStatus // Current status
  r2_path: string | null // Path in R2 bucket (e.g., "{userUUID}/v1/")
  manifest_url: string | null // URL to manifest.json
  error_message: string | null // Error details if failed
  started_at: string // ISO 8601 timestamp
  completed_at: string | null // ISO 8601 timestamp when finished
}

/**
 * Deployment creation input
 */
export interface CreateDeploymentInput {
  release_id: string
  user_uuid: string
}

/**
 * Manifest file structure (what gets uploaded to R2)
 */
export interface DeploymentManifest {
  version: string // Schema version
  release_id: string
  user_uuid: string
  generated_at: string // ISO 8601 timestamp
  files: {
    name: string // Filename
    type: 'container' | 'volume' | 'network' | 'config' | 'env' // File type
    checksum: string // SHA-256 checksum
    size: number // File size in bytes
  }[]
  required_secrets: string[] // List of secret names needed
}
