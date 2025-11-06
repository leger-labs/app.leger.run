/**
 * Model Detail Page
 * Detailed view of a specific AI model
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useModel, useModelsByMaker } from '@/hooks/use-model-store';
import { useSecrets } from '@/hooks/use-secrets';
import { isCloudModel } from '@/types/model-store';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import type { Provider } from '@/types/model-store';
import { resolveIconPath } from '@/assets/icons';

export function ModelDetailPage() {
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();
  const { model, providers, isLoading } = useModel(modelId);
  const { models: relatedModels } = useModelsByMaker(model?.maker);
  const { secrets } = useSecrets();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isProviderConfigured = (provider: Provider) => {
    if (!provider.requires_api_key) return true;
    return secrets.some((s) => s.name === provider.requires_api_key);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <Skeleton className="h-5 w-64 mb-6" />
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-4" />
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
        </div>
        <Skeleton className="h-10 w-96 mb-8" />
        <div className="space-y-8">
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-20 w-full mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full mb-4" />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!model) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Model not found</p>
          <Button onClick={() => navigate('/models')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Models
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/models">Browse Models</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{model.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back Button and Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/models')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          All Models
        </Button>

        <div className="flex items-start gap-4">
          <img src={resolveIconPath(model.icon)} alt={model.name} className="h-16 w-16 rounded" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{model.name}</h1>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                {model.maker}/{model.id}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(`${model.maker}/${model.id}`, 'model-id')}
              >
                {copiedId === 'model-id' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="playground" disabled>
            Playground
          </TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 mt-6">
          {/* About Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-muted-foreground mb-4">{model.description}</p>

            {/* Model Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Context Window</div>
                <div className="text-lg font-semibold">
                  {(model.context_window / 1000).toFixed(0)}K tokens
                </div>
              </div>
              {model.max_output && (
                <div>
                  <div className="text-sm text-muted-foreground">Max Output</div>
                  <div className="text-lg font-semibold">
                    {(model.max_output / 1000).toFixed(0)}K tokens
                  </div>
                </div>
              )}
              {!isCloudModel(model) && (
                <div>
                  <div className="text-sm text-muted-foreground">RAM Required</div>
                  <div className="text-lg font-semibold">{model.ram_required_gb}GB</div>
                </div>
              )}
            </div>

            {/* Capabilities */}
            <div className="mb-4">
              <div className="text-sm text-muted-foreground mb-2">Capabilities</div>
              <div className="flex flex-wrap gap-2">
                {model.capabilities.map((cap) => (
                  <Badge key={cap} variant="secondary">
                    {cap}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Features */}
            {model.features && model.features.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-2">Features</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {model.features.map((feature, i) => (
                    <li key={i} className="text-muted-foreground">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Use Cases */}
            {model.use_cases && model.use_cases.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Use Cases</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {model.use_cases.map((useCase, i) => (
                    <li key={i} className="text-muted-foreground">
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <Separator />

          {/* Providers Section */}
          <section>
            <h2 className="text-xl font-semibold mb-2">Providers</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This model is available through multiple providers
            </p>

            <Accordion
              type="single"
              collapsible
              defaultValue={model.providers.find((p) => p.is_default)?.id || providers[0]?.id}
              className="space-y-4"
            >
              {providers.map((provider) => {
                const modelProvider = model.providers.find((p) => p.id === provider.id);
                const isConfigured = isProviderConfigured(provider);
                const isDefault = modelProvider?.is_default;

                return (
                  <AccordionItem
                    key={provider.id}
                    value={provider.id}
                    className="border rounded-lg"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveIconPath(provider.icon)}
                            alt={provider.name}
                            className="h-8 w-8 rounded"
                          />
                          <div className="text-left">
                            <div className="font-semibold">{provider.name}</div>
                            <div className="text-xs text-muted-foreground font-normal">
                              {provider.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                          {isConfigured && (
                            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                              <Check className="h-3 w-3" />
                              Configured
                            </Badge>
                          )}
                          {!isConfigured && provider.requires_api_key && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/integrations');
                              }}
                            >
                              Add Integration
                            </Button>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-6 pb-4">
                      {/* Model identifier */}
                      <div className="mb-4">
                        <div className="text-xs text-muted-foreground mb-1">Model Identifier</div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 overflow-x-auto">
                            {modelProvider?.litellm_model_name || modelProvider?.model_uri}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopy(
                                modelProvider?.litellm_model_name ||
                                  modelProvider?.model_uri ||
                                  '',
                                `provider-${provider.id}`
                              )
                            }
                          >
                            {copiedId === `provider-${provider.id}` ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Pricing Table for Cloud Models */}
                      {isCloudModel(model) && model.pricing && (
                        <div className="mb-4">
                          <div className="text-xs text-muted-foreground mb-2">Pricing</div>
                          <div className="border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 text-sm">
                              <div className="px-3 py-2 bg-muted/50 font-medium">Metric</div>
                              <div className="px-3 py-2 bg-muted/50 font-medium text-right">Price</div>

                              <div className="px-3 py-2 border-t">Context Window</div>
                              <div className="px-3 py-2 border-t text-right font-medium">
                                {(model.context_window / 1000).toFixed(0)}K tokens
                              </div>

                              <div className="px-3 py-2 border-t bg-muted/20">Input Tokens</div>
                              <div className="px-3 py-2 border-t bg-muted/20 text-right font-medium">
                                {model.pricing.input_per_1m}/1M
                              </div>

                              <div className="px-3 py-2 border-t">Output Tokens</div>
                              <div className="px-3 py-2 border-t text-right font-medium">
                                {model.pricing.output_per_1m}/1M
                              </div>

                              {model.pricing.cache_read_per_1m && (
                                <>
                                  <div className="px-3 py-2 border-t bg-muted/20">Cache Read Tokens</div>
                                  <div className="px-3 py-2 border-t bg-muted/20 text-right font-medium">
                                    {model.pricing.cache_read_per_1m}/1M
                                  </div>
                                </>
                              )}

                              {model.pricing.cache_write_per_1m && (
                                <>
                                  <div className="px-3 py-2 border-t">Cache Write Tokens</div>
                                  <div className="px-3 py-2 border-t text-right font-medium">
                                    {model.pricing.cache_write_per_1m}/1M
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Local Model Details */}
                      {!isCloudModel(model) && (
                        <div className="mb-4">
                          <div className="text-xs text-muted-foreground mb-2">Specifications</div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">RAM Required</div>
                              <div className="font-medium">{model.ram_required_gb}GB</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Context Window</div>
                              <div className="font-medium">
                                {(model.context_window / 1000).toFixed(0)}K tokens
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Quantization</div>
                              <div className="font-medium">{model.quantization}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Provider Links */}
                      <div className="flex gap-3 text-xs pt-2 border-t">
                        <a
                          href={`${provider.website}/terms`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Terms
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <a
                          href={`${provider.website}/privacy`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Privacy
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </section>

          <Separator />

          {/* Related Models Section */}
          {relatedModels.length > 1 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">
                More models by {model.maker}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {relatedModels
                  .filter((m) => m.id !== model.id)
                  .slice(0, 6)
                  .map((relatedModel) => (
                    <Card
                      key={relatedModel.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/models/${relatedModel.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={resolveIconPath(relatedModel.icon)}
                            alt={relatedModel.name}
                            className="h-6 w-6 rounded"
                          />
                          <h3 className="font-semibold text-sm">{relatedModel.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {relatedModel.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="playground">
          <div className="text-center py-12 text-muted-foreground">
            Playground coming soon
          </div>
        </TabsContent>

        <TabsContent value="documentation">
          <div className="py-6">
            <p className="text-muted-foreground mb-4">
              View the official documentation for {model.name}:
            </p>
            <a
              href={`${model.maker === 'anthropic' ? 'https://docs.anthropic.com' : 'https://platform.openai.com/docs'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-2"
            >
              Open Documentation
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
