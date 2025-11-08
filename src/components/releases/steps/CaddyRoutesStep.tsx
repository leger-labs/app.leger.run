/**
 * Step 4: Caddy Routes Configuration
 * Configure reverse proxy routes and subdomains for each service
 */

import { useEffect, useState, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { CrystallizedConfig, CaddyRoute } from '@/types/release-wizard';

interface CaddyRoutesStepProps {
  config: Partial<CrystallizedConfig>;
  onUpdate: (data: Partial<CrystallizedConfig>) => void;
}

export function CaddyRoutesStep({ config, onUpdate }: CaddyRoutesStepProps) {
  const [schema, setSchema] = useState<any>(null);
  const [routes, setRoutes] = useState<CaddyRoute[]>([]);
  const [tailscaleHostname, setTailscaleHostname] = useState('YOUR-TAILNET.ts.net');

  // Load schema to get service defaults
  useEffect(() => {
    const loadSchema = async () => {
      try {
        const schemaModule = await import('/src/data/core/schema.json');
        setSchema(schemaModule.default);
      } catch (error) {
        console.error('Failed to load schema:', error);
      }
    };

    loadSchema();
  }, []);

  // Initialize routes from config or schema
  useEffect(() => {
    if (!schema) return;

    // If config already has routes, use those
    if (config.caddy?.routes && config.caddy.routes.length > 0) {
      setRoutes(config.caddy.routes);
      return;
    }

    // Otherwise, create routes from schema based on active services
    const services = schema.infrastructure?.services || {};
    const newRoutes: CaddyRoute[] = [];

    Object.entries(services).forEach(([serviceName, serviceConfig]: [string, any]) => {
      // Only include service if it's active based on previous steps
      if (isServiceActive(serviceName)) {
        newRoutes.push({
          service: serviceName,
          subdomain: serviceConfig.external_subdomain || '',
          port: serviceConfig.published_port || serviceConfig.port || 8080,
          enabled: !!serviceConfig.external_subdomain,
          websocket: serviceConfig.websocket || false,
        });
      }
    });

    setRoutes(newRoutes);
    onUpdate({ caddy: { routes: newRoutes } });
  }, [schema, config.services, config.models]);

  // Determine if a service should be included based on previous steps
  const isServiceActive = (serviceName: string): boolean => {
    // Core services always included
    const coreServices = ['openwebui', 'litellm', 'llama-swap', 'caddy', 'cockpit'];
    if (coreServices.includes(serviceName)) return true;

    // Check if service is selected in Step 2
    if (config.services) {
      const serviceValues = Object.values(config.services);
      if (serviceValues.includes(serviceName)) {
        return true;
      }
    }

    // Supporting services (postgres, redis for selected services)
    if (serviceName.includes('postgres')) {
      const baseService = serviceName.split('_')[0];
      // OpenWebUI always needs postgres
      if (baseService === 'openwebui') return true;
      return isServiceActive(baseService);
    }

    if (serviceName.includes('redis')) {
      // Redis is needed for OpenWebUI
      return true;
    }

    // Check if it's a marketplace service that was selected
    const selectedServices = Object.values(config.services || {}).filter(Boolean);
    return selectedServices.includes(serviceName);
  };

  const handleRouteChange = (index: number, field: keyof CaddyRoute, value: any) => {
    const newRoutes = [...routes];
    newRoutes[index] = { ...newRoutes[index], [field]: value };
    setRoutes(newRoutes);
    onUpdate({ caddy: { routes: newRoutes } });
  };

  const formatServiceName = (serviceName: string): string => {
    // Convert service name to display name
    return serviceName
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get enabled routes for preview
  const enabledRoutes = useMemo(
    () => routes.filter((r) => r.enabled && r.subdomain),
    [routes]
  );

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>Caddy Route Configuration</AlertTitle>
        <AlertDescription>
          Configure reverse proxy routes for external access. Only active services from your
          previous selections are shown.
        </AlertDescription>
      </Alert>

      {routes.length === 0 ? (
        <Alert>
          <AlertTitle>No Routes Available</AlertTitle>
          <AlertDescription>
            No services are available for routing. This could be because no services were selected
            in the previous steps.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Service Routes</CardTitle>
            <CardDescription>Configure subdomain, port, and access for each service</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>WebSocket</TableHead>
                  <TableHead>Enabled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route, index) => (
                  <TableRow key={route.service}>
                    <TableCell className="font-medium">
                      {formatServiceName(route.service)}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={route.subdomain}
                        onChange={(e) =>
                          handleRouteChange(index, 'subdomain', e.target.value)
                        }
                        placeholder="subdomain"
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={route.port}
                        onChange={(e) =>
                          handleRouteChange(index, 'port', parseInt(e.target.value) || 8080)
                        }
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={route.websocket}
                        onCheckedChange={(checked) =>
                          handleRouteChange(index, 'websocket', checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={route.enabled}
                        onCheckedChange={(checked) =>
                          handleRouteChange(index, 'enabled', checked)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Preview URLs */}
      {enabledRoutes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview URLs</CardTitle>
            <CardDescription>
              Services will be accessible at these URLs after deployment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {enabledRoutes.map((route) => (
                <div key={route.service} className="flex items-center gap-3">
                  <Badge variant="outline" className="min-w-[140px]">
                    {formatServiceName(route.service)}
                  </Badge>
                  <code className="text-sm bg-muted px-3 py-1 rounded">
                    https://{route.subdomain}.{tailscaleHostname}
                  </code>
                  {route.websocket && (
                    <Badge variant="secondary" className="text-xs">
                      WebSocket
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Note: Replace YOUR-TAILNET with your actual Tailscale tailnet hostname
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
