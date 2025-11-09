/**
 * Fusion & Complexity Analysis
 *
 * Determines the complexity class of an IR tree and selects
 * the appropriate backend:
 * - C0/C1: Class backend (permutation fast path)
 * - C2/C3: SGA backend (grade-aware correctness)
 */

import type { IRNode, ComplexityClass, BackendPreference } from '../model/types';

/**
 * Analyze IR and determine complexity class
 */
/**
 * Determine ComplexityClass (C0–C3)
 *
 * Heuristic criteria:
 * - C0: No runtime degrees (fully compiled params), no grade selectors
 * - C1: Class-pure (no project/projectClass) and shallow: seqDepth <= 3, parDepth <= 2
 * - C2: Contains limited grade selectors (<=2) with moderate depth (seqDepth <= 5)
 * - C3: Deep compositions or many grade selectors (>2)
 *
 * Rationale:
 * Shallow, class-pure graphs maximize permutation fusion (class backend).
 * Grade selectors or large depth introduce algebraic semantics where SGA
 * backend is more appropriate. This prevents over-fusing while preserving
 * fast paths for common transform/ring chains.
 */
export function analyzeComplexity(
  node: IRNode,
  compiledParams: Record<string, unknown>,
): ComplexityClass {
  // C0: Fully compiled (no runtime degrees)
  // If all parameters are compiled and no runtime inputs, it's C0
  const hasRuntimeParams = hasRuntimeDegrees(node);
  if (!hasRuntimeParams && isFullyCompiled(compiledParams)) {
    return 'C0';
  }

  // C1: Few runtime degrees - prefer class backend
  // If the operation is pure class-level (no grade projections)
  // and has shallow composition depth
  const depth = computeCompositionDepth(node);
  if (isClassPure(node) && depth.seqDepth <= 3 && depth.parDepth <= 2) {
    return 'C1';
  }

  // C2: Bounded mixed-grade/shape
  // Has grade projections but bounded complexity
  if (hasBoundedGrades(node) && depth.seqDepth <= 5) {
    return 'C2';
  }

  // C3: General case (deep compositions or many grade projections)
  return 'C3';
}

/**
 * Select backend based on complexity class and hints
 */
export function selectBackend(
  complexity: ComplexityClass,
  preference: BackendPreference = 'auto',
): 'class' | 'sga' {
  // Explicit preference
  if (preference === 'class') return 'class';
  if (preference === 'sga') return 'sga';

  // Auto selection based on complexity
  switch (complexity) {
    case 'C0':
    case 'C1':
      return 'class'; // Fast path
    case 'C2':
    case 'C3':
      return 'sga'; // Full algebraic semantics
  }
}

/**
 * Compute composition depth metrics for an IR tree
 *
 * Tracks:
 * - seqDepth: Maximum depth of sequential composition (f ∘ g)
 * - parDepth: Maximum depth of parallel composition (f ⊗ g)
 */
function computeCompositionDepth(node: IRNode): {
  seqDepth: number;
  parDepth: number;
} {
  switch (node.kind) {
    case 'atom':
      return { seqDepth: 0, parDepth: 0 };

    case 'seq': {
      const left = computeCompositionDepth(node.left);
      const right = computeCompositionDepth(node.right);
      return {
        seqDepth: 1 + Math.max(left.seqDepth, right.seqDepth),
        parDepth: Math.max(left.parDepth, right.parDepth),
      };
    }

    case 'par': {
      const left = computeCompositionDepth(node.left);
      const right = computeCompositionDepth(node.right);
      return {
        seqDepth: Math.max(left.seqDepth, right.seqDepth),
        parDepth: 1 + Math.max(left.parDepth, right.parDepth),
      };
    }

    case 'transform': {
      // Transforms don't add to composition depth
      return computeCompositionDepth(node.child);
    }
  }
}

/**
 * Check if IR tree has runtime degrees of freedom
 */
function hasRuntimeDegrees(node: IRNode): boolean {
  switch (node.kind) {
    case 'atom':
      // Ring ops always have runtime inputs (a, b)
      if (node.op.type === 'add96' || node.op.type === 'sub96' || node.op.type === 'mul96') {
        return true;
      }
      // Lift with fixed class index has no runtime degrees
      // Project with fixed grade has no runtime degrees
      return false;

    case 'seq':
    case 'par':
      return hasRuntimeDegrees(node.left) || hasRuntimeDegrees(node.right);

    case 'transform':
      // Transform power is compiled, check child
      return hasRuntimeDegrees(node.child);
  }
}

/**
 * Check if all compiled parameters are provided
 */
function isFullyCompiled(compiledParams: Record<string, unknown>): boolean {
  // If compiled params contain all necessary values, it's fully compiled
  return Object.keys(compiledParams).length > 0;
}

/**
 * Check if IR tree is class-pure (no grade projections or SGA-only operations)
 */
function isClassPure(node: IRNode): boolean {
  switch (node.kind) {
    case 'atom':
      // Grade projection requires SGA backend
      if (node.op.type === 'project') {
        return false;
      }
      // projectClass requires SGA backend (bridge operation)
      if (node.op.type === 'projectClass') {
        return false;
      }
      return true;

    case 'seq':
    case 'par':
      return isClassPure(node.left) && isClassPure(node.right);

    case 'transform':
      return isClassPure(node.child);
  }
}

/**
 * Check if IR tree has bounded grades
 */
function hasBoundedGrades(node: IRNode): boolean {
  // Count number of grade-related operations
  let gradeOps = 0;

  function count(n: IRNode): void {
    switch (n.kind) {
      case 'atom':
        if (n.op.type === 'project') {
          gradeOps++;
        }
        if (n.op.type === 'projectClass') {
          gradeOps++;
        }
        break;
      case 'seq':
      case 'par':
        count(n.left);
        count(n.right);
        break;
      case 'transform':
        count(n.child);
        break;
    }
  }

  count(node);

  // Bounded if <= 2 grade-related operations
  return gradeOps <= 2;
}

/**
 * Determine if an operation should use class backend
 *
 * Class backend is preferred for:
 * - Pure class operations (no grade projections)
 * - Rank-1 transforms
 * - Ring operations
 */
export function shouldUseClassBackend(node: IRNode): boolean {
  return isClassPure(node);
}

/**
 * Determine if an operation requires SGA backend
 *
 * SGA backend is required for:
 * - Grade projections
 * - Higher-grade operations
 */
export function requiresSgaBackend(node: IRNode): boolean {
  return !isClassPure(node);
}
