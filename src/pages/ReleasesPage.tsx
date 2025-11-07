/**
 * Releases Page
 * List all releases with create and edit actions
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, Search, MoreVertical, Circle, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useReleases } from '@/hooks/use-releases';
import { apiClient } from '@/lib/api-client';
import type { DeploymentStatus } from '@/types';

// Map deployment status to UI elements
const getStatusConfig = (status: DeploymentStatus | null | undefined) => {
  if (!status) {
    return {
      label: 'Not Deployed',
      variant: 'outline' as const,
      icon: Circle,
      className: 'bg-gray-100 text-gray-700 border-gray-300',
    };
  }

  switch (status) {
    case 'deployed':
      return {
        label: 'Deployed',
        variant: 'default' as const,
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-800 border-green-300',
      };
    case 'rendering':
    case 'uploading':
      return {
        label: 'Deploying',
        variant: 'secondary' as const,
        icon: AlertCircle,
        className: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    case 'failed':
      return {
        label: 'Failed',
        variant: 'destructive' as const,
        icon: XCircle,
        className: 'bg-red-100 text-red-800 border-red-300',
      };
    case 'ready':
      return {
        label: 'Ready',
        variant: 'outline' as const,
        icon: CheckCircle2,
        className: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    default:
      return {
        label: 'Unknown',
        variant: 'outline' as const,
        icon: Circle,
        className: 'bg-gray-100 text-gray-700 border-gray-300',
      };
  }
};

export function ReleasesPage() {
  const { releases, isLoading } = useReleases();
  const [searchQuery, setSearchQuery] = useState('');
  const [deploymentStatuses, setDeploymentStatuses] = useState<Record<string, DeploymentStatus | null>>({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);

  // Fetch deployment status for all releases
  useEffect(() => {
    const fetchStatuses = async () => {
      if (releases.length === 0) {
        setLoadingStatuses(false);
        return;
      }

      const statuses: Record<string, DeploymentStatus | null> = {};

      await Promise.all(
        releases.map(async (release) => {
          try {
            const response = await apiClient.getDeploymentStatus(release.id);
            statuses[release.id] = response.deployment?.status || null;
          } catch (error) {
            console.error(`Failed to fetch status for release ${release.id}:`, error);
            statuses[release.id] = null;
          }
        })
      );

      setDeploymentStatuses(statuses);
      setLoadingStatuses(false);
    };

    fetchStatuses();
  }, [releases]);

  // Filter releases based on search query
  const filteredReleases = useMemo(() => {
    if (!searchQuery.trim()) return releases;

    const query = searchQuery.toLowerCase();
    return releases.filter((release) =>
      release.name.toLowerCase().includes(query) ||
      release.version.toString().includes(query)
    );
  }, [releases, searchQuery]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Releases"
        description="Manage your application releases and deployments"
        action={
          <Button asChild>
            <Link to="/releases/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Release
            </Link>
          </Button>
        }
      />

      {releases.length === 0 ? (
        <div className="rounded-lg border bg-card p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No releases yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create your first release to start deploying applications with Leger.
              Releases track your application configurations and git repositories.
            </p>
            <Button asChild>
              <Link to="/releases/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Release
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search releases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Releases list */}
          <div className="rounded-lg border bg-card">
            {filteredReleases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No releases found matching your search.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredReleases.map((release) => {
                  const status = deploymentStatuses[release.id];
                  const statusConfig = getStatusConfig(status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={release.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-muted/50 transition-colors"
                    >
                      {/* Release name and metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-medium truncate">{release.name}</h3>
                          {/* Status badge - mobile */}
                          <div className="sm:hidden flex-shrink-0">
                            {loadingStatuses ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-muted/50">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span className="text-xs font-medium">Loading</span>
                              </div>
                            ) : (
                              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${statusConfig.className}`}>
                                <StatusIcon className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">{statusConfig.label}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          v{release.version} · Updated {new Date(release.updated_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Status badge - desktop */}
                      <div className="hidden sm:flex items-center gap-2">
                        {loadingStatuses ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted/50">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-xs font-medium">Loading...</span>
                          </div>
                        ) : (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${statusConfig.className}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">{statusConfig.label}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="min-h-[44px] sm:min-h-0">
                          <Link to={`/releases/${release.id}`}>View</Link>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-11 w-11 sm:h-8 sm:w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/releases/${release.id}`}>Configure</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>Deploy</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
