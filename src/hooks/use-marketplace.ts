/**
 * React hook for accessing marketplace services
 */

import { useState, useEffect } from 'react';
import { marketplaceService } from '@/services/marketplace-service';
import type { Service, ServiceFilters } from '@/types/marketplace';
import { filterServices } from '@/services/marketplace-service';

/**
 * Hook to load and access all marketplace services
 */
export function useMarketplace() {
  const [isLoading, setIsLoading] = useState(!marketplaceService.isLoaded());
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    async function loadData() {
      if (marketplaceService.isLoaded()) {
        // Data already loaded, use cached data
        setServices(marketplaceService.getServices());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await marketplaceService.load();
        setServices(marketplaceService.getServices());
      } catch (error) {
        console.error('Failed to load marketplace data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  return {
    isLoading,
    services,
    getService: (id: string) => marketplaceService.getService(id),
    getServicesByCategory: (category: string) =>
      marketplaceService.getServicesByCategory(category),
    getCategories: () => marketplaceService.getCategories(),
  };
}

/**
 * Hook to get filtered services
 */
export function useFilteredServices(filters: ServiceFilters) {
  const { services, isLoading } = useMarketplace();
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);

  useEffect(() => {
    if (!isLoading) {
      const filtered = filterServices(services, filters);
      setFilteredServices(filtered);
    }
  }, [services, filters, isLoading]);

  return {
    services: filteredServices,
    isLoading,
  };
}

/**
 * Hook to get a specific service by ID
 */
export function useService(serviceId: string | undefined) {
  const { getService, isLoading } = useMarketplace();
  const [service, setService] = useState<Service | undefined>(undefined);

  useEffect(() => {
    if (!isLoading && serviceId) {
      const s = getService(serviceId);
      setService(s);
    }
  }, [serviceId, isLoading, getService]);

  return {
    service,
    isLoading,
  };
}
