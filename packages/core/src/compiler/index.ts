/**
 * Compiler Module
 *
 * Exports the Sigmatics model compiler components:
 * - IR builders
 * - Rewrite system
 * - Fusion analyzer
 * - Backend lowering
 */

export * from './ir';
export * from './rewrites';
export * from './fuser';
export * from './lowering/class-backend';
export * from './lowering/sga-backend';
