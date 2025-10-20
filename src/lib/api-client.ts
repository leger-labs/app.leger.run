/**
 * API Client for Leger backend
 * Handles authentication, error handling, and API communication
 */

import { toast } from 'sonner';
import type {
  SecretMetadata,
  SecretWithValue,
  Release,
  APIResponse,
  AuthResponse,
  SecretsListResponse,
  ReleasesListResponse,
} from '@/types';

class APIClient {
  private baseURL = '/api';

  /**
   * Get request headers with JWT authentication
   */
  private getHeaders(): HeadersInit {
    const jwt = localStorage.getItem('jwt');
    return {
      'Content-Type': 'application/json',
      ...(jwt && { Authorization: `Bearer ${jwt}` }),
    };
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options?.headers,
        },
      });

      const data: APIResponse<T> = await response.json();

      // Handle errors
      if (!data.success) {
        // Special handling for 401 - clear session and redirect
        if (response.status === 401) {
          localStorage.removeItem('jwt');
          localStorage.removeItem('user');
          window.location.href = '/auth?token=expired';
          throw new Error('Authentication expired');
        }

        // Show error toast
        if (data.error) {
          toast.error(data.error.message, {
            description: data.error.action,
          });
        }

        throw new Error(data.error?.message || 'Request failed');
      }

      return data.data as T;
    } catch (error) {
      // If it's already been handled, rethrow
      if (error instanceof Error && error.message === 'Authentication expired') {
        throw error;
      }

      // Network errors or other unexpected issues
      if (error instanceof TypeError) {
        toast.error('Network error', {
          description: 'Unable to connect to the server. Please check your connection.',
        });
      }

      throw error;
    }
  }

  /**
   * Validate JWT token
   */
  async validateAuth(token: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/validate', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  /**
   * List all secrets for the current user
   */
  async listSecrets(includeValues = false): Promise<SecretsListResponse> {
    const query = includeValues ? '?include_values=true' : '';
    return this.request<SecretsListResponse>(`/secrets${query}`);
  }

  /**
   * Get a specific secret by name
   */
  async getSecret(name: string): Promise<SecretWithValue> {
    return this.request<SecretWithValue>(`/secrets/${name}`);
  }

  /**
   * Create or update a secret
   */
  async upsertSecret(name: string, value: string): Promise<SecretMetadata> {
    return this.request<SecretMetadata>(`/secrets/${name}`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  }

  /**
   * Delete a secret
   */
  async deleteSecret(name: string): Promise<void> {
    await this.request<void>(`/secrets/${name}`, {
      method: 'DELETE',
    });
  }

  /**
   * List all releases for the current user
   */
  async listReleases(): Promise<ReleasesListResponse> {
    return this.request<ReleasesListResponse>('/releases');
  }

  /**
   * Get a specific release by ID
   */
  async getRelease(id: string): Promise<Release> {
    return this.request<Release>(`/releases/${id}`);
  }

  /**
   * Create a new release
   */
  async createRelease(data: {
    name: string;
    git_url: string;
    git_branch?: string;
    description?: string;
  }): Promise<Release> {
    return this.request<Release>('/releases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing release
   */
  async updateRelease(
    id: string,
    data: {
      name?: string;
      git_url?: string;
      git_branch?: string;
      description?: string;
    }
  ): Promise<Release> {
    return this.request<Release>(`/releases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a release
   */
  async deleteRelease(id: string): Promise<void> {
    await this.request<void>(`/releases/${id}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();
