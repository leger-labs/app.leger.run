/**
 * R2 Storage service
 * Handles uploading rendered files to Cloudflare R2 bucket
 */

import type { Env } from '../middleware/auth'
import type { RenderedFile } from './template-renderer'
import type { DeploymentManifest } from '../models/deployment'
import { calculateChecksum, extractQuadletMetadata } from './template-renderer'

/**
 * CLI-compatible manifest format
 * This is what the Leger CLI expects when pulling deployments
 */
interface CLIManifest {
  version: number // Manifest schema version (use 1)
  created_at: string // ISO 8601 timestamp
  user_uuid: string // User's UUID
  services: CLIServiceDefinition[]
  volumes?: CLIVolumeDefinition[]
}

interface CLIServiceDefinition {
  name: string // Service name (e.g., "nginx")
  quadlet_file: string // Filename (e.g., "nginx.container")
  checksum: string // SHA-256 checksum of quadlet file
  image?: string // Container image (e.g., "nginx:latest")
  ports?: string[] // Port mappings (e.g., ["8080:80"])
  secrets_required?: string[] // Secret names referenced in quadlet
}

interface CLIVolumeDefinition {
  name: string // Volume name
  mount_path?: string // Optional mount path
}

/**
 * R2 path structure: {userUUID}/v{version}/
 */
export function generateR2Path(userUuid: string, version: number): string {
  return `${userUuid}/v${version}/`
}

/**
 * Generate static.leger.run URL for a file
 */
export function generatePublicUrl(userUuid: string, version: number, filename: string): string {
  return `https://static.leger.run/${userUuid}/v${version}/${filename}`
}

/**
 * Generate manifest URL
 */
export function generateManifestUrl(userUuid: string, version: number): string {
  return generatePublicUrl(userUuid, version, 'manifest.json')
}

/**
 * Upload a single file to R2
 */
async function uploadFileToR2(
  env: Env,
  path: string,
  filename: string,
  content: string,
  contentType: string = 'text/plain'
): Promise<void> {
  const fullPath = `${path}${filename}`

  try {
    await env.LEGER_STATIC.put(fullPath, content, {
      httpMetadata: {
        contentType,
      },
    })

    console.log(`✅ Uploaded: ${fullPath}`)
  } catch (error) {
    console.error(`❌ Failed to upload ${fullPath}:`, error)
    throw new Error(`Failed to upload ${filename} to R2: ${error}`)
  }
}

/**
 * Generate CLI-compatible deployment manifest
 */
async function generateCLIManifest(
  userUuid: string,
  files: RenderedFile[]
): Promise<CLIManifest> {
  const services: CLIServiceDefinition[] = []
  const volumes: CLIVolumeDefinition[] = []
  const allSecretsRequired = new Set<string>()

  // Process each file
  for (const file of files) {
    const checksum = await calculateChecksum(file.content)

    // Container files become services
    if (file.type === 'container') {
      const metadata = extractQuadletMetadata(file.content, file.name)
      const serviceName = file.name.replace('.container', '')

      services.push({
        name: serviceName,
        quadlet_file: file.name,
        checksum: `sha256:${checksum}`,
        image: metadata.image,
        ports: metadata.ports && metadata.ports.length > 0 ? metadata.ports : undefined,
        secrets_required: metadata.secrets && metadata.secrets.length > 0 ? metadata.secrets : undefined
      })

      // Collect secrets
      if (metadata.secrets) {
        metadata.secrets.forEach(s => allSecretsRequired.add(s))
      }
    }

    // Volume files
    else if (file.type === 'volume') {
      const volumeName = file.name.replace('.volume', '')
      volumes.push({
        name: volumeName
      })
    }
  }

  const manifest: CLIManifest = {
    version: 1,
    created_at: new Date().toISOString(),
    user_uuid: userUuid,
    services,
    volumes: volumes.length > 0 ? volumes : undefined
  }

  return manifest
}

/**
 * Generate internal deployment manifest (for tracking in D1)
 */
async function generateDeploymentManifest(
  releaseId: string,
  userUuid: string,
  schemaVersion: string,
  files: RenderedFile[]
): Promise<DeploymentManifest> {
  const manifest: DeploymentManifest = {
    version: schemaVersion,
    release_id: releaseId,
    user_uuid: userUuid,
    generated_at: new Date().toISOString(),
    files: [],
    required_secrets: [],
  }

  const allSecretsRequired = new Set<string>()

  // Process each file
  for (const file of files) {
    const checksum = await calculateChecksum(file.content)
    const size = new TextEncoder().encode(file.content).length

    manifest.files.push({
      name: file.name,
      type: file.type,
      checksum,
      size,
    })

    // Extract secrets from container files
    if (file.type === 'container') {
      const metadata = extractQuadletMetadata(file.content, file.name)
      if (metadata.secrets) {
        metadata.secrets.forEach(s => allSecretsRequired.add(s))
      }
    }
  }

  manifest.required_secrets = Array.from(allSecretsRequired)

  return manifest
}

/**
 * Upload all rendered files to R2
 *
 * IMPORTANT: Files are uploaded in a specific order to ensure atomic deployments:
 * 1. All quadlet files (.container, .volume, .network, etc.)
 * 2. Environment files (.env)
 * 3. Manifest.json LAST (signals deployment is complete)
 */
export async function uploadToR2(
  env: Env,
  userUuid: string,
  releaseId: string,
  version: number,
  schemaVersion: string,
  files: RenderedFile[]
): Promise<{ r2Path: string; manifestUrl: string }> {
  if (files.length === 0) {
    throw new Error('No files to upload')
  }

  const r2Path = generateR2Path(userUuid, version)

  console.log(`📤 Uploading ${files.length} files to R2: ${r2Path}`)
  console.log(`   Target path: ${r2Path}`)

  // Separate files by type for ordered upload
  const quadletFiles = files.filter(f =>
    f.type === 'container' || f.type === 'volume' || f.type === 'network' || f.type === 'config'
  )
  const envFiles = files.filter(f => f.type === 'env')

  // Step 1: Upload all quadlet files first
  console.log(`   Uploading ${quadletFiles.length} quadlet files...`)
  for (const file of quadletFiles) {
    await uploadFileToR2(env, r2Path, file.name, file.content, 'text/plain')
  }

  // Step 2: Upload environment files
  if (envFiles.length > 0) {
    console.log(`   Uploading ${envFiles.length} environment files...`)
    for (const file of envFiles) {
      await uploadFileToR2(env, r2Path, file.name, file.content, 'text/plain')
    }
  }

  // Step 3: Generate CLI-compatible manifest
  console.log(`   Generating manifest...`)
  const cliManifest = await generateCLIManifest(userUuid, files)

  // Step 4: Upload manifest LAST (atomic deployment signal)
  const manifestContent = JSON.stringify(cliManifest, null, 2)
  await uploadFileToR2(env, r2Path, 'manifest.json', manifestContent, 'application/json')

  const manifestUrl = generateManifestUrl(userUuid, version)

  console.log(`✅ Upload complete: ${manifestUrl}`)
  console.log(`   Services: ${cliManifest.services.length}`)
  console.log(`   Volumes: ${cliManifest.volumes?.length || 0}`)

  return {
    r2Path,
    manifestUrl,
  }
}

/**
 * Delete all files in a deployment version
 */
export async function deleteDeploymentFromR2(
  env: Env,
  userUuid: string,
  version: number
): Promise<void> {
  const r2Path = generateR2Path(userUuid, version)

  console.log(`🗑️  Deleting deployment from R2: ${r2Path}`)

  // List all objects with this prefix
  const listed = await env.LEGER_STATIC.list({ prefix: r2Path })

  // Delete each object
  for (const object of listed.objects) {
    await env.LEGER_STATIC.delete(object.key)
    console.log(`  ✅ Deleted: ${object.key}`)
  }

  console.log(`✅ Deletion complete: ${r2Path}`)
}

/**
 * Check if a deployment exists in R2
 */
export async function deploymentExistsInR2(
  env: Env,
  userUuid: string,
  version: number
): Promise<boolean> {
  const manifestPath = `${generateR2Path(userUuid, version)}manifest.json`

  try {
    const object = await env.LEGER_STATIC.head(manifestPath)
    return object !== null
  } catch {
    return false
  }
}

/**
 * Get deployment manifest from R2
 */
export async function getDeploymentManifest(
  env: Env,
  userUuid: string,
  version: number
): Promise<DeploymentManifest | null> {
  const manifestPath = `${generateR2Path(userUuid, version)}manifest.json`

  try {
    const object = await env.LEGER_STATIC.get(manifestPath)

    if (!object) {
      return null
    }

    const content = await object.text()
    return JSON.parse(content) as DeploymentManifest
  } catch (error) {
    console.error(`Failed to get manifest from R2:`, error)
    return null
  }
}
