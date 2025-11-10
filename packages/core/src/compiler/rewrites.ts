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
  // Phase 1: push transforms to leaves and fold adjacent powers until fixpoint
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let changed = true;
    while (changed) {
      const next = normalizeStep(current);
      changed = !irEqual(current, next);
      current = next;
    }

    // Phase 2: canonicalize transform chains at leaves (non-adjacent power folding)
    const canon = canonicalizeLeafChains(current);
    if (!irEqual(current, canon)) {
      current = canon;
      // Loop to allow any further adjacent folds triggered by canonicalization
      continue;
    }
    break;
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
function normalizeTransform(node: {
  kind: 'transform';
  transform: TransformOp;
  child: IRNode;
}): IRNode {
  const { transform, child } = node;

  // Pure power folding: eliminate identity transforms
  // R⁴ = D³ = T⁸ = M² = identity
  if (transform.type === 'R' && transform.k === 0) return normalizeStep(child);
  if (transform.type === 'D' && transform.k === 0) return normalizeStep(child);
  if (transform.type === 'T' && transform.k === 0) return normalizeStep(child);

  // First, normalize the child
  const normalizedChild = normalizeStep(child);

  // If child is also a transform, attempt folding only when types match or mirror conjugation applies
  if (normalizedChild.kind === 'transform') {
    const inner = normalizedChild.transform;
    // Same type power folding
    if (transform.type === inner.type) {
      const folded = foldTransforms(transform, inner);
      if (folded === null) return normalizedChild.child; // identity
      return { kind: 'transform', transform: folded, child: normalizedChild.child };
    }
    // Mirror conjugation (only apply when outer is M)
    if (transform.type === 'M') {
      const folded = foldTransforms(transform, inner);
      if (folded === null) return normalizedChild.child; // M∘M cancels
      return { kind: 'transform', transform: folded, child: normalizedChild.child };
    }
    // Different, commuting types: preserve both transforms (outer wrapping inner)
    return {
      kind: 'transform',
      transform,
      child: normalizedChild,
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
function atomEqual(
  a: { type: string; [key: string]: unknown },
  b: { type: string; [key: string]: unknown },
): boolean {
  if (a.type !== b.type) return false;

  switch (a.type) {
    case 'classLiteral':
      return a.value === b.value;
    case 'param':
      return a.name === b.name;
    case 'constantArray':
      // Compare array contents
      if (b.type !== 'constantArray') return false;
      const aVal = a.value as readonly number[];
      const bVal = b.value as readonly number[];
      return aVal.length === bVal.length && aVal.every((v, i) => v === bVal[i]);
    case 'lift':
      return a.classIndex === b.classIndex;
    case 'project':
      return a.grade === b.grade;
    case 'projectClass':
      // Compare child IR nodes
      return irEqual(a.child as IRNode, b.child as IRNode);
    case 'add96':
    case 'sub96':
    case 'mul96':
      return a.overflowMode === b.overflowMode;
    case 'gcd96':
    case 'lcm96':
    case 'sum':
    case 'product':
    case 'max':
    case 'min':
    case 'factor96':
    case 'isPrime96':
      // These operations have no parameters beyond their type
      return true;
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
 * Canonicalize transform chains at leaves by applying commutation and
 * conjugation laws to bring identical transform types together and fold powers.
 *
 * Canonical form per leaf path:
 *   [M?] then R^r (mod 4), D^d (mod 3), T^t (mod 8), omitting identities.
 *   An odd number of mirrors yields a leading M; even cancels to identity.
 */
function canonicalizeLeafChains(node: IRNode): IRNode {
  function rebuild(child: IRNode, chain: TransformOp[]): IRNode {
    let n: IRNode = child;
    for (let i = chain.length - 1; i >= 0; i--) {
      n = { kind: 'transform', transform: chain[i], child: n };
    }
    return n;
  }

  function canonicalizeChain(chain: TransformOp[]): TransformOp[] {
    let mirrored = false;
    let r = 0;
    let d = 0;
    let t = 0;

    for (const tr of chain) {
      switch (tr.type) {
        case 'M':
          mirrored = !mirrored;
          break;
        case 'R': {
          const k = tr.k % 4;
          r = ((r + k) % 4) as 0 | 1 | 2 | 3;
          break;
        }
        case 'D': {
          const k = tr.k % 3;
          d = ((d + k) % 3) as 0 | 1 | 2;
          break;
        }
        case 'T': {
          const k = tr.k % 8;
          t = ((t + k) % 8) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
          break;
        }
      }
    }

    const result: TransformOp[] = [];
    if (mirrored) result.push({ type: 'M' });
    if (r !== 0) result.push({ type: 'R', k: r });
    if (d !== 0) result.push({ type: 'D', k: d });
    if (t !== 0) result.push({ type: 'T', k: t });
    return result;
  }

  function visit(n: IRNode): IRNode {
    switch (n.kind) {
      case 'atom':
        return n;
      case 'seq':
        return { kind: 'seq', left: visit(n.left), right: visit(n.right) };
      case 'par':
        return { kind: 'par', left: visit(n.left), right: visit(n.right) };
      case 'transform': {
        // Collect full chain to leaf
        const chain: TransformOp[] = [];
        let cur: IRNode = n;
        while (cur.kind === 'transform') {
          chain.push(cur.transform);
          cur = cur.child;
        }
        const leaf = visit(cur); // leaf should be atom; visit in case nested structure
        const canon = canonicalizeChain(chain);
        return rebuild(leaf, canon);
      }
    }
  }

  return visit(node);
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
