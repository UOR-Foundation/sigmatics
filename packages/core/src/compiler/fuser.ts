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
  if (isClassPure(node)) {
    return 'C1';
  }

  // C2: Bounded mixed-grade/shape
  if (hasBoundedGrades(node)) {
    return 'C2';
  }

  // C3: General case
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
 * Check if IR tree is class-pure (no grade projections)
 */
function isClassPure(node: IRNode): boolean {
  switch (node.kind) {
    case 'atom':
      // Grade projection requires SGA backend
      if (node.op.type === 'project') {
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
  // Count number of grade projections
  let gradeProjections = 0;

  function count(n: IRNode): void {
    switch (n.kind) {
      case 'atom':
        if (n.op.type === 'project') {
          gradeProjections++;
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

  // Bounded if <= 2 grade projections
  return gradeProjections <= 2;
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
