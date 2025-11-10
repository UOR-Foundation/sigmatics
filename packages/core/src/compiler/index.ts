/**
 * Compiler Module
 *
 * Exports the Sigmatics model compiler components:
 * - IR builders
 * - Rewrite system
 * - Fusion analyzer
 * - Backend lowering
 * - Orbit tables (E₇ structure)
 * - Hierarchical factorization (arbitrary precision)
 * - E₇ matrix representation (96×96, rank 133)
 */

export * from './ir';
export * from './rewrites';
export * from './fuser';
export * from './lowering/class-backend';
export * from './lowering/sga-backend';
export * from './orbit-tables';
export * from './hierarchical';
export * from './e7-matrix';
