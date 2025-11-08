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
import {
  sgaMultiply,
  sgaAdd,
  sgaScale,
  createRank1Basis,
} from '../../sga/sga-element';
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
          case 'lift':
            ops.push({ type: 'lift', classIndex: op.classIndex });
            break;
          case 'project':
            ops.push({ type: 'projectGrade', grade: op.grade });
            break;
          case 'add96':
            // In SGA backend, add96 is implemented via class indices
            // We lift, add, and project back
            ops.push({ type: 'add' });
            break;
          case 'sub96':
            // Similar to add96
            ops.push({ type: 'add' }); // Will need special handling
            break;
          case 'mul96':
            ops.push({ type: 'multiply' });
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
export function executeSgaPlan(
  plan: SgaPlan,
  inputs: Record<string, unknown>,
): unknown {
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
        if (!state) throw new Error('Project requires an SGA element');
        const classIndex = project(state);
        return classIndex; // Return class index or null
      }
    }
  }

  return state;
}
