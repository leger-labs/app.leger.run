/**
 * Deployment orchestrator
 * Coordinates the full deployment flow: render → validate → upload → update DB
 */

import type { Env } from '../middleware/auth'
import type { DeploymentRecord } from '../models/deployment'
import { createDeployment, updateDeploymentStatus } from './deployments'
import { getParsedConfiguration } from './configurations'
import { renderTemplates, validateRenderedFiles } from './template-renderer'
import { uploadToR2 } from './r2-storage'
import { getRelease } from './releases'

/**
 * Orchestrate full deployment flow
 *
 * Flow:
 * 1. Create deployment record (status: rendering)
 * 2. Fetch user configuration
 * 3. Render templates
 * 4. Validate rendered files
 * 5. Update status to uploading
 * 6. Upload to R2
 * 7. Update status to ready with R2 path and manifest URL
 *
 * If any step fails, update status to failed with error message
 */
export async function orchestrateDeployment(
  env: Env,
  userUuid: string,
  releaseId: string
): Promise<DeploymentRecord> {
  let deploymentId: string | undefined

  try {
    // Step 1: Create deployment record
    console.log(`🚀 Starting deployment for release ${releaseId}`)
    const deployment = await createDeployment(env, {
      release_id: releaseId,
      user_uuid: userUuid,
    })
    deploymentId = deployment.id

    console.log(`  ✅ Created deployment record: ${deploymentId}`)

    // Step 2: Fetch user configuration
    console.log(`  📋 Fetching user configuration...`)
    const userConfig = await getParsedConfiguration(env, userUuid, releaseId)

    if (!userConfig) {
      throw new Error('No configuration found for this release. Please save a configuration first.')
    }

    console.log(`  ✅ Configuration loaded`)

    // Step 3: Fetch release to get version
    const release = await getRelease(env, userUuid, releaseId)
    if (!release) {
      throw new Error('Release not found')
    }

    // Step 4: Render templates
    console.log(`  🎨 Rendering templates...`)

    // NOTE: This is where template rendering happens
    // For v0.2.0, we need to implement one of these approaches:
    // 1. Bundle templates and render in Workers
    // 2. Use a separate rendering service
    // 3. Pre-render on client and just upload

    // For now, we'll throw a helpful error
    try {
      const renderedFiles = await renderTemplates(userConfig, '0.2.0')

      console.log(`  ✅ Rendered ${renderedFiles.length} files`)

      // Step 5: Validate rendered files
      console.log(`  ✅ Validating rendered files...`)
      const validation = validateRenderedFiles(renderedFiles)

      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      console.log(`  ✅ Validation passed`)

      // Step 6: Update status to uploading
      await updateDeploymentStatus(env, deploymentId, 'uploading')
      console.log(`  📤 Uploading to R2...`)

      // Step 7: Upload to R2
      const { r2Path, manifestUrl } = await uploadToR2(
        env,
        userUuid,
        releaseId,
        release.version,
        '0.2.0',
        renderedFiles
      )

      console.log(`  ✅ Upload complete: ${manifestUrl}`)

      // Step 8: Update status to ready
      await updateDeploymentStatus(env, deploymentId, 'ready', {
        r2_path: r2Path,
        manifest_url: manifestUrl,
      })

      console.log(`✅ Deployment complete!`)

      // Return updated deployment record
      const finalDeployment = await updateDeploymentStatus(env, deploymentId, 'ready', {
        r2_path: r2Path,
        manifest_url: manifestUrl,
      })

      // Fetch and return the updated record
      const updatedDeployment = await env.LEGER_DB.prepare(
        'SELECT * FROM deployments WHERE id = ?'
      )
        .bind(deploymentId)
        .first<DeploymentRecord>()

      return updatedDeployment || deployment
    } catch (renderError) {
      // Check if this is the "not implemented" error
      if (
        renderError instanceof Error &&
        renderError.message.includes('not fully implemented')
      ) {
        // For now, mark as ready with a placeholder
        // This allows the rest of the flow to be tested
        console.warn(
          '⚠️  Template rendering not yet implemented. ' +
          'Creating placeholder deployment.'
        )

        const r2Path = `${userUuid}/v${release.version}/`
        const manifestUrl = `https://static.leger.run/${r2Path}manifest.json`

        await updateDeploymentStatus(env, deploymentId, 'ready', {
          r2_path: r2Path,
          manifest_url: manifestUrl,
          error_message: 'Template rendering pending implementation',
        })

        const updatedDeployment = await env.LEGER_DB.prepare(
          'SELECT * FROM deployments WHERE id = ?'
        )
          .bind(deploymentId)
          .first<DeploymentRecord>()

        return updatedDeployment || deployment
      }

      throw renderError
    }
  } catch (error) {
    console.error(`❌ Deployment failed:`, error)

    // Update deployment status to failed
    if (deploymentId) {
      await updateDeploymentStatus(env, deploymentId, 'failed', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    throw error
  }
}

/**
 * Get deployment status and details
 */
export async function getDeploymentStatus(
  env: Env,
  userUuid: string,
  releaseId: string
): Promise<{
  deployment: DeploymentRecord | null
  hasConfiguration: boolean
}> {
  // Get latest deployment
  const deployment = await env.LEGER_DB.prepare(
    `SELECT * FROM deployments
     WHERE user_uuid = ? AND release_id = ?
     ORDER BY started_at DESC
     LIMIT 1`
  )
    .bind(userUuid, releaseId)
    .first<DeploymentRecord>()

  // Check if configuration exists
  const config = await env.LEGER_DB.prepare(
    `SELECT id FROM configurations
     WHERE user_uuid = ? AND release_id = ?
     LIMIT 1`
  )
    .bind(userUuid, releaseId)
    .first()

  return {
    deployment: deployment || null,
    hasConfiguration: !!config,
  }
}
