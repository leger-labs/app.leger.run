/**
 * Type definitions for icon assets
 * Icons are stored in src/assets/icons/
 */

/**
 * Icon name types based on available SVG files
 */
export type IconName =
  | 'alibaba'
  | 'alibabacloud'
  | 'amazon'
  | 'anthropic'
  | 'automatic'
  | 'aws'
  | 'azure'
  | 'baseten'
  | 'bing'
  | 'bocha'
  | 'brave-search'
  | 'cerebras'
  | 'chromadb'
  | 'claude'
  | 'cloudflare'
  | 'cockpit'
  | 'cohere'
  | 'comfyui'
  | 'dalle'
  | 'deepgram'
  | 'deepinfra'
  | 'deepseek'
  | 'docling'
  | 'duckduckgo'
  | 'elasticsearch'
  | 'elevenlabs'
  | 'exa'
  | 'firecrawl'
  | 'fireworks'
  | 'gemini'
  | 'gemma'
  | 'git'
  | 'github'
  | 'glmv'
  | 'google'
  | 'googlecloud'
  | 'grok'
  | 'groq'
  | 'huggingface'
  | 'ibm'
  | 'jupyter'
  | 'kagi'
  | 'kimi'
  | 'litellm-dark'
  | 'llama-cpp'
  | 'mcp'
  | 'meta'
  | 'microsoft'
  | 'milvus'
  | 'mistral'
  | 'mojeek'
  | 'moonshot'
  | 'mysql'
  | 'neo4j'
  | 'novita'
  | 'ollama'
  | 'openai'
  | 'openrouter'
  | 'opensearch'
  | 'openwebui'
  | 'parasail'
  | 'perplexity'
  | 'pinecone'
  | 'playwright'
  | 'postgresql'
  | 'puppeteer'
  | 'pyodide'
  | 'qdrant'
  | 'qwen'
  | 'redis'
  | 's3'
  | 's3vectors'
  | 'searchapi'
  | 'searxng'
  | 'serpapi'
  | 'sougou'
  | 'sqlite'
  | 'tavily'
  | 'tika'
  | 'together'
  | 'vertexai'
  | 'xai'
  | 'zai'
  | 'zhipu'
  | 'zhipuai';

/**
 * Icon metadata
 */
export interface IconMetadata {
  name: IconName;
  path: string;
  url: string;
}

/**
 * Icon registry for mapping service/provider names to icon files
 */
export type IconRegistry = Record<string, IconName>;

/**
 * Get icon path for use in src attributes
 */
export function getIconPath(name: IconName): string {
  return `/assets/icons/${name}.svg`;
}

/**
 * Check if an icon name is valid
 */
export function isValidIconName(name: string): name is IconName {
  const validIcons = new Set<string>([
    'alibaba',
    'alibabacloud',
    'amazon',
    'anthropic',
    'automatic',
    'aws',
    'azure',
    'baseten',
    'bing',
    'bocha',
    'brave-search',
    'cerebras',
    'chromadb',
    'claude',
    'cloudflare',
    'cockpit',
    'cohere',
    'comfyui',
    'dalle',
    'deepgram',
    'deepinfra',
    'deepseek',
    'docling',
    'duckduckgo',
    'elasticsearch',
    'elevenlabs',
    'exa',
    'firecrawl',
    'fireworks',
    'gemini',
    'gemma',
    'git',
    'github',
    'glmv',
    'google',
    'googlecloud',
    'grok',
    'groq',
    'huggingface',
    'ibm',
    'jupyter',
    'kagi',
    'kimi',
    'litellm-dark',
    'llama-cpp',
    'mcp',
    'meta',
    'microsoft',
    'milvus',
    'mistral',
    'mojeek',
    'moonshot',
    'mysql',
    'neo4j',
    'novita',
    'ollama',
    'openai',
    'openrouter',
    'opensearch',
    'openwebui',
    'parasail',
    'perplexity',
    'pinecone',
    'playwright',
    'postgresql',
    'puppeteer',
    'pyodide',
    'qdrant',
    'qwen',
    'redis',
    's3',
    's3vectors',
    'searchapi',
    'searxng',
    'serpapi',
    'sougou',
    'sqlite',
    'tavily',
    'tika',
    'together',
    'vertexai',
    'xai',
    'zai',
    'zhipu',
    'zhipuai',
  ]);

  return validIcons.has(name);
}
