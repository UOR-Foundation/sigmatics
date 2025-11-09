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
