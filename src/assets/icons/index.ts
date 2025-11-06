/**
 * Icon asset loaders
 * Dynamically imports SVG icons from the icons directory
 */

const icons = import.meta.glob<string>('./*.svg', {
  query: '?raw',
  import: 'default',
});

// Registry of available icons
export const iconRegistry = {
  providers: [
    'alibaba', 'alibabacloud', 'amazon', 'anthropic', 'aws', 'azure',
    'baseten', 'cerebras', 'cloudflare', 'cohere', 'deepinfra', 'deepseek',
    'fireworks', 'gemini', 'google', 'googlecloud', 'groq', 'huggingface',
    'litellm-dark', 'mistral', 'novita', 'ollama', 'openai', 'openrouter',
    'perplexity', 'together', 'vertexai', 'xai'
  ],
  services: [
    'automatic', 'bing', 'bocha', 'brave-search', 'chromadb', 'comfyui',
    'dalle', 'deepgram', 'docling', 'duckduckgo', 'edgetts', 'elasticsearch', 'elevenlabs',
    'exa', 'firecrawl', 'jupyter', 'kagi', 'milvus', 'mojeek', 'opensearch', 'opentelemetry',
    'pinecone', 'playwright', 'postgresql', 'puppeteer', 'pyodide', 'qdrant',
    'redis', 's3', 's3vectors', 'searchapi', 'searxng', 'serpapi', 'sougou',
    'sqlite', 'tavily', 'tika', 'mysql', 'neo4j'
  ],
  makers: [
    'alibaba', 'amazon', 'anthropic', 'deepseek', 'google', 'ibm', 'meta',
    'microsoft', 'openai', 'xai'
  ],
  models: [
    'claude', 'gemini', 'gemma', 'glmv', 'grok', 'kimi', 'llama-cpp',
    'moonshot', 'qwen', 'zhipu', 'zhipuai', 'zai'
  ],
  tools: [
    'cockpit', 'git', 'github', 'mcp', 'openwebui', 'parasail'
  ]
};

export async function getIcon(name: string): Promise<string> {
  const icon = icons[`./${name}.svg`];
  if (!icon) {
    console.warn(`Icon not found: ${name}`);
    return '';
  }
  return await icon();
}

export function getIconUrl(name: string): string {
  return new URL(`./${name}.svg`, import.meta.url).href;
}

/**
 * Resolves icon path from JSON definition to usable URL
 * Handles both @/assets/icons/xxx.svg and /assets/xxx.svg formats
 */
export function resolveIconPath(iconPath: string | undefined): string {
  if (!iconPath) {
    console.warn('Icon path is undefined');
    return '';
  }

  // Extract icon name from various path formats
  // @/assets/icons/openai.svg -> openai
  // /assets/icons/openai.svg -> openai
  // openai.svg -> openai
  const match = iconPath.match(/([^/]+)\.svg$/);
  if (!match) {
    console.warn(`Invalid icon path format: ${iconPath}`);
    return iconPath; // Return as-is if format is unexpected
  }

  const iconName = match[1];
  return getIconUrl(iconName);
}
