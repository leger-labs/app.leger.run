/**
 * Configuration Summary Component
 *
 * Shows a visual summary of enabled features and selected providers
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  Server,
  Database,
  Search,
  Image,
  Mic,
  Volume2,
  Code,
  Cloud,
  Shield,
  Sparkles,
  Info,
} from 'lucide-react';
import { getValueAtPath } from '@/lib/progressive-disclosure';

interface ConfigurationSummaryProps {
  formData: Record<string, unknown>;
  schema: any;
}

interface EnabledFeature {
  key: string;
  label: string;
  icon: React.ReactNode;
  provider?: string;
  providerLabel?: string;
}

/**
 * Get icon for a feature
 */
function getFeatureIcon(feature: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    rag: <Database className="h-4 w-4" />,
    web_search: <Search className="h-4 w-4" />,
    image_generation: <Image className="h-4 w-4" />,
    speech_to_text: <Mic className="h-4 w-4" />,
    text_to_speech: <Volume2 className="h-4 w-4" />,
    code_execution: <Code className="h-4 w-4" />,
    code_interpreter: <Code className="h-4 w-4" />,
    google_drive: <Cloud className="h-4 w-4" />,
    onedrive: <Cloud className="h-4 w-4" />,
    oauth_signup: <Shield className="h-4 w-4" />,
    ldap: <Shield className="h-4 w-4" />,
    title_generation: <Sparkles className="h-4 w-4" />,
    autocomplete_generation: <Sparkles className="h-4 w-4" />,
    tags_generation: <Sparkles className="h-4 w-4" />,
  };

  return icons[feature] || <CheckCircle2 className="h-4 w-4" />;
}

/**
 * Get human-readable label for a feature
 */
function getFeatureLabel(feature: string): string {
  const labels: Record<string, string> = {
    rag: 'RAG (Retrieval-Augmented Generation)',
    web_search: 'Web Search',
    image_generation: 'Image Generation',
    speech_to_text: 'Speech-to-Text',
    text_to_speech: 'Text-to-Speech',
    code_execution: 'Code Execution',
    code_interpreter: 'Code Interpreter',
    google_drive: 'Google Drive Integration',
    onedrive: 'OneDrive Integration',
    oauth_signup: 'OAuth Signup',
    ldap: 'LDAP Authentication',
    title_generation: 'AI Title Generation',
    autocomplete_generation: 'Autocomplete',
    tags_generation: 'Tags Generation',
    websocket_support: 'WebSocket Support',
  };

  return labels[feature] || feature;
}

/**
 * Get provider label
 */
function getProviderLabel(providerKey: string, providerValue: string): string {
  const labels: Record<string, Record<string, string>> = {
    vector_db: {
      qdrant: 'Qdrant',
      pgvector: 'PostgreSQL+pgvector',
      chroma: 'ChromaDB',
    },
    rag_embedding: {
      openai: 'OpenAI',
      ollama: 'Ollama',
    },
    content_extraction: {
      tika: 'Apache Tika',
      docling: 'Docling',
    },
    text_splitter: {
      character: 'Character Splitter',
      recursive: 'Recursive Splitter',
      token: 'Token Splitter',
      markdown_header: 'Markdown Header Splitter',
    },
    web_search_engine: {
      searxng: 'SearXNG',
      tavily: 'Tavily',
      brave: 'Brave Search',
      google_pse: 'Google PSE',
      serper: 'Serper',
      serpapi: 'SerpAPI',
      bing: 'Bing',
    },
    web_loader: {
      requests: 'Requests',
      selenium: 'Selenium',
      playwright: 'Playwright',
      safe_web: 'SafeWeb',
    },
    image_engine: {
      openai: 'OpenAI DALL-E',
      automatic1111: 'Automatic1111',
      comfyui: 'ComfyUI',
      gemini: 'Google Gemini',
    },
    stt_engine: {
      openai: 'OpenAI Whisper',
      whisper: 'Faster Whisper',
      azure: 'Azure STT',
      deepgram: 'Deepgram',
    },
    tts_engine: {
      openai: 'OpenAI TTS',
      elevenlabs: 'ElevenLabs',
      edgetts: 'Edge TTS',
      azure: 'Azure TTS',
    },
    code_execution_engine: {
      jupyter: 'Jupyter',
      pyodide: 'Pyodide',
    },
    code_interpreter_engine: {
      jupyter: 'Jupyter',
      e2b: 'E2B',
    },
    storage_provider: {
      '': 'None',
      s3: 'AWS S3',
      gcs: 'Google Cloud Storage',
    },
    auth_provider: {
      local: 'Local',
      oauth: 'OAuth',
      ldap: 'LDAP',
    },
  };

  return labels[providerKey]?.[providerValue] || providerValue || 'Not selected';
}

/**
 * Map features to their provider keys
 */
const featureProviderMap: Record<string, string[]> = {
  rag: ['vector_db', 'rag_embedding', 'content_extraction', 'text_splitter'],
  web_search: ['web_search_engine', 'web_loader'],
  image_generation: ['image_engine'],
  speech_to_text: ['stt_engine'],
  text_to_speech: ['tts_engine'],
  code_execution: ['code_execution_engine'],
  code_interpreter: ['code_interpreter_engine'],
};

export function ConfigurationSummary({ formData, schema }: ConfigurationSummaryProps) {
  const enabledFeatures = useMemo(() => {
    const features: EnabledFeature[] = [];
    const featuresData = (formData.features as Record<string, boolean>) || {};
    const providersData = (formData.providers as Record<string, string>) || {};

    // Check each feature
    Object.entries(featuresData).forEach(([key, enabled]) => {
      if (enabled) {
        const feature: EnabledFeature = {
          key,
          label: getFeatureLabel(key),
          icon: getFeatureIcon(key),
        };

        // Add provider info if applicable
        const providerKeys = featureProviderMap[key];
        if (providerKeys && providerKeys.length > 0) {
          const primaryProvider = providerKeys[0];
          const providerValue = providersData[primaryProvider];
          if (providerValue) {
            feature.provider = primaryProvider;
            feature.providerLabel = getProviderLabel(primaryProvider, providerValue);
          }
        }

        features.push(feature);
      }
    });

    return features;
  }, [formData]);

  const storageProvider = useMemo(() => {
    const provider = getValueAtPath(formData, 'providers.storage_provider') as string;
    return getProviderLabel('storage_provider', provider || '');
  }, [formData]);

  const authProvider = useMemo(() => {
    const provider = getValueAtPath(formData, 'providers.auth_provider') as string;
    return getProviderLabel('auth_provider', provider || '');
  }, [formData]);

  if (enabledFeatures.length === 0) {
    return (
      <Alert className="border-muted bg-muted/20">
        <Info className="h-4 w-4" />
        <AlertTitle>Minimal Configuration</AlertTitle>
        <AlertDescription>
          No optional features are currently enabled. This will deploy a minimal setup with just
          the core services (OpenWebUI, LiteLLM, and supporting infrastructure).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="border-primary/20 bg-primary/5">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <AlertTitle>Configuration Summary</AlertTitle>
        <AlertDescription>
          Review your selections below. You can go back to any step to make changes.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5" />
            Enabled Features ({enabledFeatures.length})
          </CardTitle>
          <CardDescription>
            These features will be configured in your deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {enabledFeatures.map((feature) => (
              <div
                key={feature.key}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="text-primary">{feature.icon}</div>
                  <div>
                    <div className="font-medium text-sm">{feature.label}</div>
                    {feature.providerLabel && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Using {feature.providerLabel}
                      </div>
                    )}
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Core Settings
          </CardTitle>
          <CardDescription>Essential configuration for your deployment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium text-sm">Authentication</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {authProvider}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <Cloud className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium text-sm">External Storage</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {storageProvider}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>What happens next?</AlertTitle>
        <AlertDescription>
          When you save this configuration, it will be used to generate Podman Quadlet files for
          deployment. You can then deploy this release to your infrastructure using the Leger CLI.
        </AlertDescription>
      </Alert>
    </div>
  );
}
