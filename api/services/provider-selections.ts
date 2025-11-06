/**
 * Provider selection service
 * Tracks which secret is selected for each provider
 */

import type { Env } from '../middleware/auth'

export interface ProviderSelections {
  [providerId: string]: string
}

const getSelectionsKey = (userUuid: string) => `provider-selections:${userUuid}`

/**
 * Get selected secret name for a provider
 */
export async function getSelectedSecret(
  env: Env,
  userUuid: string,
  providerId: string
): Promise<string | null> {
  const kvKey = getSelectionsKey(userUuid)
  const record = await env.LEGER_SECRETS.get(kvKey, 'json')

  if (!record) {
    return null
  }

  const selections = record as ProviderSelections
  return selections[providerId] || null
}

/**
 * Set selected secret for a provider
 */
export async function setSelectedSecret(
  env: Env,
  userUuid: string,
  providerId: string,
  secretName: string
): Promise<void> {
  const kvKey = getSelectionsKey(userUuid)
  const record = await env.LEGER_SECRETS.get(kvKey, 'json')

  const selections: ProviderSelections = (record as ProviderSelections) || {}
  selections[providerId] = secretName

  await env.LEGER_SECRETS.put(kvKey, JSON.stringify(selections))
}

/**
 * Get all selections for user
 */
export async function getAllSelections(
  env: Env,
  userUuid: string
): Promise<ProviderSelections> {
  const kvKey = getSelectionsKey(userUuid)
  const record = await env.LEGER_SECRETS.get(kvKey, 'json')
  return (record as ProviderSelections) || {}
}
