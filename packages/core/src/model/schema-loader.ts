/**
 * Schema Validator
 *
 * Validates model descriptors for structural correctness.
 * TypeScript provides compile-time type checking; this adds runtime validation.
 */

import type { ModelDescriptor } from './types';

/**
 * Simple structural validator
 * Validates basic structure and required fields
 */
export function validateDescriptor(descriptor: ModelDescriptor): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!descriptor.name || typeof descriptor.name !== 'string') {
    errors.push('Missing or invalid "name" field');
  }
  if (!descriptor.version || typeof descriptor.version !== 'string') {
    errors.push('Missing or invalid "version" field');
  }
  if (!descriptor.namespace || typeof descriptor.namespace !== 'string') {
    errors.push('Missing or invalid "namespace" field');
  }

  // Validate version format (semver)
  if (descriptor.version && !/^\d+\.\d+\.\d+$/.test(descriptor.version)) {
    errors.push(`Invalid version format: ${descriptor.version} (expected semver)`);
  }

  // Check compiled params object exists
  if (!descriptor.compiled || typeof descriptor.compiled !== 'object') {
    errors.push('Missing or invalid "compiled" parameters');
  }

  // Check runtime params object exists
  if (!descriptor.runtime || typeof descriptor.runtime !== 'object') {
    errors.push('Missing or invalid "runtime" parameters');
  }

  // Validate complexityHint if present
  if (descriptor.complexityHint) {
    const validHints = ['C0', 'C1', 'C2', 'C3'];
    if (!validHints.includes(descriptor.complexityHint)) {
      errors.push(`Invalid complexityHint: ${descriptor.complexityHint}`);
    }
  }

  // Validate loweringHints if present
  if (descriptor.loweringHints) {
    if (descriptor.loweringHints.prefer) {
      const validPrefs = ['class', 'sga', 'auto'];
      if (!validPrefs.includes(descriptor.loweringHints.prefer)) {
        errors.push(`Invalid loweringHints.prefer: ${descriptor.loweringHints.prefer}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Compute content hash of an object for cache keying
 */
export function computeSchemaHash(schema: object): string {
  // Simple hash using JSON stringification
  const schemaStr = JSON.stringify(schema);
  let hash = 0;
  for (let i = 0; i < schemaStr.length; i++) {
    const char = schemaStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get schema stub for a model (returns empty object)
 * In production, schemas are embedded in TypeScript types
 */
export function getSchema(_modelName: string): object | null {
  // Return null - schemas are compile-time only via TypeScript
  return null;
}
