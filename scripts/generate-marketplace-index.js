/**
 * Generate marketplace service index
 * Scans marketplace/services/services directory and creates an index file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MARKETPLACE_DIR = path.join(__dirname, '..', 'marketplace', 'services', 'services');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'marketplace');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'index.json');

function generateMarketplaceIndex() {
  console.log('📦 Generating marketplace service index...');

  // Check if marketplace directory exists
  if (!fs.existsSync(MARKETPLACE_DIR)) {
    console.error('❌ Marketplace directory not found:', MARKETPLACE_DIR);
    console.error('   Run: git submodule update --init --recursive');
    process.exit(1);
  }

  // Read all JSON files from marketplace/services/services
  const files = fs.readdirSync(MARKETPLACE_DIR);
  const serviceFiles = files.filter(f => f.endsWith('.json'));

  // Extract service IDs (filename without .json)
  const serviceIds = serviceFiles.map(f => f.replace('.json', ''));

  // Create index object
  const index = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    count: serviceIds.length,
    services: serviceIds.sort(),
  };

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write index file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));

  console.log(`✅ Marketplace index generated successfully`);
  console.log(`   Services: ${serviceIds.length}`);
  console.log(`   Output: ${OUTPUT_FILE}`);
}

try {
  generateMarketplaceIndex();
} catch (error) {
  console.error('❌ Failed to generate marketplace index:', error);
  process.exit(1);
}
