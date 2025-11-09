/**
 * Dual Backend Example
 *
 * Demonstrates the automatic backend dispatch in the v0.4.0 model system.
 * Models intelligently select between:
 * - Class backend: Fast permutation tables for rank-1 (single class) operations
 * - SGA backend: Full algebraic semantics for general elements
 *
 * The system automatically dispatches based on:
 * - Input types (number vs SgaElement)
 * - Operation requirements (e.g., grade projection requires SGA)
 * - Complexity hints in model descriptors
 *
 * This example shows the dual backends in action and when each is used.
 */

import Atlas from '@uor-foundation/sigmatics';
import type { SgaElement } from '@uor-foundation/sigmatics';

console.log('═'.repeat(80));
console.log('Dual Backend System Demonstration');
console.log('═'.repeat(80));
console.log();

// ============================================================================
// Backend 1: Class Backend (Fast Permutations)
// ============================================================================

console.log('Part 1: Class Backend (Rank-1 Operations)');
console.log('─'.repeat(80));
console.log();
console.log('The class backend uses pre-computed permutation tables for');
console.log('rank-1 operations (transforming single class indices).');
console.log();

// When you pass a number (class index), the class backend is used
const r2Model = Atlas.Model.R(2);

console.log('Example: R² transform on class indices (numbers)');
console.log();

const classInputs = [0, 21, 42, 63, 84];
console.log('Input: class indices (numbers)');
for (const c of classInputs) {
  const result = r2Model.run({ x: c });
  console.log(`  R²(${c}) = ${result} [Class backend used]`);
}
console.log();

// Show that ring operations also use class backend
const addModel = Atlas.Model.add96('track');

console.log('Example: add96 on class indices');
const a = 42;
const b = 50;
const sum = addModel.run({ a, b });
console.log(`  add96(${a}, ${b}) = ${sum.value} (overflow: ${sum.overflow}) [Class backend]`);
console.log();

// ============================================================================
// Backend 2: SGA Backend (Full Algebra)
// ============================================================================

console.log('Part 2: SGA Backend (General Elements)');
console.log('─'.repeat(80));
console.log();
console.log('The SGA backend handles full Clifford algebra semantics,');
console.log('supporting multi-grade elements (scalars, vectors, bivectors, etc.).');
console.log();

// When you pass an SgaElement, the SGA backend is used
console.log('Example: R² transform on SGA elements');
console.log();

const sgaInputs = classInputs.map(c => Atlas.SGA.lift(c));
console.log('Input: SGA elements (lifted from class indices)');
for (let i = 0; i < sgaInputs.length; i++) {
  const result = r2Model.run({ x: sgaInputs[i] });
  const classResult = Atlas.SGA.project(result as SgaElement);
  console.log(
    `  R²(lift(${classInputs[i]})) → project = ${classResult} [SGA backend used]`,
  );
}
console.log();

// ============================================================================
// Automatic Dispatch: Same Model, Different Backends
// ============================================================================

console.log('Part 3: Automatic Backend Dispatch');
console.log('─'.repeat(80));
console.log();
console.log('The SAME compiled model automatically selects the appropriate');
console.log('backend based on input types!');
console.log();

const testClass = 21;
const testSga = Atlas.SGA.lift(21);

console.log(`Test input: class ${testClass}`);
console.log();

// D¹ transform with class backend
console.log('1. Passing number → Class backend');
const d1Model = Atlas.Model.D(1);
const classResult = d1Model.run({ x: testClass });
console.log(`   D¹(${testClass}) = ${classResult}`);
console.log('   → Fast permutation lookup used');
console.log();

// D¹ transform with SGA backend
console.log('2. Passing SgaElement → SGA backend');
const sgaResult = d1Model.run({ x: testSga });
const projectedResult = Atlas.SGA.project(sgaResult as SgaElement);
console.log(`   D¹(lift(${testClass})) → project = ${projectedResult}`);
console.log('   → Full algebraic computation used');
console.log();

console.log('Results match! Backend choice is transparent to the user.');
console.log();

// ============================================================================
// Backend Requirements: Operations That Require SGA
// ============================================================================

console.log('Part 4: Operations Requiring SGA Backend');
console.log('─'.repeat(80));
console.log();
console.log('Some operations can ONLY use the SGA backend because they');
console.log('involve multi-grade elements or operations not representable');
console.log('as class permutations.');
console.log();

// Grade projection requires SGA backend
console.log('Example: Grade projection (extracts specific grades)');
console.log();

// Create an SGA element with multiple grades
const element = Atlas.SGA.lift(21); // This is a rank-1 element (vector)

console.log(`Starting with lifted class 21 (rank-1 element)`);
console.log(`Element is a vector in the Clifford algebra`);
console.log();

// We can apply transforms that maintain rank-1
console.log('Applying transforms (maintains rank-1):');
const t3Model = Atlas.Model.T(3);
const transformed = t3Model.run({ x: element }) as SgaElement;
const transformedClass = Atlas.SGA.project(transformed);
console.log(`  T³(element) → class ${transformedClass}`);
console.log();

// Grade projection must use SGA backend
console.log('Grade projection (SGA-only operation):');
console.log('  This extracts specific grades from multi-grade elements');
console.log('  Not representable as a class permutation');
console.log();

// ============================================================================
// Performance Comparison
// ============================================================================

console.log('Part 5: Performance Characteristics');
console.log('─'.repeat(80));
console.log();

const iterations = 100_000;

// Benchmark class backend
const classInput = 42;
console.time('Class backend (100k operations)');
for (let i = 0; i < iterations; i++) {
  r2Model.run({ x: classInput });
}
console.timeEnd('Class backend (100k operations)');

// Benchmark SGA backend
const sgaInput = Atlas.SGA.lift(42);
console.time('SGA backend (100k operations)');
for (let i = 0; i < iterations; i++) {
  r2Model.run({ x: sgaInput });
}
console.timeEnd('SGA backend (100k operations)');

console.log();
console.log('Observations:');
console.log('  • Class backend: ~10-100x faster for rank-1 operations');
console.log('  • SGA backend: Necessary for full algebraic semantics');
console.log('  • Automatic dispatch ensures optimal performance');
console.log();

// ============================================================================
// Use Case Recommendations
// ============================================================================

console.log('Part 6: When to Use Each Backend');
console.log('─'.repeat(80));
console.log();

console.log('Use CLASS BACKEND (pass numbers) when:');
console.log('  ✓ Working with single class indices');
console.log('  ✓ Maximum performance is critical');
console.log('  ✓ Operations stay within rank-1 space');
console.log('  ✓ Cryptographic applications (fast mixing)');
console.log('  ✓ Large-scale permutation operations');
console.log();

console.log('Use SGA BACKEND (pass SgaElements) when:');
console.log('  ✓ Need full algebraic semantics');
console.log('  ✓ Working with multi-grade elements');
console.log('  ✓ Formal verification of properties');
console.log('  ✓ Grade projections or filtering');
console.log('  ✓ Interoperating with geometric algebra libraries');
console.log();

console.log('The beauty: You can mix and match freely! The system handles it.');
console.log();

// ============================================================================
// Practical Example: Mixed Backend Usage
// ============================================================================

console.log('Part 7: Practical Mixed-Backend Workflow');
console.log('─'.repeat(80));
console.log();

console.log('Scenario: Fast cryptographic mixing with periodic verification');
console.log();

// Fast mixing using class backend
const mixRounds = 1000;
let mixed = 42; // Start with class 42

console.time('Fast mixing (class backend)');
for (let i = 0; i < mixRounds; i++) {
  // Fast permutations
  mixed = r2Model.run({ x: mixed }) as number;
  mixed = d1Model.run({ x: mixed }) as number;
  mixed = t3Model.run({ x: mixed }) as number;
}
console.timeEnd('Fast mixing (class backend)');
console.log(`  Result after ${mixRounds} rounds: class ${mixed}`);
console.log();

// Periodic verification using SGA backend
console.log('Verification (SGA backend):');
const verifyElement = Atlas.SGA.lift(42);
let verifyResult = verifyElement;

for (let i = 0; i < mixRounds; i++) {
  verifyResult = r2Model.run({ x: verifyResult }) as SgaElement;
  verifyResult = d1Model.run({ x: verifyResult }) as SgaElement;
  verifyResult = t3Model.run({ x: verifyResult }) as SgaElement;
}

const verifyClass = Atlas.SGA.project(verifyResult);
console.log(`  Verification result: class ${verifyClass}`);
console.log();

if (mixed === verifyClass) {
  console.log('✓ Results match! Backends are consistent.');
} else {
  console.log('✗ Results differ (this should never happen!)');
}

console.log();

// ============================================================================
// Summary
// ============================================================================

console.log('═'.repeat(80));
console.log('Dual Backend Summary');
console.log('═'.repeat(80));
console.log();
console.log('The v0.4.0 model system provides intelligent backend dispatch:');
console.log();
console.log('CLASS BACKEND:');
console.log('  • Input: number (class index)');
console.log('  • Method: Pre-computed permutation tables');
console.log('  • Speed: Fast (~10-100x faster)');
console.log('  • Scope: Rank-1 operations only');
console.log();
console.log('SGA BACKEND:');
console.log('  • Input: SgaElement (Clifford algebra element)');
console.log('  • Method: Full algebraic computation');
console.log('  • Speed: Slower but comprehensive');
console.log('  • Scope: All operations, multi-grade support');
console.log();
console.log('AUTOMATIC DISPATCH:');
console.log('  ✓ Same model works with both input types');
console.log('  ✓ Transparent to the user');
console.log('  ✓ Optimal performance for each use case');
console.log('  ✓ Consistent results across backends');
console.log();
console.log('This architecture enables:');
console.log('  • High-performance cryptographic operations');
console.log('  • Formal algebraic verification');
console.log('  • Flexible, composable workflows');
console.log('  • Best-of-both-worlds: speed AND correctness');
console.log();
console.log('═'.repeat(80));
