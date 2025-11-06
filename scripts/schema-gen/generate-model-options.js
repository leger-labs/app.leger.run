#!/usr/bin/env node
/**
 * Generate model dropdown options from model-store
 *
 * This script processes the model-store repository and generates:
 * - model-options.json: Dropdown options for RJSF select widgets
 * - Filters models by group (e.g., "embeddings", "task", "chat")
 */

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MODEL_STORE_PATH = join(__dirname, '../../src/data/models');
const OUTPUT_PATH = join(__dirname, '../../src/generated/model-options.json');

/**
 * Load all models from a directory
 */
function loadModelsFromDir(dirPath) {
  const models = [];

  try {
    const files = readdirSync(dirPath);

    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }

      const filePath = join(dirPath, file);
      const content = readFileSync(filePath, 'utf-8');
      const model = JSON.parse(content);

      // Only include enabled models
      if (model.enabled !== false) {
        models.push(model);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not load models from ${dirPath}:`, error.message);
  }

  return models;
}

/**
 * Group models by category for easier dropdown generation
 */
function groupModels(models) {
  const grouped = {
    cloud: [],
    local: [],
    byGroup: {},
    byProvider: {},
    all: []
  };

  for (const model of models) {
    // Add to all
    grouped.all.push(model);

    // Add to cloud/local
    if (model.provider) {
      grouped.cloud.push(model);

      // Group by provider
      if (!grouped.byProvider[model.provider]) {
        grouped.byProvider[model.provider] = [];
      }
      grouped.byProvider[model.provider].push(model);
    } else if (model.model_uri) {
      grouped.local.push(model);
    }

    // Group by group (e.g., "embeddings", "task")
    if (model.group) {
      if (!grouped.byGroup[model.group]) {
        grouped.byGroup[model.group] = [];
      }
      grouped.byGroup[model.group].push(model);
    }
  }

  return grouped;
}

/**
 * Convert models to RJSF enum options format
 */
function modelsToEnumOptions(models) {
  return models.map(model => ({
    value: model.id,
    label: model.name,
    description: model.description,
    provider: model.provider || 'local',
    group: model.group || 'general',
    contextWindow: model.context_window,
    capabilities: model.capabilities || []
  }));
}

/**
 * Generate model options
 */
function generateModelOptions() {
  console.log('Loading models from:', MODEL_STORE_PATH);

  try {
    // Load cloud models
    const cloudModels = loadModelsFromDir(join(MODEL_STORE_PATH, 'cloud'));
    console.log(`  Loaded ${cloudModels.length} cloud models`);

    // Load local models
    const localModels = loadModelsFromDir(join(MODEL_STORE_PATH, 'local'));
    console.log(`  Loaded ${localModels.length} local models`);

    // Combine and group
    const allModels = [...cloudModels, ...localModels];
    const grouped = groupModels(allModels);

    console.log('Generating model options...');

    // Generate output structure
    const output = {
      // All models as enum options
      all: modelsToEnumOptions(grouped.all),

      // Cloud models only
      cloud: modelsToEnumOptions(grouped.cloud),

      // Local models only
      local: modelsToEnumOptions(grouped.local),

      // Grouped by capability (embeddings, chat, etc.)
      byGroup: Object.fromEntries(
        Object.entries(grouped.byGroup).map(([group, models]) => [
          group,
          modelsToEnumOptions(models)
        ])
      ),

      // Grouped by provider (openai, anthropic, etc.)
      byProvider: Object.fromEntries(
        Object.entries(grouped.byProvider).map(([provider, models]) => [
          provider,
          modelsToEnumOptions(models)
        ])
      ),

      // Metadata
      meta: {
        totalModels: allModels.length,
        cloudModels: cloudModels.length,
        localModels: localModels.length,
        groups: Object.keys(grouped.byGroup),
        providers: Object.keys(grouped.byProvider),
        generatedAt: new Date().toISOString()
      }
    };

    // Ensure output directory exists
    const outputDir = dirname(OUTPUT_PATH);
    import('fs').then(fs => {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
    });

    // Write output
    writeFileSync(
      OUTPUT_PATH,
      JSON.stringify(output, null, 2),
      'utf-8'
    );

    console.log('✓ Model options generated successfully at:', OUTPUT_PATH);
    console.log('  Total models:', output.meta.totalModels);
    console.log('  Groups:', output.meta.groups.join(', '));
    console.log('  Providers:', output.meta.providers.join(', '));

  } catch (error) {
    console.error('✗ Error generating model options:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateModelOptions();
}

export { generateModelOptions };
