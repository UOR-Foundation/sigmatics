/**
 * Class Backend (Permutation Fast Path)
 *
 * Executes IR using class-level operations:
 * - Ring ops: integer arithmetic mod 96
 * - Transforms: permutations via ℝ[ℤ₄]/ℝ[ℤ₃] powers and ℓ-rotation
 * - Bridge: lift/project for rank-1 elements
 *
 * This is the fast path for rank-1/class-pure operations.
 */

import type { IRNode, ClassPlan, ClassOperation, RingResult } from '../../model/types';
import { decodeClassIndex, componentsToClassIndex } from '../../class-system/class';
import { lift } from '../../bridge/lift';

/**
 * Lower IR to class backend plan
 */
export function lowerToClassBackend(node: IRNode): ClassPlan {
  const operations = collectClassOperations(node);
  return {
    kind: 'class',
    operations,
  };
}

/**
 * Collect class operations from normalized IR
 */
function collectClassOperations(node: IRNode): ClassOperation[] {
  const ops: ClassOperation[] = [];

  function visit(n: IRNode): void {
    switch (n.kind) {
      case 'atom': {
        const op = n.op;
        switch (op.type) {
          case 'classLiteral':
            // No operation needed - value is directly available
            break;
          case 'param':
            // Runtime parameter - resolved at execution time from inputs
            break;
          case 'lift':
            ops.push({ type: 'lift', classIndex: op.classIndex });
            break;
          case 'add96':
            ops.push({ type: 'add96', overflowMode: op.overflowMode });
            break;
          case 'sub96':
            ops.push({ type: 'sub96', overflowMode: op.overflowMode });
            break;
          case 'mul96':
            ops.push({ type: 'mul96', overflowMode: op.overflowMode });
            break;
          case 'gcd96':
            ops.push({ type: 'gcd96' });
            break;
          case 'lcm96':
            ops.push({ type: 'lcm96' });
            break;
          case 'sum':
            ops.push({ type: 'sum' });
            break;
          case 'product':
            ops.push({ type: 'product' });
            break;
          case 'max':
            ops.push({ type: 'max' });
            break;
          case 'min':
            ops.push({ type: 'min' });
            break;
          case 'factor96':
            ops.push({ type: 'factor96' });
            break;
          case 'isPrime96':
            ops.push({ type: 'isPrime96' });
            break;
          case 'project':
            // Grade projection not supported in class backend
            // This should have been caught by backend selection
            throw new Error('Grade projection requires SGA backend');
        }
        break;
      }
      case 'seq':
        visit(n.left);
        visit(n.right);
        break;
      case 'par':
        visit(n.left);
        visit(n.right);
        break;
      case 'transform': {
        const t = n.transform;
        if (t.type === 'R') ops.push({ type: 'R', k: t.k });
        else if (t.type === 'D') ops.push({ type: 'D', k: t.k });
        else if (t.type === 'T') ops.push({ type: 'T', k: t.k });
        else if (t.type === 'M') ops.push({ type: 'M' });
        visit(n.child);
        break;
      }
    }
  }

  visit(node);
  return ops;
}

/**
 * Execute a class backend plan
 */
/**
 * Execute the class backend plan
 *
 * Invariants and fast-paths:
 * - Ring operations (add96/sub96/mul96) with overflowMode='track' return a
 *   RingResult immediately after computing the value. This "early return"
 *   is intentional: ring ops are terminal in class plans produced by the
 *   fuser for C0/C1 models (no subsequent transforms apply to RingResult).
 * - Transform operations (R/D/T/M) act on a numeric class index in `state`.
 * - lift is terminal as it switches to SGA domain; class plans only contain
 *   a single lift at the tail when lowering a pure bridge model.
 *
 * The fuser guarantees plan shape so that no operation requiring a class
 * index appears after a terminal RingResult or lift. See fuser.ts for details.
 */
export function executeClassPlan(plan: ClassPlan, inputs: Record<string, unknown>): unknown {
  let state: number | undefined = undefined;

  for (const op of plan.operations) {
    switch (op.type) {
      case 'add96': {
        const aVal: number = (inputs.a as number) ?? state ?? 0;
        const bVal: number = (inputs.b as number) ?? 0;
        const sumVal: number = aVal + bVal;
        const resultValue: number = sumVal % 96;
        const hasOverflow: boolean = sumVal >= 96;

        if (op.overflowMode === 'track') {
          state = resultValue;
          return { value: resultValue, overflow: hasOverflow } as RingResult;
        } else {
          state = resultValue;
        }
        break;
      }

      case 'sub96': {
        const aVal: number = (inputs.a as number) ?? state ?? 0;
        const bVal: number = (inputs.b as number) ?? 0;
        const diffVal: number = aVal - bVal;
        const resultValue: number = ((diffVal % 96) + 96) % 96;
        const hasOverflow: boolean = diffVal < 0;

        if (op.overflowMode === 'track') {
          state = resultValue;
          return { value: resultValue, overflow: hasOverflow } as RingResult;
        } else {
          state = resultValue;
        }
        break;
      }

      case 'mul96': {
        const aVal: number = (inputs.a as number) ?? state ?? 0;
        const bVal: number = (inputs.b as number) ?? 0;
        const prodVal: number = aVal * bVal;
        const resultValue: number = prodVal % 96;
        const hasOverflow: boolean = prodVal >= 96;

        if (op.overflowMode === 'track') {
          state = resultValue;
          return { value: resultValue, overflow: hasOverflow } as RingResult;
        } else {
          state = resultValue;
        }
        break;
      }

      case 'R': {
        const classIndex = (inputs.x as number) ?? state ?? 0;
        state = applyRTransform(classIndex, op.k);
        break;
      }

      case 'D': {
        const classIndex = (inputs.x as number) ?? state ?? 0;
        state = applyDTransform(classIndex, op.k);
        break;
      }

      case 'T': {
        const classIndex = (inputs.x as number) ?? state ?? 0;
        state = applyTTransform(classIndex, op.k);
        break;
      }

      case 'M': {
        const classIndex = (inputs.x as number) ?? state ?? 0;
        state = applyMTransform(classIndex);
        break;
      }

      case 'lift': {
        // Lift operation: convert class index to SGA element
        return lift(op.classIndex);
      }

      case 'projectClass': {
        // Already in class form
        break;
      }

      case 'gcd96': {
        const aVal: number = (inputs.a as number) ?? state ?? 0;
        const bVal: number = (inputs.b as number) ?? 0;
        state = computeGcd96(aVal % 96, bVal % 96);
        break;
      }

      case 'lcm96': {
        const aVal: number = (inputs.a as number) ?? state ?? 0;
        const bVal: number = (inputs.b as number) ?? 0;
        state = computeLcm96(aVal % 96, bVal % 96);
        break;
      }

      case 'sum': {
        const values: number[] = (inputs.values as number[]) ?? [];
        state = values.reduce((acc, v) => (acc + v) % 96, 0);
        break;
      }

      case 'product': {
        const values: number[] = (inputs.values as number[]) ?? [];
        state = values.reduce((acc, v) => (acc * v) % 96, 1);
        break;
      }

      case 'max': {
        const values: number[] = (inputs.values as number[]) ?? [];
        if (values.length === 0) {
          state = 0;
        } else {
          state = Math.max(...values.map((v) => v % 96));
        }
        break;
      }

      case 'min': {
        const values: number[] = (inputs.values as number[]) ?? [];
        if (values.length === 0) {
          state = 0;
        } else {
          state = Math.min(...values.map((v) => v % 96));
        }
        break;
      }

      case 'factor96': {
        const nVal: number = ((inputs.n as number) ?? state ?? 0) % 96;
        return computeFactor96(nVal);
      }

      case 'isPrime96': {
        const nVal: number = ((inputs.n as number) ?? state ?? 0) % 96;
        return computeIsPrime96(nVal);
      }
    }
  }

  return state ?? { value: 0 };
}

/**
 * Apply R transform to a class index
 * R: left multiply by r (increment h₂)
 */
function applyRTransform(classIndex: number, k: number): number {
  const { h2, d, l } = decodeClassIndex(classIndex);
  const newH2 = ((h2 + k) % 4) as 0 | 1 | 2 | 3;
  return componentsToClassIndex({ h2: newH2, d, l });
}

/**
 * Apply D transform to a class index
 * D: right multiply by τ (increment d)
 */
function applyDTransform(classIndex: number, k: number): number {
  const { h2, d, l } = decodeClassIndex(classIndex);
  const newD = ((d + k) % 3) as 0 | 1 | 2;
  return componentsToClassIndex({ h2, d: newD, l });
}

/**
 * Apply T transform to a class index
 * T: rotate ℓ on 8-cycle (scalar ↔ e₁…e₇ ↔ scalar)
 */
function applyTTransform(classIndex: number, k: number): number {
  const { h2, d, l } = decodeClassIndex(classIndex);
  const newL = ((l + k) % 8) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  return componentsToClassIndex({ h2, d, l: newL });
}

/**
 * Apply M transform to a class index
 * M: mirror (τ → τ⁻¹, i.e., d → -d mod 3)
 */
function applyMTransform(classIndex: number): number {
  const { h2, d, l } = decodeClassIndex(classIndex);
  // M inverts d: 0→0, 1→2, 2→1
  const newD = d === 0 ? 0 : ((3 - d) as 1 | 2);
  return componentsToClassIndex({ h2, d: newD as 0 | 1 | 2, l });
}

/**
 * Compute GCD in ℤ₉₆
 * Uses Euclidean algorithm mod 96
 */
function computeGcd96(a: number, b: number): number {
  let x = a % 96;
  let y = b % 96;

  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }

  return x;
}

/**
 * Compute LCM in ℤ₉₆
 * LCM(a, b) = (a * b) / GCD(a, b)
 */
function computeLcm96(a: number, b: number): number {
  const aVal = a % 96;
  const bVal = b % 96;

  if (aVal === 0 || bVal === 0) {
    return 0;
  }

  const gcd = computeGcd96(aVal, bVal);
  return ((aVal * bVal) / gcd) % 96;
}

/**
 * Primes in ℤ₉₆
 * Since 96 = 2^5 × 3, only numbers coprime to 96 can be considered "prime"
 * in this ring. These are numbers whose GCD with 96 is 1.
 */
const PRIMES_96 = [
  1, 5, 7, 11, 13, 17, 19, 23, 25, 29, 31, 35, 37, 41, 43, 47, 49, 53, 55, 59, 61, 65, 67, 71, 73,
  77, 79, 83, 85, 89, 91, 95,
];

/**
 * Check if a number is prime in ℤ₉₆
 * A number is "prime" in ℤ₉₆ if it's coprime to 96 (i.e., GCD(n, 96) = 1)
 */
function computeIsPrime96(n: number): boolean {
  const nVal = n % 96;
  return PRIMES_96.includes(nVal);
}

/**
 * Factor a number in ℤ₉₆
 * This finds the prime factorization using primes that are coprime to 96
 *
 * Note: In ℤ₉₆, factorization is not unique for all elements.
 * We return the "standard" factorization using the smallest primes.
 */
function computeFactor96(n: number): number[] {
  const nVal = n % 96;

  if (nVal === 0) {
    return [0];
  }

  if (nVal === 1) {
    return [1];
  }

  // For perfect factorization, we use trial division with primes coprime to 96
  const factors: number[] = [];
  let remaining = nVal;

  // Try each prime in ℤ₉₆
  for (const p of PRIMES_96) {
    if (p === 1) continue; // Skip 1

    while (remaining % p === 0 && remaining > 1) {
      factors.push(p);
      remaining = (remaining / p) % 96;

      // Avoid infinite loops
      if (factors.length > 100) {
        break;
      }
    }

    if (remaining === 1) {
      break;
    }
  }

  // If we couldn't factor it completely, return what we have
  if (remaining > 1 && factors.length === 0) {
    return [nVal];
  }

  return factors.length > 0 ? factors : [nVal];
}
