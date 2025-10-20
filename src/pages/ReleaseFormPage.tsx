/**
 * Release Form Page
 * Create or edit a release
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Copy, Check } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { CategorySection } from '@/components/ui/form/layouts/category-section';
import { TextField } from '@/components/ui/form/fields/text-field';
import { URLInput } from '@/components/ui/form/fields/url-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReleases } from '@/hooks/use-releases';
import { apiClient } from '@/lib/api-client';

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
    git_url: '',
    git_branch: 'main',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Fetch existing release if editing
  useEffect(() => {
    if (!isNew && id) {
      const fetchRelease = async () => {
        try {
          const release = await apiClient.getRelease(id);
          setFormData({
            name: release.name,
            git_url: release.git_url,
            git_branch: release.git_branch,
            description: release.description || '',
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

  // Validation
  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value) return 'Release name is required';
        if (!/^[a-zA-Z0-9_-]{1,64}$/.test(value)) {
          return 'Name must be alphanumeric with hyphens/underscores (1-64 chars)';
        }
        break;
      case 'git_url':
        if (!value) return 'Git URL is required';
        try {
          const url = new URL(value);
          if (!url.protocol.startsWith('http')) {
            return 'URL must use http or https protocol';
          }
        } catch {
          return 'Invalid URL format';
        }
        break;
      case 'git_branch':
        if (!value) return 'Branch name is required';
        if (!/^[a-zA-Z0-9_/-]{1,255}$/.test(value)) {
          return 'Invalid branch name format';
        }
        break;
    }
    return undefined;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error || '' }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        newErrors[field] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
        title={isNew ? 'Create Release' : 'Edit Release'}
        description={
          isNew
            ? 'Configure a new release to deploy with Leger'
            : 'Update your release configuration'
        }
      />

      <CategorySection
        title="Release Configuration"
        description="Basic information about your release"
        isDirty={isDirty}
        isLoading={isSaving}
        onSave={handleSave}
        saveText={isNew ? 'Create Release' : 'Save Changes'}
      >
        <TextField
          label="Release Name"
          description="A unique identifier for this release (alphanumeric, hyphens, underscores)"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          error={errors.name}
          placeholder="my-application"
          maxLength={64}
          showCharCount
        />

        <URLInput
          label="Git Repository URL"
          description="The HTTPS URL of your Git repository"
          value={formData.git_url}
          onChange={(e) => handleFieldChange('git_url', e.target.value)}
          error={errors.git_url}
          placeholder="https://github.com/username/repository"
        />

        <TextField
          label="Git Branch"
          description="The branch to deploy from"
          value={formData.git_branch}
          onChange={(e) => handleFieldChange('git_branch', e.target.value)}
          error={errors.git_branch}
          placeholder="main"
        />

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="A brief description of this release..."
            rows={3}
          />
        </div>
      </CategorySection>

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
