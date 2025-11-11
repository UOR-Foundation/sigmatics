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
  BackendPlan,
  RingResult,
  IRNode,
} from '../model/types';
import type { SgaElement } from '../sga/types';
import { normalize } from '../compiler/rewrites';
import { analyzeComplexity, selectBackend } from '../compiler/fuser';
import { lowerToClassBackend, executeClassPlan } from '../compiler/lowering/class-backend';
import { lowerToSgaBackend, executeSgaPlan } from '../compiler/lowering/sga-backend';
import * as IR from '../compiler/ir';
import { project } from '../bridge/project';
import { lift } from '../bridge/lift';
import { validateDescriptor } from '../model/schema-loader';
import * as cache from './cache';
import type { SemiprimeFactorization, FactorizationOptions } from '../compiler/factor-hierarchical-semiprime';

/**
 * Compile a model descriptor to an executable plan
 */
export function compileModel<T = unknown, R = unknown>(
  descriptor: ModelDescriptor,
): CompiledModel<T, R> {
  // Validate descriptor structure
  const validation = validateDescriptor(descriptor);
  if (!validation.valid) {
    throw new Error(
      `Invalid model descriptor for ${descriptor.name}: ${validation.errors.join(', ')}`,
    );
  }

  // Check cache first
  const cached = cache.get<T, R>(descriptor);
  if (cached) {
    return cached;
  }

  // Build IR from descriptor
  const ir = buildIR(descriptor);

  // Normalize IR
  const normalized = normalize(ir);

  // Analyze complexity
  const complexity = analyzeComplexity(normalized, descriptor.compiled);

  // Select backend
  const backendType = selectBackend(complexity, descriptor.loweringHints?.prefer);

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
      // For transforms, check if input type matches backend
      // If class backend but SGA input, or vice versa, convert
      const paramsRecord = params as Record<string, unknown>;

      // Check if this is a transform with an 'x' parameter
      if ('x' in paramsRecord && paramsRecord.x !== undefined) {
        const input = paramsRecord.x;
        const isSgaInput = typeof input === 'object' && input !== null;

        if (plan.backend === 'class' && isSgaInput) {
          // Class backend with SGA input: project → execute → lift
          const classInput = project(input as SgaElement);
          if (classInput === null) {
            throw new Error('Cannot project non-rank-1 element to class backend');
          }
          const classResult = executeClassPlan(plan.plan, { ...paramsRecord, x: classInput });
          return lift(classResult as number) as R;
        } else if (plan.backend === 'sga' && !isSgaInput) {
          // SGA backend with class input: lift → execute → project
          const sgaInput = lift(input as number);
          const sgaResult = executeSgaPlan(plan.plan, { ...paramsRecord, x: sgaInput });
          const projected = project(sgaResult as SgaElement);
          return (projected !== null ? projected : sgaResult) as R;
        }
      }

      // Normal execution path
      if (plan.backend === 'class') {
        return executeClassPlan(plan.plan, paramsRecord) as R;
      } else {
        return executeSgaPlan(plan.plan, paramsRecord) as R;
      }
    },
  };

  // Cache and return
  cache.set(descriptor, compiled);
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

  if (name === 'projectClass') {
    // Project SGA element back to class index (runtime parameter)
    return IR.projectClass(IR.param('x'));
  }

  // Arithmetic operations
  if (name === 'gcd96') {
    return IR.gcd96();
  }

  if (name === 'lcm96') {
    return IR.lcm96();
  }

  // Reduction operations
  if (name === 'sum') {
    return IR.sum();
  }

  if (name === 'product') {
    return IR.product();
  }

  if (name === 'max') {
    return IR.max();
  }

  if (name === 'min') {
    return IR.min();
  }

  // Factorization operations
  if (name === 'factor96') {
    // FUSION: If 'n' is provided as compiled parameter, fold at compile time
    if ('n' in compiled && typeof compiled.n === 'number') {
      // Import from class-backend to get the factorization function
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const backend = require('../compiler/lowering/class-backend');
      const nVal = (compiled.n as number) % 96;
      const factors = backend.computeFactor96(nVal);

      // Return constant array IR node - this is the fusion!
      return IR.constantArray(factors);
    }

    // Fallback: runtime lookup
    return IR.factor96();
  }

  if (name === 'factorHierarchical') {
    // FUSION: If 'n' is provided as compiled parameter, fold at compile time
    if ('n' in compiled && typeof compiled.n === 'string') {
      // Import hierarchical factorization implementation
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const backend = require('../compiler/factor-hierarchical-semiprime');
      const nVal = BigInt(compiled.n as string);
      const options: FactorizationOptions = {
        beamWidth: compiled.beamWidth as number | undefined,
        epsilon: compiled.epsilon as number | undefined,
        maxLevels: compiled.maxLevels as number | undefined,
        scoringFunction: compiled.scoringFunction as 'constraint_satisfaction' | 'orbit_distance' | 'hybrid' | undefined,
        adaptiveBeam: compiled.adaptiveBeam as boolean | undefined,
        validateF4: compiled.validateF4 as boolean | undefined,
        pruningStrategy: compiled.pruningStrategy as 'aggressive' | 'conservative' | 'categorical' | undefined,
      };
      const result = backend.factorSemiprime(nVal, options);

      // Return constant result IR node - this is the fusion!
      return IR.constant(result);
    }

    // Fallback: runtime execution
    return IR.factorHierarchical();
  }

  if (name === 'isPrime96') {
    return IR.isPrime96();
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

  projectClass: () =>
    compileModel<{ x: SgaElement }, number | null>({
      name: 'projectClass',
      version: '1.0.0',
      namespace: 'stdlib.bridge',
      compiled: {},
      runtime: { x: {} },
      complexityHint: 'C1',
      loweringHints: { prefer: 'sga' },
    }),

  /**
   * Arithmetic operations
   */
  gcd96: () =>
    compileModel<{ a: number; b: number }, number>({
      name: 'gcd96',
      version: '1.0.0',
      namespace: 'stdlib.arithmetic',
      compiled: {},
      runtime: { a: 0, b: 0 },
      complexityHint: 'C1',
      loweringHints: { prefer: 'class' },
    }),

  lcm96: () =>
    compileModel<{ a: number; b: number }, number>({
      name: 'lcm96',
      version: '1.0.0',
      namespace: 'stdlib.arithmetic',
      compiled: {},
      runtime: { a: 0, b: 0 },
      complexityHint: 'C1',
      loweringHints: { prefer: 'class' },
    }),

  /**
   * Reduction operations
   */
  sum: () =>
    compileModel<{ values: number[] }, number>({
      name: 'sum',
      version: '1.0.0',
      namespace: 'stdlib.reduction',
      compiled: {},
      runtime: { values: [] },
      complexityHint: 'C1',
      loweringHints: { prefer: 'class' },
    }),

  product: () =>
    compileModel<{ values: number[] }, number>({
      name: 'product',
      version: '1.0.0',
      namespace: 'stdlib.reduction',
      compiled: {},
      runtime: { values: [] },
      complexityHint: 'C1',
      loweringHints: { prefer: 'class' },
    }),

  max: () =>
    compileModel<{ values: number[] }, number>({
      name: 'max',
      version: '1.0.0',
      namespace: 'stdlib.reduction',
      compiled: {},
      runtime: { values: [] },
      complexityHint: 'C1',
      loweringHints: { prefer: 'class' },
    }),

  min: () =>
    compileModel<{ values: number[] }, number>({
      name: 'min',
      version: '1.0.0',
      namespace: 'stdlib.reduction',
      compiled: {},
      runtime: { values: [] },
      complexityHint: 'C1',
      loweringHints: { prefer: 'class' },
    }),

  /**
   * Factorization operations
   */
  factor96: (n?: number) => {
    if (n !== undefined) {
      // Compile-time constant: FUSION enabled!
      const fused = compileModel<Record<string, never>, number[]>({
        name: 'factor96',
        version: '1.0.0',
        namespace: 'stdlib.factorization',
        compiled: { n }, // ← Compile-time parameter
        runtime: {}, // ← No runtime parameters!
        complexityHint: 'C0', // ← Fully compiled!
        loweringHints: { prefer: 'class' },
      });
      // Cast to compatible type for ease of use
      return fused as unknown as CompiledModel<{ n: number }, number[]>;
    }

    // Runtime parameter: standard path
    return compileModel<{ n: number }, number[]>({
      name: 'factor96',
      version: '1.0.0',
      namespace: 'stdlib.factorization',
      compiled: {},
      runtime: { n: 0 },
      complexityHint: 'C1',
      loweringHints: { prefer: 'class' },
    });
  },

  /**
   * Hierarchical semiprime factorization
   * Uses base-96 decomposition with categorical invariants
   * Optimal for 40-100 bit semiprimes
   */
  factorHierarchical: (n?: string, options?: FactorizationOptions) => {
    if (n !== undefined) {
      // Compile-time constant with options: FUSION enabled!
      const fused = compileModel<Record<string, never>, SemiprimeFactorization>({
        name: 'factorHierarchical',
        version: '1.0.0',
        namespace: 'stdlib.factorization',
        compiled: {
          n,
          beamWidth: options?.beamWidth ?? 32, // φ(96), proven optimal
          epsilon: options?.epsilon ?? 10, // Universal invariant
          maxLevels: options?.maxLevels,
          scoringFunction: options?.scoringFunction ?? 'hybrid',
          adaptiveBeam: options?.adaptiveBeam ?? false,
          validateF4: options?.validateF4 ?? true,
          pruningStrategy: options?.pruningStrategy ?? 'categorical',
        },
        runtime: {},
        complexityHint: 'C0', // Fully compiled when n is constant
        loweringHints: {
          prefer: 'class',
          categoricalInvariants: {
            useEpsilonBound: true,
            useOrbitClosure: true,
            useF4Structure: true,
            useMonoidalComposition: true,
          },
        },
      });
      return fused as unknown as CompiledModel<
        { n: string; options?: FactorizationOptions },
        SemiprimeFactorization
      >;
    }

    // Runtime parameter: standard path
    return compileModel<
      { n: string; options?: FactorizationOptions },
      SemiprimeFactorization
    >({
      name: 'factorHierarchical',
      version: '1.0.0',
      namespace: 'stdlib.factorization',
      compiled: {
        beamWidth: options?.beamWidth ?? 32,
        epsilon: options?.epsilon ?? 10,
        scoringFunction: options?.scoringFunction ?? 'hybrid',
        adaptiveBeam: options?.adaptiveBeam ?? false,
        validateF4: options?.validateF4 ?? true,
        pruningStrategy: options?.pruningStrategy ?? 'categorical',
      },
      runtime: { n: '0', options },
      complexityHint: 'C1', // Runtime n parameter
      loweringHints: {
        prefer: 'auto',
        categoricalInvariants: {
          useEpsilonBound: true,
          useOrbitClosure: true,
          useF4Structure: true,
          useMonoidalComposition: true,
        },
      },
    });
  },

  isPrime96: () =>
    compileModel<{ n: number }, boolean>({
      name: 'isPrime96',
      version: '1.0.0',
      namespace: 'stdlib.factorization',
      compiled: {},
      runtime: { n: 0 },
      complexityHint: 'C1',
      loweringHints: { prefer: 'class' },
    }),
};

/**
 * Clear the model cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return cache.getStats();
}
