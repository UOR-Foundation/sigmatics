/**
 * Schema Loader & Validator
 *
 * Provides runtime validation of model descriptors against JSON schemas.
 * Uses AJV for full JSON-Schema compliance.
 */

import Ajv from 'ajv';
import type { ModelDescriptor } from './types';
import { getSchemaByName } from './schema-registry';

// Initialize AJV validator
const ajv = new Ajv({ strict: true, allErrors: true });

/**
 * Get schema for a model by name
 */
export function getSchema(modelName: string): object | null {
  return getSchemaByName(modelName);
}

/**
 * Compute hash of schema for cache invalidation
 */
export function computeSchemaHash(schema: object): string {
  const schemaStr = JSON.stringify(schema);
  let hash = 0;
  for (let i = 0; i < schemaStr.length; i++) {
    const char = schemaStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Validate a model descriptor
 *
 * Performs both structural validation and JSON-Schema validation.
 */
export function validateDescriptor(descriptor: ModelDescriptor): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Structural validation
  if (!descriptor.name) {
    errors.push('Missing required field: name');
  }
  if (!descriptor.version) {
    errors.push('Missing required field: version');
  }
  if (!descriptor.namespace) {
    errors.push('Missing required field: namespace');
  }

  // Validate semver format
  if (descriptor.version && !/^\d+\.\d+\.\d+$/.test(descriptor.version)) {
    errors.push(`Invalid semver format: ${descriptor.version}`);
  }

  // Validate complexityHint if present
  if (
    descriptor.complexityHint &&
    !['C0', 'C1', 'C2', 'C3'].includes(descriptor.complexityHint)
  ) {
    errors.push(`Invalid complexityHint: ${descriptor.complexityHint}`);
  }

  // JSON-Schema validation
  const schema = getSchema(descriptor.name);
  if (schema) {
    try {
      // Strip $schema field to avoid meta-schema validation issues
      // AJV uses draft-07 by default; our schemas use draft-2020-12
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schemaWithoutMeta = { ...(schema as any) };
      delete schemaWithoutMeta.$schema;

      const validate = ajv.compile(schemaWithoutMeta);
      const valid = validate(descriptor);

      if (!valid && validate.errors) {
        for (const error of validate.errors) {
          const path = error.instancePath || 'root';
          const message = error.message || 'validation failed';
          errors.push(`Schema validation at ${path}: ${message}`);
        }
      }
    } catch (error) {
      errors.push(
        `Schema compilation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } else {
    // Warning only - schema not found doesn't fail validation
    // This allows for custom models without schemas
    console.warn(`[Schema Loader] No schema found for model: ${descriptor.name}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
