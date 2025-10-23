#!/usr/bin/env node
/**
 * Phase 1.2: Dependency Mapping
 *
 * Creates a comprehensive dependency graph showing:
 * 1. Which domain components depend on which UI primitives
 * 2. Import chains (A → B → C)
 * 3. Circular dependencies
 * 4. External dependencies (Radix, React Hook Form, etc.)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Read the Phase 1.1 audit results
const phase1Results = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'phase1-usage-audit.json'), 'utf-8')
);

// Extract all imports from a file
function extractAllImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = [];

  // Match all import statements
  const importRegex = /import\s+(?:{([^}]+)}|(\w+)|\*\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/gm;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const namedImports = match[1] ? match[1].split(',').map(s => s.trim()) : [];
    const defaultImport = match[2];
    const namespaceImport = match[3];
    const source = match[4];

    imports.push({
      type: namedImports.length > 0 ? 'named' : defaultImport ? 'default' : 'namespace',
      imports: namedImports.length > 0 ? namedImports : defaultImport ? [defaultImport] : [namespaceImport],
      source,
      raw: match[0]
    });
  }

  return imports;
}

// Build dependency graph
function buildDependencyGraph() {
  const graph = {
    nodes: [],
    edges: [],
    components: {}
  };

  // Get all component files
  const componentFiles = phase1Results.component_catalog.map(c =>
    path.join(ROOT_DIR, 'src', 'components', 'ui', c.path)
  );

  componentFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;

    const componentName = path.basename(filePath, '.tsx');
    const imports = extractAllImports(filePath);

    // Create node
    const node = {
      id: componentName,
      path: path.relative(ROOT_DIR, filePath),
      type: phase1Results.component_catalog.find(c => c.path.includes(componentName))?.category || 'unknown',
      dependencies: [],
      dependents: [],
      externalDeps: []
    };

    // Categorize dependencies
    imports.forEach(imp => {
      if (imp.source.startsWith('@/components/ui')) {
        // Internal UI component dependency
        imp.imports.forEach(name => {
          node.dependencies.push({
            name,
            source: imp.source,
            type: 'internal-ui'
          });

          graph.edges.push({
            from: componentName,
            to: name,
            type: 'internal-ui'
          });
        });
      } else if (imp.source.startsWith('@radix-ui') || imp.source.startsWith('radix-ui')) {
        // Radix dependency
        imp.imports.forEach(name => {
          node.externalDeps.push({
            name,
            source: imp.source,
            type: 'radix'
          });
        });
      } else if (imp.source.includes('react-hook-form')) {
        // React Hook Form dependency
        imp.imports.forEach(name => {
          node.externalDeps.push({
            name,
            source: imp.source,
            type: 'react-hook-form'
          });
        });
      } else if (imp.source.startsWith('react') || imp.source.startsWith('@/')) {
        // Other internal or React dependencies
        imp.imports.forEach(name => {
          node.externalDeps.push({
            name,
            source: imp.source,
            type: imp.source.startsWith('react') ? 'react' : 'internal-other'
          });
        });
      }
    });

    graph.nodes.push(node);
    graph.components[componentName] = node;
  });

  // Build dependents (reverse dependencies)
  graph.edges.forEach(edge => {
    if (graph.components[edge.to]) {
      graph.components[edge.to].dependents.push(edge.from);
    }
  });

  return graph;
}

// Find circular dependencies
function findCircularDependencies(graph) {
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function dfs(node, path = []) {
    if (recursionStack.has(node)) {
      // Found a cycle
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart).concat(node);
      cycles.push(cycle);
      return;
    }

    if (visited.has(node)) return;

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const component = graph.components[node];
    if (component) {
      component.dependencies
        .filter(dep => dep.type === 'internal-ui')
        .forEach(dep => {
          dfs(dep.name, [...path]);
        });
    }

    recursionStack.delete(node);
  }

  Object.keys(graph.components).forEach(componentName => {
    if (!visited.has(componentName)) {
      dfs(componentName);
    }
  });

  return cycles;
}

// Analyze dependency depth
function analyzeDependencyDepth(graph) {
  const depths = {};

  function calculateDepth(node, visited = new Set()) {
    if (depths[node] !== undefined) return depths[node];
    if (visited.has(node)) return 0; // Cycle protection

    visited.add(node);

    const component = graph.components[node];
    if (!component || component.dependencies.length === 0) {
      depths[node] = 0;
      return 0;
    }

    const maxDepth = Math.max(
      0,
      ...component.dependencies
        .filter(dep => dep.type === 'internal-ui')
        .map(dep => calculateDepth(dep.name, new Set(visited)))
    );

    depths[node] = maxDepth + 1;
    return depths[node];
  }

  Object.keys(graph.components).forEach(node => calculateDepth(node));

  return depths;
}

// Find migration order based on dependencies
function determineMigrationOrder(graph, depths) {
  // Group by depth (leaf nodes first)
  const layers = {};

  Object.entries(depths).forEach(([node, depth]) => {
    if (!layers[depth]) layers[depth] = [];
    layers[depth].push(node);
  });

  // Sort layers
  const sortedLayers = Object.keys(layers)
    .map(Number)
    .sort((a, b) => a - b)
    .map(depth => ({
      depth,
      components: layers[depth],
      description: depth === 0 ? 'Leaf components (no dependencies)' : `Depth ${depth} (depends on lower layers)`
    }));

  return sortedLayers;
}

// Analyze external dependencies
function analyzeExternalDependencies(graph) {
  const externalDeps = {
    radix: new Set(),
    reactHookForm: new Set(),
    react: new Set(),
    other: new Set()
  };

  const componentExternalDeps = {};

  Object.entries(graph.components).forEach(([name, component]) => {
    componentExternalDeps[name] = {
      radix: [],
      reactHookForm: [],
      react: [],
      other: []
    };

    component.externalDeps.forEach(dep => {
      switch (dep.type) {
        case 'radix':
          externalDeps.radix.add(dep.source);
          componentExternalDeps[name].radix.push(dep);
          break;
        case 'react-hook-form':
          externalDeps.reactHookForm.add(dep.source);
          componentExternalDeps[name].reactHookForm.push(dep);
          break;
        case 'react':
          externalDeps.react.add(dep.source);
          componentExternalDeps[name].react.push(dep);
          break;
        default:
          externalDeps.other.add(dep.source);
          componentExternalDeps[name].other.push(dep);
      }
    });
  });

  return {
    summary: {
      radixPackages: Array.from(externalDeps.radix),
      reactHookFormPackages: Array.from(externalDeps.reactHookForm),
      reactPackages: Array.from(externalDeps.react),
      otherPackages: Array.from(externalDeps.other)
    },
    byComponent: componentExternalDeps
  };
}

// Main execution
async function main() {
  console.log('Phase 1.2: Building dependency graph...\n');

  const graph = buildDependencyGraph();
  console.log(`Analyzed ${graph.nodes.length} components`);
  console.log(`Found ${graph.edges.length} internal dependencies\n`);

  console.log('Detecting circular dependencies...');
  const cycles = findCircularDependencies(graph);
  console.log(`Found ${cycles.length} circular dependency chains\n`);

  console.log('Calculating dependency depths...');
  const depths = analyzeDependencyDepth(graph);

  console.log('Determining migration order...');
  const migrationOrder = determineMigrationOrder(graph, depths);

  console.log('Analyzing external dependencies...');
  const externalDeps = analyzeExternalDependencies(graph);

  // Generate report
  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      source_audit: 'phase1-usage-audit.json'
    },
    graph: {
      nodes: graph.nodes,
      edges: graph.edges,
      statistics: {
        total_nodes: graph.nodes.length,
        total_edges: graph.edges.length,
        domain_components: graph.nodes.filter(n => n.type === 'domain-specific').length,
        generic_components: graph.nodes.filter(n => n.type === 'generic-ui').length
      }
    },
    circular_dependencies: cycles,
    dependency_depths: depths,
    migration_order: migrationOrder,
    external_dependencies: externalDeps,
    recommendations: {
      migration_sequence: migrationOrder.map((layer, index) => ({
        order: index + 1,
        depth: layer.depth,
        components: layer.components,
        rationale: index === 0
          ? 'Start with leaf components - they have no internal dependencies'
          : `Layer ${index} - depends only on already-migrated layers`
      })),
      high_risk_components: graph.nodes
        .filter(n => n.dependents.length > 5)
        .map(n => ({
          component: n.id,
          dependents_count: n.dependents.length,
          dependents: n.dependents,
          risk: 'Many components depend on this - migration will affect multiple files'
        })),
      isolated_components: graph.nodes
        .filter(n => n.dependencies.length === 0 && n.dependents.length === 0)
        .map(n => ({
          component: n.id,
          recommendation: 'Can be migrated or removed independently without affecting other components'
        }))
    }
  };

  // Write report
  const outputPath = path.join(__dirname, 'phase1-2-dependency-map.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(`\n${'='.repeat(60)}`);
  console.log('DEPENDENCY MAPPING COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total components: ${graph.nodes.length}`);
  console.log(`Dependency edges: ${graph.edges.length}`);
  console.log(`Circular dependencies: ${cycles.length}`);
  console.log(`Migration layers: ${migrationOrder.length}`);
  console.log(`External Radix packages: ${externalDeps.summary.radixPackages.length}`);
  console.log(`\nReport written to: ${outputPath}`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Error during dependency mapping:', err);
  process.exit(1);
});
