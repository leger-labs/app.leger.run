/**
 * Release Form Page
 * Create or edit a release
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Loader2, Copy, Check, Upload, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useReleases } from '@/hooks/use-releases';
import { apiClient } from '@/lib/api-client';
import { CategoryBasedReleaseForm } from '@/components/releases/CategoryBasedReleaseForm';
import { getReleaseSchemaBundle } from '@/lib/schema-loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { DeploymentRecord } from '@/types';

export function ReleaseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createRelease, updateRelease } = useReleases();

  const isNew = !id;
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [configData, setConfigData] = useState<Record<string, unknown>>({});
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [isConfigDirty, setIsConfigDirty] = useState(false);

  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployment, setDeployment] = useState<DeploymentRecord | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

  const releaseSchemaBundle = useMemo(() => getReleaseSchemaBundle(), []);

  // Fetch existing release if editing
  useEffect(() => {
    if (!isNew && id) {
      const fetchRelease = async () => {
        try {
          const release = await apiClient.getRelease(id);
          setFormData({
            name: release.name,
          });
        } catch (error) {
          console.error('Failed to fetch release:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRelease();
    }
  }, [isNew, id]);

  // Validation - matches backend validation rules
  const validateField = (field: string, value: string): string | null => {
    if (field === 'name') {
      if (!value) return 'Name is required';
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return 'Name must contain only letters, numbers, underscores, and hyphens';
      }
      if (value.length > 64) return 'Name must be 64 characters or less';
      return null;
    }
    return null;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error || '' }));
    setIsDirty(true);
  };

  const handleConfigChange = useCallback((data: Record<string, unknown>) => {
    setConfigData(data);
    setIsConfigDirty(true);
  }, []);

  const handleConfigSubmit = useCallback(() => {
    setIsConfigSaving(true);
    try {
      toast.success('Configuration captured', {
        description:
          'Release configuration is stored locally until backend persistence is available.',
      });
      setIsConfigDirty(false);
    } finally {
      setIsConfigSaving(false);
    }
  }, []);

  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string> = {};
    const nameError = validateField('name', formData.name);

    if (nameError) newErrors.name = nameError;

    setErrors(newErrors);

    // Return true if no errors
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateAllFields()) {
      toast.error('Please fix validation errors');
      return;
    }

    setIsSaving(true);

    try {
      if (isNew) {
        const release = await createRelease(formData);
        if (release) {
          navigate('/releases');
        }
      } else if (id) {
        const success = await updateRelease(id, formData);
        if (success) {
          navigate('/releases');
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const copyDeployCommand = () => {
    const command = `leger deploy ${formData.name}`;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Deployment handlers
  const handleDeploy = async () => {
    if (!id) {
      toast.error('Please save the release first before deploying');
      return;
    }

    setIsDeploying(true);
    setDeployError(null);

    try {
      const deploymentRecord = await apiClient.deployRelease(id);
      setDeployment(deploymentRecord);
      toast.success('Deployment started');

      // Start polling for status
      pollDeploymentStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start deployment';
      setDeployError(message);
      setIsDeploying(false);
    }
  };

  const pollDeploymentStatus = async () => {
    if (!id) return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await apiClient.getDeploymentStatus(id);

        if (status.deployment) {
          setDeployment(status.deployment);

          if (status.deployment.status === 'ready') {
            clearInterval(pollInterval);
            setIsDeploying(false);
            toast.success('Deployment complete!');
          } else if (status.deployment.status === 'failed') {
            clearInterval(pollInterval);
            setIsDeploying(false);
            setDeployError(status.deployment.error_message || 'Deployment failed');
            toast.error('Deployment failed');
          }
        }
      } catch (error) {
        clearInterval(pollInterval);
        setIsDeploying(false);
        const message = error instanceof Error ? error.message : 'Failed to check deployment status';
        setDeployError(message);
      }
    }, 2000); // Poll every 2 seconds

    // Clean up interval on component unmount
    return () => clearInterval(pollInterval);
  };

  // Fetch deployment status on mount (if editing)
  useEffect(() => {
    if (!isNew && id) {
      const fetchDeploymentStatus = async () => {
        try {
          const status = await apiClient.getDeploymentStatus(id);
          if (status.deployment) {
            setDeployment(status.deployment);
          }
        } catch (error) {
          console.error('Failed to fetch deployment status:', error);
        }
      };
      fetchDeploymentStatus();
    }
  }, [isNew, id]);

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
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/releases">Releases</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {isNew ? 'Create Release' : formData.name || 'Edit Release'}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title={isNew ? 'Create Release' : 'Edit Release'}
        description={
          isNew
            ? 'Configure a new release to deploy with Leger'
            : 'Update your release configuration'
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Infrastructure Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-primary/20 bg-primary/5">
            <AlertTitle>Schema-Driven Configuration</AlertTitle>
            <AlertDescription>
              Configure your infrastructure deployment using the latest schema from{' '}
              <code className="text-xs">leger-labs/schema</code>. Enable the features you want,
              select providers, and fine-tune settings through an intuitive step-by-step interface.
            </AlertDescription>
          </Alert>

          <CategoryBasedReleaseForm
            schema={releaseSchemaBundle.schema}
            uiSchema={releaseSchemaBundle.uiSchema}
            categories={releaseSchemaBundle.categories}
            value={configData}
            onChange={handleConfigChange}
            onSubmit={handleConfigSubmit}
            isSubmitting={isConfigSaving}
            isDirty={isConfigDirty}
            submitLabel="Save configuration"
          />
        </CardContent>
      </Card>

      {!isNew && id && (
        <Card>
          <CardHeader>
            <CardTitle>Deploy to R2</CardTitle>
            <CardDescription>
              Render templates and upload to Cloudflare R2 for deployment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="w-full sm:w-auto"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Deploy to R2
                  </>
                )}
              </Button>

              {deployment && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {deployment.status === 'rendering' && (
                    <Badge variant="secondary">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Rendering
                    </Badge>
                  )}
                  {deployment.status === 'uploading' && (
                    <Badge variant="secondary">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Uploading
                    </Badge>
                  )}
                  {deployment.status === 'ready' && (
                    <Badge variant="default" className="bg-green-500">
                      <Check className="mr-1 h-3 w-3" />
                      Ready
                    </Badge>
                  )}
                  {deployment.status === 'failed' && (
                    <Badge variant="destructive">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Failed
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {deployError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Deployment Failed</AlertTitle>
                <AlertDescription>{deployError}</AlertDescription>
              </Alert>
            )}

            {deployment?.status === 'ready' && deployment.manifest_url && (
              <Alert>
                <AlertTitle>Deployment Complete</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>Your deployment is ready at:</p>
                  <a
                    href={deployment.manifest_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline font-mono text-sm"
                  >
                    {deployment.manifest_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-sm text-muted-foreground mt-2">
                    Use the Leger CLI to pull and install this deployment
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {formData.name && (
        <Card>
          <CardHeader>
            <CardTitle>Deploy Command</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-4 py-2 rounded-md font-mono text-sm">
                leger deploy {formData.name}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyDeployCommand}
                title="Copy command"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Use this command in your terminal to deploy this release
            </p>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
