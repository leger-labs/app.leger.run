#!/usr/bin/env node
/**
 * Master script to generate all schema-related files
 *
 * Runs:
 * 1. UI Schema generation (progressive disclosure)
 * 2. Model options generation (dropdown values)
 * 3. TypeScript types generation (type safety)
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_PATH = join(__dirname, '../../schemas/releases/latest/schema.json');
const MODEL_STORE_PATH = join(__dirname, '../../model-store');

/**
 * Check if required directories exist
 */
function checkPrerequisites() {
  const errors = [];

  if (!existsSync(SCHEMA_PATH)) {
    errors.push(
      `Schema file not found at: ${SCHEMA_PATH}\n` +
      `  Run: git submodule update --init --recursive`
    );
  }

  if (!existsSync(MODEL_STORE_PATH)) {
    errors.push(
      `Model store not found at: ${MODEL_STORE_PATH}\n` +
      `  Run: git submodule update --init --recursive`
    );
  }

  if (errors.length > 0) {
    console.error('✗ Prerequisites check failed:\n');
    errors.forEach(err => console.error(`  ${err}`));
    process.exit(1);
  }

  console.log('✓ Prerequisites check passed');
}

/**
 * Run a generation script
 */
function runScript(scriptPath, description) {
  console.log(`\n▶ ${description}...`);

  try {
    execSync(`node ${scriptPath}`, {
      stdio: 'inherit',
      cwd: dirname(scriptPath)
    });
  } catch (error) {
    console.error(`✗ Failed to run ${description}`);
    process.exit(1);
  }
}

/**
 * Main generation function
 */
function generateAll() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Leger Schema Generation Pipeline');
  console.log('═══════════════════════════════════════════════════════\n');

  // Check prerequisites
  checkPrerequisites();

  // Run generation scripts
  runScript(
    join(__dirname, 'generate-ui-schema.js'),
    'Generating UI Schema with progressive disclosure'
  );

  runScript(
    join(__dirname, 'generate-model-options.js'),
    'Generating model dropdown options'
  );

  runScript(
    join(__dirname, 'generate-types.js'),
    'Generating TypeScript types'
  );

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✓ All schema files generated successfully!');
  console.log('═══════════════════════════════════════════════════════');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAll();
}

export { generateAll };
