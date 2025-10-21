/**
 * Atlas Sigil Algebra - Main Entry Point
 *
 * This is the main module that exports everything you need.
 *
 * @example Basic usage
 * ```typescript
 * import Atlas from './index';
 * const result = Atlas.evaluate("mark@c21");
 * console.log(result.literal.bytes);
 * ```
 *
 * @example Named imports
 * ```typescript
 * import { Atlas, tokenize, parse, evaluateLiteral } from './index';
 * ```
 */

// Main API
export { default, Atlas } from './atlas';

// Types
export * from './atlas-types';

// Core modules
export * from './atlas-class';
export * from './atlas-lexer';
export * from './atlas-parser';
export * from './atlas-evaluator';

// FIX: Removed redundant and erroneous second default export.
// The export on line 13 already handles re-exporting the default.
