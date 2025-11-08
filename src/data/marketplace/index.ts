/**
 * Marketplace data loaders
 * Provides access to the pre-bundled marketplace service definitions
 */

import marketplaceBundleRaw from '@/generated/marketplace-services.json';
import type { Service } from '@/types/marketplace';

type MarketplaceBundle = {
  serviceCount: number;
  services: Service[];
};

const marketplaceBundle = marketplaceBundleRaw as MarketplaceBundle;

const servicesById = new Map(
  marketplaceBundle.services.map((service) => [service.id, service])
);

function cloneService(service: Service): Service {
  return JSON.parse(JSON.stringify(service)) as Service;
}

/**
 * Get list of all available service IDs
 */
export function getServiceIds(): string[] {
  return marketplaceBundle.services.map((service) => service.id);
}

/**
 * Load a single service by ID
 */
export async function loadService(serviceId: string): Promise<Service | null> {
  const service = servicesById.get(serviceId);

  if (!service) {
    console.warn(`Service not found: ${serviceId}`);
    return null;
  }

  return cloneService(service);
}

/**
 * Load all services
 */
export async function loadAllServices(): Promise<Service[]> {
  return marketplaceBundle.services.map((service) => cloneService(service));
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

