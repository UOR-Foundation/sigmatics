/**
 * Rewrite & Normalization
 *
 * Deterministic rewrite system for IR canonicalization:
 * 1. Push transforms to leaves
 * 2. Fold pure powers in ℝ[ℤ₄]/ℝ[ℤ₃]
 * 3. Canonicalize transform presentation
 *
 * The rewrite system is terminating and confluent.
 */

import type { IRNode, TransformOp } from '../model/types';

/**
 * Normalize an IR tree
 *
 * Applies rewrites until a fixpoint is reached:
 * - Push transforms down to leaves
 * - Fold consecutive transforms
 * - Remove identity transforms
 */
export function normalize(node: IRNode): IRNode {
  let current = node;
  let changed = true;

  while (changed) {
    const next = normalizeStep(current);
    changed = !irEqual(current, next);
    current = next;
  }

  return current;
}

/**
 * Single normalization step
 */
function normalizeStep(node: IRNode): IRNode {
  switch (node.kind) {
    case 'atom':
      return node; // Atoms are already canonical

    case 'seq':
      // Normalize children first
      return {
        kind: 'seq',
        left: normalizeStep(node.left),
        right: normalizeStep(node.right),
      };

    case 'par':
      // Normalize children first
      return {
        kind: 'par',
        left: normalizeStep(node.left),
        right: normalizeStep(node.right),
      };

    case 'transform':
      return normalizeTransform(node);
  }
}

/**
 * Normalize a transform node
 *
 * Push transforms down to leaves and fold consecutive transforms
 */
function normalizeTransform(node: { kind: 'transform'; transform: TransformOp; child: IRNode }): IRNode {
  const { transform, child } = node;

  // First, normalize the child
  const normalizedChild = normalizeStep(child);

  // If child is also a transform, fold them
  if (normalizedChild.kind === 'transform') {
    const folded = foldTransforms(transform, normalizedChild.transform);
    if (folded === null) {
      // Transforms cancel out (e.g., M∘M = identity)
      return normalizedChild.child;
    }
    return {
      kind: 'transform',
      transform: folded,
      child: normalizedChild.child,
    };
  }

  // If child is a sequential composition, distribute
  // T(a ∘ b) = T(a) ∘ T(b) for equivariant transforms
  if (normalizedChild.kind === 'seq') {
    return {
      kind: 'seq',
      left: {
        kind: 'transform',
        transform,
        child: normalizedChild.left,
      },
      right: {
        kind: 'transform',
        transform,
        child: normalizedChild.right,
      },
    };
  }

  // If child is a parallel composition, distribute
  // T(a ⊗ b) = T(a) ⊗ T(b)
  if (normalizedChild.kind === 'par') {
    return {
      kind: 'par',
      left: {
        kind: 'transform',
        transform,
        child: normalizedChild.left,
      },
      right: {
        kind: 'transform',
        transform,
        child: normalizedChild.right,
      },
    };
  }

  // Atom case - transform is at a leaf (canonical)
  return {
    kind: 'transform',
    transform,
    child: normalizedChild,
  };
}

/**
 * Fold two consecutive transforms
 *
 * Returns the combined transform or null if they cancel out
 */
function foldTransforms(outer: TransformOp, inner: TransformOp): TransformOp | null {
  // Same type: fold powers
  if (outer.type === inner.type) {
    if (outer.type === 'R' && inner.type === 'R') {
      const k = (outer.k + inner.k) % 4;
      if (k === 0) return null; // R^4 = identity
      return { type: 'R', k };
    }
    if (outer.type === 'D' && inner.type === 'D') {
      const k = (outer.k + inner.k) % 3;
      if (k === 0) return null; // D^3 = identity
      return { type: 'D', k };
    }
    if (outer.type === 'T' && inner.type === 'T') {
      const k = (outer.k + inner.k) % 8;
      if (k === 0) return null; // T^8 = identity
      return { type: 'T', k };
    }
    if (outer.type === 'M' && inner.type === 'M') {
      return null; // M^2 = identity
    }
  }

  // Different types: check for mirror conjugation rules
  // MRM = R⁻¹, MDM = D⁻¹, MTM = T⁻¹
  if (outer.type === 'M') {
    if (inner.type === 'R') {
      // MRM = R⁻¹, so M(R^k) = R^(-k)M
      const invK = (4 - inner.k) % 4;
      if (invK === 0) return { type: 'M' }; // R^0M = M
      return { type: 'R', k: invK };
    }
    if (inner.type === 'D') {
      // MDM = D⁻¹, so M(D^k) = D^(-k)M
      const invK = (3 - inner.k) % 3;
      if (invK === 0) return { type: 'M' }; // D^0M = M
      return { type: 'D', k: invK };
    }
    if (inner.type === 'T') {
      // MTM = T⁻¹, so M(T^k) = T^(-k)M
      const invK = (8 - inner.k) % 8;
      if (invK === 0) return { type: 'M' }; // T^0M = M
      return { type: 'T', k: invK };
    }
  }

  // Other pairs commute (RD = DR, RT = TR, DT = TD)
  // We maintain the outer transform
  return outer;
}

/**
 * Test if two IR nodes are structurally equal
 */
function irEqual(a: IRNode, b: IRNode): boolean {
  if (a.kind !== b.kind) return false;

  switch (a.kind) {
    case 'atom':
      if (b.kind !== 'atom') return false;
      return atomEqual(a.op, b.op);

    case 'seq':
      if (b.kind !== 'seq') return false;
      return irEqual(a.left, b.left) && irEqual(a.right, b.right);

    case 'par':
      if (b.kind !== 'par') return false;
      return irEqual(a.left, b.left) && irEqual(a.right, b.right);

    case 'transform':
      if (b.kind !== 'transform') return false;
      return transformEqual(a.transform, b.transform) && irEqual(a.child, b.child);
  }
}

/**
 * Test if two atomic operations are equal
 */
function atomEqual(a: any, b: any): boolean {
  if (a.type !== b.type) return false;

  switch (a.type) {
    case 'classLiteral':
      return a.value === b.value;
    case 'lift':
      return a.classIndex === b.classIndex;
    case 'project':
      return a.grade === b.grade;
    case 'add96':
    case 'sub96':
    case 'mul96':
      return a.overflowMode === b.overflowMode;
  }

  return false;
}

/**
 * Test if two transforms are equal
 */
function transformEqual(a: TransformOp, b: TransformOp): boolean {
  if (a.type !== b.type) return false;

  if (a.type === 'R' && b.type === 'R') return a.k === b.k;
  if (a.type === 'D' && b.type === 'D') return a.k === b.k;
  if (a.type === 'T' && b.type === 'T') return a.k === b.k;
  if (a.type === 'M' && b.type === 'M') return true;

  return false;
}

/**
 * Extract transforms from a normalized IR node
 *
 * After normalization, transforms are pushed to leaves.
 * This function extracts the transform chain at each leaf.
 */
export function extractTransforms(node: IRNode): {
  transforms: TransformOp[];
  atom: IRNode;
}[] {
  switch (node.kind) {
    case 'atom':
      return [{ transforms: [], atom: node }];

    case 'seq':
    case 'par':
      return [...extractTransforms(node.left), ...extractTransforms(node.right)];

    case 'transform': {
      const childResults = extractTransforms(node.child);
      return childResults.map((r) => ({
        transforms: [node.transform, ...r.transforms],
        atom: r.atom,
      }));
    }
  }
}
