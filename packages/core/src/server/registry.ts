/**
 * Model Registry & Server
 *
 * Central registry for all Sigmatics models.
 * Compiles models from descriptors, caches compiled artifacts,
 * and executes backend plans.
 */

import type {
  ModelDescriptor,
  CompiledModel,
  ComplexityClass,
  BackendPlan,
  ModelCacheKey,
  RingResult,
  IRNode,
} from '../model/types';
import type { SgaElement } from '../sga/types';
import { normalize } from '../compiler/rewrites';
import { analyzeComplexity, selectBackend } from '../compiler/fuser';
import {
  lowerToClassBackend,
  executeClassPlan,
} from '../compiler/lowering/class-backend';
import {
  lowerToSgaBackend,
  executeSgaPlan,
} from '../compiler/lowering/sga-backend';
import * as IR from '../compiler/ir';

/**
 * Model cache for compiled artifacts
 */
const modelCache = new Map<string, CompiledModel>();

/**
 * Generate cache key from model descriptor
 */
function getCacheKey(descriptor: ModelDescriptor): string {
  const { name, version, compiled } = descriptor;
  const compiledStr = JSON.stringify(compiled);
  return `${name}@${version}:${compiledStr}`;
}

/**
 * Compile a model descriptor to an executable plan
 */
export function compileModel<T = unknown, R = unknown>(
  descriptor: ModelDescriptor,
): CompiledModel<T, R> {
  // Check cache first
  const cacheKey = getCacheKey(descriptor);
  const cached = modelCache.get(cacheKey);
  if (cached) {
    return cached as CompiledModel<T, R>;
  }

  // Build IR from descriptor
  const ir = buildIR(descriptor);

  // Normalize IR
  const normalized = normalize(ir);

  // Analyze complexity
  const complexity = analyzeComplexity(normalized, descriptor.compiled);

  // Select backend
  const backendType = selectBackend(
    complexity,
    descriptor.loweringHints?.prefer,
  );

  // Lower to backend plan
  const plan: BackendPlan =
    backendType === 'class'
      ? { backend: 'class', plan: lowerToClassBackend(normalized) }
      : { backend: 'sga', plan: lowerToSgaBackend(normalized) };

  // Create compiled model
  const compiled: CompiledModel<T, R> = {
    descriptor,
    complexity,
    plan,
    run(params: T): R {
      if (plan.backend === 'class') {
        return executeClassPlan(plan.plan, params as Record<string, unknown>) as R;
      } else {
        return executeSgaPlan(plan.plan, params as Record<string, unknown>) as R;
      }
    },
  };

  // Cache and return
  modelCache.set(cacheKey, compiled);
  return compiled;
}

/**
 * Build IR from model descriptor
 */
function buildIR(descriptor: ModelDescriptor): IRNode {
  const { name, compiled } = descriptor;

  // Ring operations
  if (name === 'add96') {
    const overflowMode = (compiled.overflowMode as 'drop' | 'track') ?? 'drop';
    return IR.add96(overflowMode);
  }

  if (name === 'sub96') {
    const overflowMode = (compiled.overflowMode as 'drop' | 'track') ?? 'drop';
    return IR.sub96(overflowMode);
  }

  if (name === 'mul96') {
    const overflowMode = (compiled.overflowMode as 'drop' | 'track') ?? 'drop';
    return IR.mul96(overflowMode);
  }

  // Transforms
  if (name === 'R') {
    const k = (compiled.k as number) ?? 1;
    const kNormalized = ((k % 4) + 4) % 4;
    return IR.R(IR.param('x'), kNormalized);
  }

  if (name === 'D') {
    const k = (compiled.k as number) ?? 1;
    const kNormalized = ((k % 3) + 3) % 3;
    return IR.D(IR.param('x'), kNormalized);
  }

  if (name === 'T') {
    const k = (compiled.k as number) ?? 1;
    const kNormalized = ((k % 8) + 8) % 8;
    return IR.T(IR.param('x'), kNormalized);
  }

  if (name === 'M') {
    return IR.M(IR.param('x'));
  }

  // Grade operations
  if (name === 'project') {
    const grade = (compiled.grade as number) ?? 0;
    return IR.projectGrade(grade);
  }

  // Bridge operations
  if (name === 'lift') {
    const classIndex = (compiled.classIndex as number) ?? 0;
    return IR.lift(classIndex);
  }

  throw new Error(`Unknown model: ${name}`);
}

/**
 * Stdlib model definitions
 */
export const StdlibModels = {
  /**
   * Ring operations
   */
  add96: (overflowMode: 'drop' | 'track' = 'drop') =>
    compileModel<{ a: number; b: number }, RingResult>({
      name: 'add96',
      version: '1.0.0',
      namespace: 'stdlib.ring',
      compiled: { overflowMode },
      runtime: { a: 0, b: 0 },
      complexityHint: 'C1',
      loweringHints: { prefer: 'class' },
    }),

  sub96: (overflowMode: 'drop' | 'track' = 'drop') =>
    compileModel<{ a: number; b: number }, RingResult>({
      name: 'sub96',
      version: '1.0.0',
      namespace: 'stdlib.ring',
      compiled: { overflowMode },
      runtime: { a: 0, b: 0 },
      complexityHint: 'C1',
      loweringHints: { prefer: 'class' },
    }),

  mul96: (overflowMode: 'drop' | 'track' = 'drop') =>
    compileModel<{ a: number; b: number }, RingResult>({
      name: 'mul96',
      version: '1.0.0',
      namespace: 'stdlib.ring',
      compiled: { overflowMode },
      runtime: { a: 0, b: 0 },
      complexityHint: 'C1',
      loweringHints: { prefer: 'class' },
    }),

  /**
   * Transforms
   */
  R: (k = 1) =>
    compileModel<{ x: number | SgaElement }, number | SgaElement>({
      name: 'R',
      version: '1.0.0',
      namespace: 'stdlib.transforms',
      compiled: { k },
      runtime: { x: 0 },
      complexityHint: 'C1',
      loweringHints: { prefer: 'auto' },
    }),

  D: (k = 1) =>
    compileModel<{ x: number | SgaElement }, number | SgaElement>({
      name: 'D',
      version: '1.0.0',
      namespace: 'stdlib.transforms',
      compiled: { k },
      runtime: { x: 0 },
      complexityHint: 'C1',
      loweringHints: { prefer: 'auto' },
    }),

  T: (k = 1) =>
    compileModel<{ x: number | SgaElement }, number | SgaElement>({
      name: 'T',
      version: '1.0.0',
      namespace: 'stdlib.transforms',
      compiled: { k },
      runtime: { x: 0 },
      complexityHint: 'C1',
      loweringHints: { prefer: 'auto' },
    }),

  M: () =>
    compileModel<{ x: number | SgaElement }, number | SgaElement>({
      name: 'M',
      version: '1.0.0',
      namespace: 'stdlib.transforms',
      compiled: {},
      runtime: { x: 0 },
      complexityHint: 'C1',
      loweringHints: { prefer: 'auto' },
    }),

  /**
   * Grade operations
   */
  projectGrade: (grade: number) =>
    compileModel<{ x: SgaElement }, SgaElement>({
      name: 'project',
      version: '1.0.0',
      namespace: 'stdlib.grade',
      compiled: { grade },
      runtime: { x: {} },
      complexityHint: 'C2',
      loweringHints: { prefer: 'sga' },
    }),

  /**
   * Bridge operations
   */
  lift: (classIndex: number) =>
    compileModel<Record<string, never>, SgaElement>({
      name: 'lift',
      version: '1.0.0',
      namespace: 'stdlib.bridge',
      compiled: { classIndex },
      runtime: {},
      complexityHint: 'C0',
      loweringHints: { prefer: 'auto' },
    }),
};

/**
 * Clear the model cache
 */
export function clearCache(): void {
  modelCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: modelCache.size,
    keys: Array.from(modelCache.keys()),
  };
}
