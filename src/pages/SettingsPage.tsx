/**
 * Settings Page
 * User account information (read-only for v0.1.0)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Save } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { CategorySection } from '@/components/ui/form/layouts/category-section';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useAuth } from '@/hooks/use-auth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface TailscaleConfig {
  full_hostname: string;
  hostname: string;
  tailnet: string;
}

export function SettingsPage() {
  const { user } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [tailscaleConfig, setTailscaleConfig] = useState<TailscaleConfig>({
    full_hostname: '',
    hostname: '',
    tailnet: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Auto-extract hostname and tailnet from full_hostname
  const extractHostnameParts = (fullHostname: string) => {
    const pattern = /^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.(tail[a-z0-9]+\.ts\.net)$/;
    const match = fullHostname.match(pattern);

    if (match) {
      return {
        hostname: match[1],
        tailnet: match[2],
      };
    }

    return { hostname: '', tailnet: '' };
  };

  // Validate full_hostname pattern
  const validateFullHostname = (value: string): boolean => {
    if (!value) return true; // Empty is valid (not required yet)
    const pattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.tail[a-z0-9]+\.ts\.net$/;
    return pattern.test(value);
  };

  // Handle full_hostname change
  const handleFullHostnameChange = (value: string) => {
    setTailscaleConfig((prev: TailscaleConfig) => ({
      ...prev,
      full_hostname: value,
      ...extractHostnameParts(value),
    }));

    // Validate
    if (value && !validateFullHostname(value)) {
      setValidationError('Invalid Tailscale MagicDNS hostname format. Expected format: myserver.tail8dd1.ts.net');
    } else {
      setValidationError(null);
    }
  };

  // Save Tailscale configuration
  const handleSave = async () => {
    if (!tailscaleConfig.full_hostname) {
      toast.error('Please enter a Tailscale MagicDNS hostname');
      return;
    }

    if (!validateFullHostname(tailscaleConfig.full_hostname)) {
      toast.error('Invalid hostname format');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.updateUserSettings({
        tailscale: tailscaleConfig,
      });

      toast.success('Tailscale configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved configuration on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await apiClient.getUserSettings();
        if (response.settings.tailscale) {
          setTailscaleConfig(response.settings.tailscale);
        }
      } catch (error) {
        console.error('Failed to load saved configuration:', error);
      }
    };

    loadSettings();
  }, []);

  return (
    <PageLayout>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Settings"
        description="View your account information and preferences"
      />

      <CategorySection
        title="Account Information"
        description="Your Leger account details. These are managed through your Tailscale authentication."
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={user?.email || ''}
            readOnly
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tailnet">Tailnet</Label>
          <Input
            id="tailnet"
            value={user?.tailnet || ''}
            readOnly
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="display_name">Display Name</Label>
          <Input
            id="display_name"
            value={user?.display_name || 'Not set'}
            readOnly
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="user_uuid">User UUID</Label>
          <div className="flex items-center gap-2">
            <Input
              id="user_uuid"
              value={user?.user_uuid || ''}
              readOnly
              className="bg-muted font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(user?.user_uuid || '', 'user_uuid')}
              title="Copy UUID"
            >
              {copiedField === 'user_uuid' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="created_at">Member Since</Label>
          <Input
            id="created_at"
            value={
              user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : ''
            }
            readOnly
            className="bg-muted"
          />
        </div>
      </CategorySection>

      <CategorySection
        title="Tailscale Configuration"
        description="Configure your Tailscale MagicDNS hostname for HTTPS access"
      >
        <div className="space-y-2">
          <Label htmlFor="full_hostname">
            Tailscale MagicDNS Hostname <span className="text-red-500">*</span>
          </Label>
          <Input
            id="full_hostname"
            value={tailscaleConfig.full_hostname}
            onChange={(e) => handleFullHostnameChange(e.target.value)}
            placeholder="myserver.tail8dd1.ts.net"
            className={validationError ? 'border-red-500' : ''}
          />
          {validationError && (
            <p className="text-sm text-red-500">{validationError}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Your full Tailscale MagicDNS hostname (e.g., blueprint.tail8dd1.ts.net)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hostname">Machine Hostname</Label>
          <Input
            id="hostname"
            value={tailscaleConfig.hostname}
            readOnly
            className="bg-muted"
          />
          <p className="text-sm text-muted-foreground">
            The machine name portion (auto-extracted from full_hostname)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tailnet_domain">Tailnet Domain</Label>
          <Input
            id="tailnet_domain"
            value={tailscaleConfig.tailnet}
            readOnly
            className="bg-muted"
          />
          <p className="text-sm text-muted-foreground">
            The tailnet domain portion (auto-extracted from full_hostname)
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || !tailscaleConfig.full_hostname || !!validationError}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CategorySection>
    </PageLayout>
  );
}
