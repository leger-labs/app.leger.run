/**
 * Marketplace Service
 * Loads and indexes data from the marketplace services
 */

import type {
  Service,
  MarketplaceData,
  ServiceFilters,
} from '@/types/marketplace';
import { loadAllServices } from '@/data/marketplace';

/**
 * Load all services from the marketplace
 */
async function fetchServices(): Promise<Map<string, Service>> {
  const services = new Map<string, Service>();

  // Load services using the data loader
  const serviceList = await loadAllServices();

  console.log(`Loading ${serviceList.length} marketplace services...`);

  // Convert to map
  for (const service of serviceList) {
    services.set(service.id, service);
  }

  console.log(`Loaded ${services.size} marketplace services`);

  return services;
}

/**
 * Index services by category
 */
function indexServicesByCategory(services: Map<string, Service>): Map<string, Service[]> {
  const byCategory = new Map<string, Service[]>();

  for (const service of services.values()) {
    const category = service.category;
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(service);
  }

  return byCategory;
}

/**
 * Filter services based on filter criteria
 */
export function filterServices(services: Service[], filters: ServiceFilters): Service[] {
  let filtered = [...services];

  // Filter by search term
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.id.toLowerCase().includes(searchLower) ||
        s.category.toLowerCase().includes(searchLower)
    );
  }

  // Filter by category
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter((s) => s.category === filters.category);
  }

  // Filter by requires_api_key
  if (filters.requiresApiKey !== undefined) {
    filtered = filtered.filter((s) => s.requires_api_key === filters.requiresApiKey);
  }

  return filtered;
}

/**
 * Marketplace Service Class
 * Singleton service for loading and accessing marketplace data
 */
class MarketplaceService {
  private data: MarketplaceData | null = null;
  private loadPromise: Promise<void> | null = null;

  /**
   * Load all marketplace data
   */
  async load(): Promise<void> {
    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Return immediately if already loaded
    if (this.data) {
      return;
    }

    this.loadPromise = (async () => {
      try {
        const services = await fetchServices();
        const servicesByCategory = indexServicesByCategory(services);

        this.data = {
          services,
          servicesByCategory,
        };
      } catch (error) {
        console.error('Failed to load marketplace data:', error);
        throw error;
      } finally {
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Check if data is loaded
   */
  isLoaded(): boolean {
    return this.data !== null;
  }

  /**
   * Get all services as array
   */
  getServices(): Service[] {
    if (!this.data) return [];
    return Array.from(this.data.services.values());
  }

  /**
   * Get a specific service by ID
   */
  getService(id: string): Service | undefined {
    if (!this.data) return undefined;
    return this.data.services.get(id);
  }

  /**
   * Get services by category
   */
  getServicesByCategory(category: string): Service[] {
    if (!this.data) return [];
    return this.data.servicesByCategory.get(category) || [];
  }

  /**
   * Get all categories with service counts
   */
  getCategories(): Array<{ id: string; count: number }> {
    if (!this.data) return [];

    return Array.from(this.data.servicesByCategory.entries()).map(
      ([id, services]) => ({
        id,
        count: services.length,
      })
    );
  }

  /**
   * Get service count by category
   */
  getCategoryCount(category: string): number {
    if (!this.data) return 0;
    return this.data.servicesByCategory.get(category)?.length || 0;
  }
}

// Export singleton instance
export const marketplaceService = new MarketplaceService();
