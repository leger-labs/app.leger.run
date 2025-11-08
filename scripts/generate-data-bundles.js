import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const MARKETPLACE_SRC = path.join(SRC_DIR, 'data', 'marketplace');
const MODELS_SRC = path.join(SRC_DIR, 'data', 'models');
const OUTPUT_DIR = path.join(SRC_DIR, 'generated');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function collectJsonEntries(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => {
      const absolutePath = path.join(dirPath, entry.name);
      const data = readJsonFile(absolutePath);
      const id = data?.id ?? entry.name.replace(/\.json$/u, '');
      return { id, data };
    })
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((entry) => entry.data);
}

function writeJson(filePath, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(filePath, json, 'utf-8');
}

function generateMarketplaceBundle() {
  console.log('📦 Bundling marketplace services...');
  const services = collectJsonEntries(MARKETPLACE_SRC);
  const output = {
    serviceCount: services.length,
    services,
  };

  const outputFile = path.join(OUTPUT_DIR, 'marketplace-services.json');
  writeJson(outputFile, output);
  console.log(`✅ Marketplace bundle written to ${outputFile}`);
}

function generateModelStoreBundle() {
  console.log('📦 Bundling model store data...');

  const cloudModels = collectJsonEntries(path.join(MODELS_SRC, 'cloud'));
  const localModels = collectJsonEntries(path.join(MODELS_SRC, 'local'));
  const makers = collectJsonEntries(path.join(MODELS_SRC, 'makers'));
  const providers = collectJsonEntries(path.join(MODELS_SRC, 'providers'));

  const output = {
    cloudModelCount: cloudModels.length,
    localModelCount: localModels.length,
    makerCount: makers.length,
    providerCount: providers.length,
    cloudModels,
    localModels,
    makers,
    providers,
  };

  const outputFile = path.join(OUTPUT_DIR, 'model-store-data.json');
  writeJson(outputFile, output);
  console.log(`✅ Model store bundle written to ${outputFile}`);
}

function run() {
  ensureDir(OUTPUT_DIR);
  generateMarketplaceBundle();
  generateModelStoreBundle();
}

try {
  run();
} catch (error) {
  console.error('❌ Failed to generate data bundles');
  console.error(error);
  process.exit(1);
}
