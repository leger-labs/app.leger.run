/**
 * Model Detail Page
 * Detailed view of a specific AI model
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useModel, useModelsByMaker } from '@/hooks/use-model-store';
import { useSecrets } from '@/hooks/use-secrets';
import { isCloudModel } from '@/types/model-store';
import { toast } from 'sonner';
import type { Provider } from '@/types/model-store';

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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!model) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Model not found</p>
          <Button onClick={() => navigate('/ai-gateway')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AI Gateway
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Back Button and Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/ai-gateway')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          All Models
        </Button>

        <div className="flex items-start gap-4">
          <img src={`/${model.icon}`} alt={model.name} className="h-16 w-16 rounded" />
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
            <h2 className="text-xl font-semibold mb-4">Providers</h2>
            <div className="space-y-4">
              {providers.map((provider) => {
                const modelProvider = model.providers.find((p) => p.id === provider.id);
                const isConfigured = isProviderConfigured(provider);

                return (
                  <Card key={provider.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={`/${provider.icon}`}
                            alt={provider.name}
                            className="h-8 w-8 rounded"
                          />
                          <CardTitle>{provider.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {isConfigured && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Configured
                            </Badge>
                          )}
                          <Button
                            variant="outline"
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
                    </CardHeader>
                    <CardContent>
                      {/* Model identifier */}
                      <div className="mb-4">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono block overflow-x-auto">
                          {modelProvider?.litellm_model_name || modelProvider?.model_uri}
                        </code>
                      </div>

                      {/* Pricing Grid for Cloud Models */}
                      {isCloudModel(model) && model.pricing && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Context</div>
                            <div className="font-medium">
                              {(model.context_window / 1000).toFixed(0)}K
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Input</div>
                            <div className="font-medium">{model.pricing.input_per_1m}/1M</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Output</div>
                            <div className="font-medium">{model.pricing.output_per_1m}/1M</div>
                          </div>
                          {model.pricing.cache_read_per_1m && (
                            <div>
                              <div className="text-sm text-muted-foreground">Cache Read</div>
                              <div className="font-medium">
                                {model.pricing.cache_read_per_1m}/1M
                              </div>
                            </div>
                          )}
                          {model.pricing.cache_write_per_1m && (
                            <div>
                              <div className="text-sm text-muted-foreground">Cache Write</div>
                              <div className="font-medium">
                                {model.pricing.cache_write_per_1m}/1M
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Local Model Details */}
                      {!isCloudModel(model) && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-muted-foreground">RAM Required</div>
                            <div className="font-medium">{model.ram_required_gb}GB</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Context</div>
                            <div className="font-medium">
                              {(model.context_window / 1000).toFixed(0)}K
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Quantization</div>
                            <div className="font-medium">{model.quantization}</div>
                          </div>
                        </div>
                      )}

                      {/* Provider Links */}
                      <div className="flex gap-3 text-xs">
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
                            src={`/${relatedModel.icon}`}
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
