/**
 * Marketplace data loaders
 * Lazy-loads service definitions from JSON files
 */

import type { Service } from '@/types/marketplace';

/**
 * Import all service JSON files using Vite's glob import
 */
const serviceFiles = import.meta.glob<Service>('./*.json', {
  import: 'default',
});

/**
 * Get list of all available service IDs
 */
export function getServiceIds(): string[] {
  return Object.keys(serviceFiles).map((path) => {
    // Extract filename without path and extension
    // "./azure-openai.json" -> "azure-openai"
    return path.replace('./', '').replace('.json', '');
  });
}

/**
 * Load a single service by ID
 */
export async function loadService(serviceId: string): Promise<Service | null> {
  const path = `./${serviceId}.json`;
  const loader = serviceFiles[path];

  if (!loader) {
    console.warn(`Service not found: ${serviceId}`);
    return null;
  }

  try {
    return await loader();
  } catch (error) {
    console.error(`Failed to load service ${serviceId}:`, error);
    return null;
  }
}

/**
 * Load all services
 */
export async function loadAllServices(): Promise<Service[]> {
  const services: Service[] = [];

  for (const [path, loader] of Object.entries(serviceFiles)) {
    try {
      const service = await loader();
      services.push(service);
    } catch (error) {
      console.error(`Failed to load service from ${path}:`, error);
    }
  }

  return services;
}

/**
 * Load services by category
 */
export async function loadServicesByCategory(
  category: string
): Promise<Service[]> {
  const allServices = await loadAllServices();
  return allServices.filter((service) => service.category === category);
}

