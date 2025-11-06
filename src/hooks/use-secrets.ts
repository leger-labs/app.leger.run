/**
 * Secrets management hook
 * Handles CRUD operations for secrets with loading states
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { SecretWithValue } from '@/types';

export function useSecrets() {
  const [secrets, setSecrets] = useState<SecretWithValue[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSecrets = async () => {
    try {
      setIsLoading(true);
      const [secretsResponse, selectionsResponse] = await Promise.all([
        apiClient.listSecrets(true),
        apiClient.getProviderSelections(),
      ]);
      setSecrets(secretsResponse.secrets);
      setSelections(selectionsResponse);
    } catch (error) {
      // Error already toasted by API client
      console.error('Failed to fetch secrets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecrets();
  }, []);

  const upsertSecret = async (
    name: string,
    value: string,
    label?: string
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      await apiClient.upsertSecret(name, value, label);
      toast.success('API key saved');
      await fetchSecrets();
      return true;
    } catch (error) {
      console.error('Failed to save secret:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSecret = async (name: string): Promise<boolean> => {
    setIsDeleting(true);
    try {
      await apiClient.deleteSecret(name);
      toast.success('API key deleted');
      await fetchSecrets();
      return true;
    } catch (error) {
      console.error('Failed to delete secret:', error);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const setProviderSelection = async (
    providerId: string,
    secretName: string
  ): Promise<boolean> => {
    try {
      await apiClient.setProviderSelection(providerId, secretName);
      setSelections((prev) => ({ ...prev, [providerId]: secretName }));
      toast.success('Default key updated');
      return true;
    } catch (error) {
      console.error('Failed to set selection:', error);
      return false;
    }
  };

  return {
    secrets,
    selections,
    isLoading,
    isSaving,
    isDeleting,
    upsertSecret,
    deleteSecret,
    setProviderSelection,
    refetch: fetchSecrets,
  };
}
