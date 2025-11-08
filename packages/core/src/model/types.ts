/**
 * Sigmatics Model Types
 *
 * Core type definitions for the declarative model system.
 * Everything is a model: compiled from schemas, rewritten to IR,
 * fused by complexity class, and lowered to backend plans.
 */

import type { SgaElement } from '../sga/types';

/**
 * Complexity class determines fusion and backend selection strategy
 *
 * - C0: Fully compiled (no runtime degrees) - maximum fusion
 * - C1: Few runtime degrees - prefer class backend
 * - C2: Bounded mixed-grade/shape - selective SGA backend
 * - C3: General case - full SGA backend
 */
export type ComplexityClass = 'C0' | 'C1' | 'C2' | 'C3';

/**
 * Backend preference hints
 */
export type BackendPreference = 'class' | 'sga' | 'auto';

/**
 * Model descriptor schema
 * Declarative specification of an operation
 */
export interface ModelDescriptor {
  /** Unique name (e.g., "add96", "R", "project") */
  name: string;

  /** Semantic version */
  version: string;

  /** Namespace (e.g., "stdlib.ring", "stdlib.transforms") */
  namespace: string;

  /** Compiled parameters (frozen at compile time) */
  compiled: Record<string, unknown>;

  /** Runtime parameters (supplied at invocation) */
  runtime: Record<string, unknown>;

  /** Type and invariant constraints */
  constraints?: {
    types?: string[];
    invariants?: string[];
  };

  /** Complexity hint for fusion */
  complexityHint?: ComplexityClass;

  /** Backend selection hint */
  loweringHints?: {
    prefer?: BackendPreference;
  };
}

/**
 * IR Node types
 */
export type IRNode =
  | { kind: 'atom'; op: AtomOp }
  | { kind: 'seq'; left: IRNode; right: IRNode }
  | { kind: 'par'; left: IRNode; right: IRNode }
  | { kind: 'transform'; transform: TransformOp; child: IRNode };

/**
 * Atomic operations
 */
export type AtomOp =
  | { type: 'classLiteral'; value: number } // c<i>
  | { type: 'param'; name: string } // Runtime parameter reference
  | { type: 'lift'; classIndex: number } // lift(i)
  | { type: 'project'; grade: number } // project(k) - Clifford grade projection
  | { type: 'add96'; overflowMode: 'drop' | 'track' }
  | { type: 'sub96'; overflowMode: 'drop' | 'track' }
  | { type: 'mul96'; overflowMode: 'drop' | 'track' };

/**
 * Transform operations with compiled powers
 */
export type TransformOp =
  | { type: 'R'; k: number } // R^k (mod 4)
  | { type: 'D'; k: number } // D^k (mod 3)
  | { type: 'T'; k: number } // T^k (mod 8)
  | { type: 'M' }; // M (order 2)

/**
 * Backend execution plan
 */
export type BackendPlan =
  | { backend: 'class'; plan: ClassPlan }
  | { backend: 'sga'; plan: SgaPlan };

/**
 * Class backend plan (permutation/rank-1 fast path)
 */
export interface ClassPlan {
  kind: 'class';
  operations: ClassOperation[];
}

export type ClassOperation =
  | { type: 'add96'; overflowMode: 'drop' | 'track' }
  | { type: 'sub96'; overflowMode: 'drop' | 'track' }
  | { type: 'mul96'; overflowMode: 'drop' | 'track' }
  | { type: 'R'; k: number }
  | { type: 'D'; k: number }
  | { type: 'T'; k: number }
  | { type: 'M' }
  | { type: 'lift'; classIndex: number }
  | { type: 'projectClass' };

/**
 * SGA backend plan (algebraic foundation)
 */
export interface SgaPlan {
  kind: 'sga';
  operations: SgaOperation[];
}

export type SgaOperation =
  | { type: 'multiply' }
  | { type: 'add' }
  | { type: 'scale'; scalar: number }
  | { type: 'add96'; overflowMode: 'drop' | 'track' }
  | { type: 'sub96'; overflowMode: 'drop' | 'track' }
  | { type: 'mul96'; overflowMode: 'drop' | 'track' }
  | { type: 'R'; k: number }
  | { type: 'D'; k: number }
  | { type: 'T'; k: number }
  | { type: 'M' }
  | { type: 'projectGrade'; grade: number }
  | { type: 'lift'; classIndex: number }
  | { type: 'projectClass' };

/**
 * Compiled model artifact
 * Cached result of compilation
 */
export interface CompiledModel<T = unknown, R = unknown> {
  /** Model descriptor */
  descriptor: ModelDescriptor;

  /** Complexity class */
  complexity: ComplexityClass;

  /** Backend execution plan */
  plan: BackendPlan;

  /** Execute with runtime parameters */
  run(params: T): R;
}

/**
 * Runtime result types
 */
export interface RingResult {
  value: number; // 0..95
  overflow?: boolean;
}

export interface TransformResult {
  element: SgaElement | number; // SGA element or class index
}

export interface GradeProjectionResult {
  element: SgaElement;
}

export interface BridgeResult {
  element?: SgaElement;
  classIndex?: number | null;
}

/**
 * Model cache key
 */
export interface ModelCacheKey {
  name: string;
  version: string;
  compiledParams: string; // JSON.stringify of compiled params
}
