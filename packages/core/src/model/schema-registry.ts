/**
 * Schema Registry
 *
 * Central registry for all model JSON schemas.
 * Loads schemas from filesystem at runtime.
 */

import * as fs from 'fs';
import * as path from 'path';

// Cache for loaded schemas
const schemaCache = new Map<string, object>();

/**
 * Get schema for a model by name
 *
 * Loads schema from disk on first access and caches it.
 */
export function getSchemaByName(modelName: string): object | null {
  // Check cache first
  if (schemaCache.has(modelName)) {
    return schemaCache.get(modelName)!;
  }

  try {
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
  } catch (error) {
    // Schema loading failed - return null
    console.warn(
      `[Schema Registry] Failed to load schema for ${modelName}:`,
      error instanceof Error ? error.message : String(error),
    );
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
