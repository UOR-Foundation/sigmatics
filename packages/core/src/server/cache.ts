/**
 * Model Cache
 *
 * Caches compiled model artifacts keyed by descriptor + schema hash.
 * Implements cache invalidation based on namespace, version, compiled params,
 * and schema content changes.
 */

import type { ModelDescriptor, CompiledModel } from '../model/types';
import { getSchema, computeSchemaHash } from '../model/schema-loader';

/**
 * In-memory cache for compiled models
 */
const modelCache = new Map<string, CompiledModel>();

/**
 * Generate cache key from model descriptor
 *
 * Cache key format: {namespace}/{name}@{version}#{schemaHash}:{compiledParams}
 *
 * Includes:
 * - namespace: For model isolation
 * - name@version: Model identity
 * - schemaHash: Schema content hash for cache invalidation
 * - compiledParams: Compiled-time parameters (serialized)
 */
export function getCacheKey(descriptor: ModelDescriptor): string {
  const { name, version, namespace, compiled } = descriptor;
  const compiledStr = JSON.stringify(compiled);

  // Get schema and compute hash for cache invalidation
  const schema = getSchema(name);
  const schemaHash = schema ? computeSchemaHash(schema) : 'no-schema';

  // Cache key: namespace/name@version#schemaHash:compiledParams
  return `${namespace}/${name}@${version}#${schemaHash}:${compiledStr}`;
}

/**
 * Get compiled model from cache
 */
export function get<T = unknown, R = unknown>(
  descriptor: ModelDescriptor,
): CompiledModel<T, R> | undefined {
  const cacheKey = getCacheKey(descriptor);
  const cached = modelCache.get(cacheKey);
  return cached as CompiledModel<T, R> | undefined;
}

/**
 * Store compiled model in cache
 */
export function set<T = unknown, R = unknown>(
  descriptor: ModelDescriptor,
  compiled: CompiledModel<T, R>,
): void {
  const cacheKey = getCacheKey(descriptor);
  modelCache.set(cacheKey, compiled);
}

/**
 * Clear all cached models
 */
export function clear(): void {
  modelCache.clear();
}

/**
 * Get cache statistics
 */
export function getStats(): { size: number; keys: string[] } {
  return {
    size: modelCache.size,
    keys: Array.from(modelCache.keys()),
  };
}

/**
 * Check if a model is cached
 */
export function has(descriptor: ModelDescriptor): boolean {
  const cacheKey = getCacheKey(descriptor);
  return modelCache.has(cacheKey);
}

/**
 * Delete a specific model from cache
 */
export function del(descriptor: ModelDescriptor): boolean {
  const cacheKey = getCacheKey(descriptor);
  return modelCache.delete(cacheKey);
}
