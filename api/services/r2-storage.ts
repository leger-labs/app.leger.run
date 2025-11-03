/**
 * R2 Storage service
 * Handles uploading rendered files to Cloudflare R2 bucket
 */

import type { Env } from '../middleware/auth'
import type { RenderedFile } from './template-renderer'
import type { DeploymentManifest } from '../models/deployment'
import { calculateChecksum } from './template-renderer'

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
 * Generate deployment manifest
 */
async function generateManifest(
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
    required_secrets: [], // TODO: Extract from rendered files
  }

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
  }

  return manifest
}

/**
 * Upload all rendered files to R2
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

  // Upload each rendered file
  for (const file of files) {
    // Determine content type based on file type
    let contentType = 'text/plain'
    if (file.type === 'config' && file.name.endsWith('.json')) {
      contentType = 'application/json'
    } else if (file.type === 'config' && file.name.endsWith('.yaml')) {
      contentType = 'application/yaml'
    }

    await uploadFileToR2(env, r2Path, file.name, file.content, contentType)
  }

  // Generate and upload manifest
  const manifest = await generateManifest(releaseId, userUuid, schemaVersion, files)
  const manifestContent = JSON.stringify(manifest, null, 2)
  await uploadFileToR2(env, r2Path, 'manifest.json', manifestContent, 'application/json')

  const manifestUrl = generateManifestUrl(userUuid, version)

  console.log(`✅ Upload complete: ${manifestUrl}`)

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
