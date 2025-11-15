/**
 * Default Configuration Barrel Export
 *
 * Centralized exports for all default configurations.
 *
 * IMPORTANT: These are INFRASTRUCTURE defaults only.
 * - RAG settings, timeouts, log levels, etc.
 * - Service URLs (auto-generated from infrastructure)
 *
 * NO model selections or provider API choices are hardcoded here.
 * Users must select models/providers through the WebUI.
 *
 * Usage:
 *   import { DEFAULT_PROVIDER_CONFIGS } from '../config/defaults'
 */

// Re-export provider configs (infrastructure only)
export {
  DEFAULT_PROVIDER_CONFIGS,
  ALTERNATIVE_CONFIGS,
  getProviderConfig,
  validateProviderConfig,
  type ProviderConfig,
} from './default-provider-configs'
