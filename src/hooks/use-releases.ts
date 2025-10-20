/**
 * Releases management hook
 * Handles CRUD operations for releases
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Release } from '@/types';

export function useReleases() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReleases = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.listReleases();
      setReleases(response.releases);
    } catch (error) {
      // Error already toasted by API client
      console.error('Failed to fetch releases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const createRelease = async (data: {
    name: string;
    git_url: string;
    git_branch?: string;
    description?: string;
  }): Promise<Release | null> => {
    try {
      const release = await apiClient.createRelease(data);
      toast.success('Release created', {
        description: `${data.name} has been created successfully.`,
      });
      await fetchReleases(); // Refetch to get updated list
      return release;
    } catch (error) {
      // Error already toasted by API client
      console.error('Failed to create release:', error);
      return null;
    }
  };

  const updateRelease = async (
    id: string,
    data: {
      name?: string;
      git_url?: string;
      git_branch?: string;
      description?: string;
    }
  ): Promise<boolean> => {
    try {
      await apiClient.updateRelease(id, data);
      toast.success('Release updated', {
        description: `Release has been updated successfully.`,
      });
      await fetchReleases(); // Refetch to get updated list
      return true;
    } catch (error) {
      // Error already toasted by API client
      console.error('Failed to update release:', error);
      return false;
    }
  };

  const deleteRelease = async (id: string, name: string): Promise<boolean> => {
    try {
      await apiClient.deleteRelease(id);
      toast.success('Release deleted', {
        description: `${name} has been removed.`,
      });
      await fetchReleases(); // Refetch to get updated list
      return true;
    } catch (error) {
      // Error already toasted by API client
      console.error('Failed to delete release:', error);
      return false;
    }
  };

  return {
    releases,
    isLoading,
    createRelease,
    updateRelease,
    deleteRelease,
    refetch: fetchReleases,
  };
}
