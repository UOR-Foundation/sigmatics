/**
 * SGA Backend (Algebraic Foundation)
 *
 * Executes IR using SGA operations:
 * - Multiply/Add/Scale via tensor product
 * - Transforms via automorphisms
 * - Grade projections via Clifford algebra
 * - Bridge: lift/project using SGA primitives
 *
 * This backend provides full algebraic semantics for correctness.
 */

import type { IRNode, SgaPlan, SgaOperation } from '../../model/types';
import type { SgaElement } from '../../sga/types';
import { sgaMultiply, sgaAdd, sgaScale } from '../../sga/sga-element';
import {
  transformRPower,
  transformDPower,
  transformTPower,
  transformM,
} from '../../sga/transforms';
import { gradeProject } from '../../sga/clifford';
import { project } from '../../bridge/project';
import { lift } from '../../bridge/lift';

/**
 * Lower IR to SGA backend plan
 */
export function lowerToSgaBackend(node: IRNode): SgaPlan {
  const operations = collectSgaOperations(node);
  return {
    kind: 'sga',
    operations,
  };
}

/**
 * Collect SGA operations from normalized IR
 */
function collectSgaOperations(node: IRNode): SgaOperation[] {
  const ops: SgaOperation[] = [];

  function visit(n: IRNode): void {
    switch (n.kind) {
      case 'atom': {
        const op = n.op;
        switch (op.type) {
          case 'classLiteral':
            // Lift to SGA
            ops.push({ type: 'lift', classIndex: op.value });
            break;
          case 'param':
            // Runtime parameter - resolved at execution time from inputs
            break;
          case 'lift':
            ops.push({ type: 'lift', classIndex: op.classIndex });
            break;
          case 'project':
            ops.push({ type: 'projectGrade', grade: op.grade });
            break;
          case 'projectClass':
            // projectClass: SGA element → class index (handled via bridge function)
            ops.push({ type: 'projectClass' });
            if (op.child) visit(op.child);
            break;
          case 'add96':
            // Ring ops use class-level mod-96 arithmetic
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
 * Execute an SGA backend plan
 */
export function executeSgaPlan(plan: SgaPlan, inputs: Record<string, unknown>): unknown {
  let state: SgaElement | undefined = undefined;

  for (const op of plan.operations) {
    switch (op.type) {
      case 'multiply': {
        const a = (inputs.a as SgaElement) ?? state;
        const b = (inputs.b as SgaElement) ?? state;
        if (!a || !b) throw new Error('Multiply requires two SGA elements');
        state = sgaMultiply(a, b);
        break;
      }

      case 'add': {
        const a = (inputs.a as SgaElement) ?? state;
        const b = (inputs.b as SgaElement) ?? state;
        if (!a || !b) throw new Error('Add requires two SGA elements');
        state = sgaAdd(a, b);
        break;
      }

      case 'scale': {
        const element = (inputs.x as SgaElement) ?? state;
        if (!element) throw new Error('Scale requires an SGA element');
        state = sgaScale(element, op.scalar);
        break;
      }

      case 'add96': {
        // Ring ops work at class level: project → arithmetic → lift
        const aInput = inputs.a;
        const bInput = inputs.b;

        const aClass = typeof aInput === 'number' ? aInput : project(aInput as SgaElement);
        const bClass = typeof bInput === 'number' ? bInput : project(bInput as SgaElement);

        if (aClass === null || bClass === null) {
          throw new Error('add96 requires rank-1 elements or class indices');
        }

        const sum = aClass + bClass;
        const resultClass = sum % 96;
        const overflow = sum >= 96;

        state = lift(resultClass);

        if (op.overflowMode === 'track') {
          return { value: resultClass, overflow };
        }
        break;
      }

      case 'sub96': {
        const aInput = inputs.a;
        const bInput = inputs.b;

        const aClass = typeof aInput === 'number' ? aInput : project(aInput as SgaElement);
        const bClass = typeof bInput === 'number' ? bInput : project(bInput as SgaElement);

        if (aClass === null || bClass === null) {
          throw new Error('sub96 requires rank-1 elements or class indices');
        }

        const diff = aClass - bClass;
        const resultClass = ((diff % 96) + 96) % 96;
        const overflow = diff < 0;

        state = lift(resultClass);

        if (op.overflowMode === 'track') {
          return { value: resultClass, overflow };
        }
        break;
      }

      case 'mul96': {
        const aInput = inputs.a;
        const bInput = inputs.b;

        const aClass = typeof aInput === 'number' ? aInput : project(aInput as SgaElement);
        const bClass = typeof bInput === 'number' ? bInput : project(bInput as SgaElement);

        if (aClass === null || bClass === null) {
          throw new Error('mul96 requires rank-1 elements or class indices');
        }

        const prod = aClass * bClass;
        const resultClass = prod % 96;
        const overflow = prod >= 96;

        state = lift(resultClass);

        if (op.overflowMode === 'track') {
          return { value: resultClass, overflow };
        }
        break;
      }

      case 'R': {
        const element = (inputs.x as SgaElement) ?? state;
        if (!element) throw new Error('R transform requires an SGA element');
        state = transformRPower(element, op.k);
        break;
      }

      case 'D': {
        const element = (inputs.x as SgaElement) ?? state;
        if (!element) throw new Error('D transform requires an SGA element');
        state = transformDPower(element, op.k);
        break;
      }

      case 'T': {
        const element = (inputs.x as SgaElement) ?? state;
        if (!element) throw new Error('T transform requires an SGA element');
        state = transformTPower(element, op.k);
        break;
      }

      case 'M': {
        const element = (inputs.x as SgaElement) ?? state;
        if (!element) throw new Error('M transform requires an SGA element');
        state = transformM(element);
        break;
      }

      case 'projectGrade': {
        const inputElement: SgaElement | undefined = (inputs.x as SgaElement) ?? state;
        if (!inputElement) throw new Error('Grade projection requires an SGA element');
        // Project the Clifford component to the specified grade
        const projected = gradeProject(inputElement.clifford, op.grade);
        state = {
          clifford: projected,
          z4: inputElement.z4,
          z3: inputElement.z3,
        };
        break;
      }

      case 'lift': {
        state = lift(op.classIndex);
        break;
      }

      case 'projectClass': {
        const element = (inputs.x as SgaElement) ?? state;
        if (!element) throw new Error('projectClass requires an SGA element');
        const classIndex = project(element);
        return classIndex; // Return class index or null
      }

      case 'gcd96': {
        // GCD at class level: project → compute → return number
        const aInput = inputs.a;
        const bInput = inputs.b;

        const aClass = typeof aInput === 'number' ? aInput : project(aInput as SgaElement);
        const bClass = typeof bInput === 'number' ? bInput : project(bInput as SgaElement);

        if (aClass === null || bClass === null) {
          throw new Error('gcd96 requires rank-1 elements or class indices');
        }

        return computeGcd96(aClass % 96, bClass % 96);
      }

      case 'lcm96': {
        const aInput = inputs.a;
        const bInput = inputs.b;

        const aClass = typeof aInput === 'number' ? aInput : project(aInput as SgaElement);
        const bClass = typeof bInput === 'number' ? bInput : project(bInput as SgaElement);

        if (aClass === null || bClass === null) {
          throw new Error('lcm96 requires rank-1 elements or class indices');
        }

        return computeLcm96(aClass % 96, bClass % 96);
      }

      case 'sum': {
        const values = (inputs.values as (number | SgaElement)[]) ?? [];
        let sum = 0;

        for (const val of values) {
          const classVal = typeof val === 'number' ? val : project(val as SgaElement);
          if (classVal === null) {
            throw new Error('sum requires rank-1 elements or class indices');
          }
          sum = (sum + classVal) % 96;
        }

        return sum;
      }

      case 'product': {
        const values = (inputs.values as (number | SgaElement)[]) ?? [];
        let prod = 1;

        for (const val of values) {
          const classVal = typeof val === 'number' ? val : project(val as SgaElement);
          if (classVal === null) {
            throw new Error('product requires rank-1 elements or class indices');
          }
          prod = (prod * classVal) % 96;
        }

        return prod;
      }

      case 'max': {
        const values = (inputs.values as (number | SgaElement)[]) ?? [];
        if (values.length === 0) {
          return 0;
        }

        let maxVal = -Infinity;
        for (const val of values) {
          const classVal = typeof val === 'number' ? val : project(val as SgaElement);
          if (classVal === null) {
            throw new Error('max requires rank-1 elements or class indices');
          }
          if (classVal > maxVal) {
            maxVal = classVal;
          }
        }

        return maxVal % 96;
      }

      case 'min': {
        const values = (inputs.values as (number | SgaElement)[]) ?? [];
        if (values.length === 0) {
          return 0;
        }

        let minVal = Infinity;
        for (const val of values) {
          const classVal = typeof val === 'number' ? val : project(val as SgaElement);
          if (classVal === null) {
            throw new Error('min requires rank-1 elements or class indices');
          }
          if (classVal < minVal) {
            minVal = classVal;
          }
        }

        return minVal % 96;
      }

      case 'factor96': {
        const nInput = inputs.n;
        const nClass = typeof nInput === 'number' ? nInput : project(nInput as SgaElement);

        if (nClass === null) {
          throw new Error('factor96 requires a rank-1 element or class index');
        }

        return computeFactor96(nClass % 96);
      }

      case 'isPrime96': {
        const nInput = inputs.n;
        const nClass = typeof nInput === 'number' ? nInput : project(nInput as SgaElement);

        if (nClass === null) {
          throw new Error('isPrime96 requires a rank-1 element or class index');
        }

        return computeIsPrime96(nClass % 96);
      }
    }
  }

  return state;
}

/**
 * Helper functions for arithmetic operations
 * (Shared with class backend semantics)
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

function computeLcm96(a: number, b: number): number {
  const aVal = a % 96;
  const bVal = b % 96;

  if (aVal === 0 || bVal === 0) {
    return 0;
  }

  const gcd = computeGcd96(aVal, bVal);
  return ((aVal * bVal) / gcd) % 96;
}

const PRIMES_96 = [
  1, 5, 7, 11, 13, 17, 19, 23, 25, 29, 31, 35, 37, 41, 43, 47, 49, 53, 55, 59, 61, 65, 67, 71, 73,
  77, 79, 83, 85, 89, 91, 95,
];

function computeIsPrime96(n: number): boolean {
  const nVal = n % 96;
  return PRIMES_96.includes(nVal);
}

function computeFactor96(n: number): number[] {
  const nVal = n % 96;

  if (nVal === 0) {
    return [0];
  }

  if (nVal === 1) {
    return [1];
  }

  const factors: number[] = [];
  let remaining = nVal;

  for (const p of PRIMES_96) {
    if (p === 1) continue;

    while (remaining % p === 0 && remaining > 1) {
      factors.push(p);
      remaining = (remaining / p) % 96;

      if (factors.length > 100) {
        break;
      }
    }

    if (remaining === 1) {
      break;
    }
  }

  if (remaining > 1 && factors.length === 0) {
    return [nVal];
  }

  return factors.length > 0 ? factors : [nVal];
}
