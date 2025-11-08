/**
 * Schema Registry
 *
 * Central registry for all model JSON schemas.
 * Loads schemas from filesystem at runtime (Node.js only).
 * In browser environments, schema validation is optional.
 */

// Cache for loaded schemas
const schemaCache = new Map<string, object>();

// Detect if we're in a Node.js environment
const isNode =
  typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

/**
 * Get schema for a model by name
 *
 * Loads schema from disk on first access and caches it (Node.js only).
 * Returns null in browser environments where filesystem access is not available.
 */
export function getSchemaByName(modelName: string): object | null {
  // Check cache first
  if (schemaCache.has(modelName)) {
    return schemaCache.get(modelName)!;
  }

  // Schema loading only works in Node.js
  if (!isNode) {
    return null;
  }

  try {
    // Dynamic require to avoid bundler issues in browser
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const path = require('path');

    // Try to load schema file
    const schemaPath = path.join(__dirname, 'schemas', `${modelName}.json`);

    // Check if file exists
    if (!fs.existsSync(schemaPath)) {
      return null;
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);

    // Cache it
    schemaCache.set(modelName, schema);
    return schema;
  } catch (_error) {
    // Schema loading failed - return null
    // This is normal in browser environments
    return null;
  }
}

/**
 * Preload all known schemas into cache
 *
 * This is optional but improves performance by loading all schemas upfront.
 */
export function preloadSchemas(): void {
  const knownModels = [
    'add96',
    'sub96',
    'mul96',
    'R',
    'D',
    'T',
    'M',
    'lift',
    'project',
    'projectClass',
  ];

  for (const modelName of knownModels) {
    getSchemaByName(modelName);
  }
}
