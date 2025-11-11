/**
 * Intermediate Representation (IR)
 *
 * Tiny IR for Sigmatics operations:
 * - Atoms: class literals, lift, project(k)
 * - Combinators: ∘ (seq), ⊗ (par)
 * - Transforms: R, D, T, M
 *
 * The IR is the canonical representation before lowering to backends.
 */

import type { IRNode } from '../model/types';

/**
 * Create a class literal IR node
 */
export function classLiteral(value: number): IRNode {
  if (value < 0 || value >= 96) {
    throw new Error(`Invalid class index: ${value}. Must be 0..95.`);
  }
  return {
    kind: 'atom',
    op: { type: 'classLiteral', value },
  };
}

/**
 * Create a runtime parameter reference IR node
 */
export function param(name: string): IRNode {
  return {
    kind: 'atom',
    op: { type: 'param', name },
  };
}

/**
 * Create a constant array IR node (for compile-time fusion)
 */
export function constantArray(value: readonly number[]): IRNode {
  return {
    kind: 'atom',
    op: { type: 'constantArray', value },
  };
}

/**
 * Create a lift IR node
 */
export function lift(classIndex: number): IRNode {
  if (classIndex < 0 || classIndex >= 96) {
    throw new Error(`Invalid class index: ${classIndex}. Must be 0..95.`);
  }
  return {
    kind: 'atom',
    op: { type: 'lift', classIndex },
  };
}

/**
 * Create a grade projection IR node
 */
export function projectGrade(grade: number): IRNode {
  if (grade < 0 || grade > 7) {
    throw new Error(`Invalid grade: ${grade}. Must be 0..7.`);
  }
  return {
    kind: 'atom',
    op: { type: 'project', grade },
  };
}

/**
 * Create a projectClass IR node (SGA element → class index)
 */
export function projectClass(child: IRNode): IRNode {
  return {
    kind: 'atom',
    op: { type: 'projectClass', child },
  };
}

/**
 * Create an add96 IR node
 */
export function add96(overflowMode: 'drop' | 'track' = 'drop'): IRNode {
  return {
    kind: 'atom',
    op: { type: 'add96', overflowMode },
  };
}

/**
 * Create a sub96 IR node
 */
export function sub96(overflowMode: 'drop' | 'track' = 'drop'): IRNode {
  return {
    kind: 'atom',
    op: { type: 'sub96', overflowMode },
  };
}

/**
 * Create a mul96 IR node
 */
export function mul96(overflowMode: 'drop' | 'track' = 'drop'): IRNode {
  return {
    kind: 'atom',
    op: { type: 'mul96', overflowMode },
  };
}

/**
 * Create a gcd96 IR node
 */
export function gcd96(): IRNode {
  return {
    kind: 'atom',
    op: { type: 'gcd96' },
  };
}

/**
 * Create a lcm96 IR node
 */
export function lcm96(): IRNode {
  return {
    kind: 'atom',
    op: { type: 'lcm96' },
  };
}

/**
 * Create a sum IR node
 */
export function sum(): IRNode {
  return {
    kind: 'atom',
    op: { type: 'sum' },
  };
}

/**
 * Create a product IR node
 */
export function product(): IRNode {
  return {
    kind: 'atom',
    op: { type: 'product' },
  };
}

/**
 * Create a max IR node
 */
export function max(): IRNode {
  return {
    kind: 'atom',
    op: { type: 'max' },
  };
}

/**
 * Create a min IR node
 */
export function min(): IRNode {
  return {
    kind: 'atom',
    op: { type: 'min' },
  };
}

/**
 * Create a factor96 IR node
 */
export function factor96(): IRNode {
  return {
    kind: 'atom',
    op: { type: 'factor96' },
  };
}

/**
 * Create an isPrime96 IR node
 */
export function isPrime96(): IRNode {
  return {
    kind: 'atom',
    op: { type: 'isPrime96' },
  };
}

/**
 * Create a constantValue IR node (for compile-time fusion of complex values)
 */
export function constant<T = unknown>(value: T): IRNode {
  return {
    kind: 'atom',
    op: { type: 'constantValue', value },
  };
}

/**
 * Create a factorHierarchical IR node
 */
export function factorHierarchical(): IRNode {
  return {
    kind: 'atom',
    op: { type: 'factorHierarchical' },
  };
}

/**
 * Sequential composition (∘)
 */
export function seq(left: IRNode, right: IRNode): IRNode {
  return { kind: 'seq', left, right };
}

/**
 * Parallel composition (⊗)
 */
export function par(left: IRNode, right: IRNode): IRNode {
  return { kind: 'par', left, right };
}

/**
 * R transform (quarter-turn rotation)
 */
export function R(child: IRNode, k = 1): IRNode {
  const kMod = ((k % 4) + 4) % 4;
  if (kMod === 0) return child; // R^0 = identity
  return {
    kind: 'transform',
    transform: { type: 'R', k: kMod },
    child,
  };
}

/**
 * D transform (triality rotation)
 */
export function D(child: IRNode, k = 1): IRNode {
  const kMod = ((k % 3) + 3) % 3;
  if (kMod === 0) return child; // D^0 = identity
  return {
    kind: 'transform',
    transform: { type: 'D', k: kMod },
    child,
  };
}

/**
 * T transform (context rotation)
 */
export function T(child: IRNode, k = 1): IRNode {
  const kMod = ((k % 8) + 8) % 8;
  if (kMod === 0) return child; // T^0 = identity
  return {
    kind: 'transform',
    transform: { type: 'T', k: kMod },
    child,
  };
}

/**
 * M transform (mirror)
 */
export function M(child: IRNode): IRNode {
  return {
    kind: 'transform',
    transform: { type: 'M' },
    child,
  };
}

/**
 * Pretty-print an IR node (for debugging)
 */
export function prettyPrintIR(node: IRNode, indent = 0): string {
  const spaces = ' '.repeat(indent);

  switch (node.kind) {
    case 'atom': {
      const op = node.op;
      switch (op.type) {
        case 'classLiteral':
          return `${spaces}ClassLiteral(${op.value})`;
        case 'param':
          return `${spaces}Param("${op.name}")`;
        case 'constantArray':
          return `${spaces}ConstantArray([${op.value.join(', ')}])`;
        case 'lift':
          return `${spaces}Lift(${op.classIndex})`;
        case 'project':
          return `${spaces}ProjectGrade(${op.grade})`;
        case 'add96':
          return `${spaces}Add96(${op.overflowMode})`;
        case 'sub96':
          return `${spaces}Sub96(${op.overflowMode})`;
        case 'mul96':
          return `${spaces}Mul96(${op.overflowMode})`;
        case 'gcd96':
          return `${spaces}Gcd96()`;
        case 'lcm96':
          return `${spaces}Lcm96()`;
        case 'sum':
          return `${spaces}Sum()`;
        case 'product':
          return `${spaces}Product()`;
        case 'max':
          return `${spaces}Max()`;
        case 'min':
          return `${spaces}Min()`;
        case 'factor96':
          return `${spaces}Factor96()`;
        case 'isPrime96':
          return `${spaces}IsPrime96()`;
      }
      break;
    }
    case 'seq':
      return `${spaces}Seq(\n${prettyPrintIR(node.left, indent + 2)},\n${prettyPrintIR(node.right, indent + 2)}\n${spaces})`;
    case 'par':
      return `${spaces}Par(\n${prettyPrintIR(node.left, indent + 2)},\n${prettyPrintIR(node.right, indent + 2)}\n${spaces})`;
    case 'transform': {
      const t = node.transform;
      let tName = '';
      if (t.type === 'R') tName = `R^${t.k}`;
      else if (t.type === 'D') tName = `D^${t.k}`;
      else if (t.type === 'T') tName = `T^${t.k}`;
      else if (t.type === 'M') tName = 'M';
      return `${spaces}Transform(${tName},\n${prettyPrintIR(node.child, indent + 2)}\n${spaces})`;
    }
  }

  return `${spaces}Unknown`;
}
