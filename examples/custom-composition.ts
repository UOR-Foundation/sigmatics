/**
 * Custom Model Composition Example
 *
 * Demonstrates how to build complex operations by composing stdlib models
 * into custom fused circuits. The v0.4.0 declarative model system enables
 * elegant composition of operations.
 *
 * This example shows:
 * - Building custom transformations from stdlib operations
 * - Composing transforms into cryptographic mixing functions
 * - Creating reusable operation patterns
 * - Building domain-specific operations on top of Sigmatics primitives
 */

import Atlas from '@uor-foundation/sigmatics';
import type { SgaElement } from '@uor-foundation/sigmatics';

console.log('═'.repeat(80));
console.log('Custom Model Composition Examples');
console.log('═'.repeat(80));
console.log();

// ============================================================================
// Example 1: Custom Transform Composition
// ============================================================================

console.log('Example 1: Building Custom Transforms');
console.log('─'.repeat(80));
console.log();

/**
 * Create a custom "spiral" transformation that combines R, D, and T
 * This could be used for cryptographic diffusion
 */
function createSpiralTransform(rPower: number, dPower: number, tPower: number) {
  const rModel = Atlas.Model.R(rPower as 0 | 1 | 2 | 3);
  const dModel = Atlas.Model.D(dPower as 0 | 1 | 2);
  const tModel = Atlas.Model.T(tPower as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7);

  return function spiral(c: number): number {
    const step1 = rModel.run({ x: c }) as number;
    const step2 = dModel.run({ x: step1 }) as number;
    const step3 = tModel.run({ x: step2 }) as number;
    return step3;
  };
}

// Create a custom transform: R² ∘ D¹ ∘ T³
const spiral = createSpiralTransform(2, 1, 3);

console.log('Custom "spiral" transform: R² ∘ D¹ ∘ T³');
console.log();

const testClasses = [0, 21, 42, 63, 84];
console.log('Applying to test classes:');
for (const c of testClasses) {
  const result = spiral(c);
  console.log(`  spiral(${c}) = ${result}`);
}
console.log();

// Verify it's a permutation by checking all 96 classes
const spiralResults = new Set<number>();
for (let c = 0; c < 96; c++) {
  spiralResults.add(spiral(c));
}
console.log(`Permutation check: ${spiralResults.size} unique outputs from 96 inputs`);
console.log(spiralResults.size === 96 ? '✓ Valid permutation!' : '✗ Not a permutation');
console.log();

// ============================================================================
// Example 2: Cryptographic Round Function
// ============================================================================

console.log('Example 2: Cryptographic Round Function');
console.log('─'.repeat(80));
console.log();

/**
 * A cryptographic round function that:
 * 1. Adds a round constant (using add96)
 * 2. Applies a non-linear transform
 * 3. Performs diffusion via spiral transform
 */
function createRoundFunction() {
  const addModel = Atlas.Model.add96('drop');
  const mModel = Atlas.Model.M(); // Non-linear component

  return function round(state: number, roundKey: number): number {
    // 1. Key mixing
    const mixedResult = addModel.run({ a: state, b: roundKey });
    const mixed = typeof mixedResult === 'number' ? mixedResult : mixedResult.value;

    // 2. Non-linear transformation (mirror changes modality)
    const nonlinear = mModel.run({ x: mixed }) as number;

    // 3. Diffusion
    const diffused = spiral(nonlinear);

    return diffused;
  };
}

const roundFunc = createRoundFunction();

console.log('Simulating a block cipher with 8 rounds:');
console.log();

let state = 42; // Initial state (plaintext)
const roundKeys = [7, 13, 21, 31, 42, 53, 67, 89]; // Round keys

console.log(`Initial state: ${state}`);
for (let i = 0; i < roundKeys.length; i++) {
  state = roundFunc(state, roundKeys[i]);
  console.log(`  After round ${i + 1}: ${state}`);
}
console.log();
console.log(`Final ciphertext: ${state}`);
console.log();

// ============================================================================
// Example 3: Batch Transform Operation
// ============================================================================

console.log('Example 3: Batch Operations');
console.log('─'.repeat(80));
console.log();

/**
 * Apply a transform to a batch of classes efficiently
 */
function batchTransform(
  classes: number[],
  transform: (c: number) => number,
): number[] {
  return classes.map(transform);
}

const inputBatch = Array.from({ length: 20 }, (_, i) => (i * 5) % 96);

console.log(`Input batch (${inputBatch.length} classes):`);
console.log(`  [${inputBatch.slice(0, 10).join(', ')}, ...]`);

const outputBatch = batchTransform(inputBatch, spiral);

console.log(`Output batch:`);
console.log(`  [${outputBatch.slice(0, 10).join(', ')}, ...]`);
console.log();

// ============================================================================
// Example 4: State Machine with Transform Transitions
// ============================================================================

console.log('Example 4: State Machine with Transforms');
console.log('─'.repeat(80));
console.log();

/**
 * A simple state machine where transitions are Sigmatics transforms
 */
class TransformStateMachine {
  private state: number;
  private history: number[] = [];

  constructor(initialState: number) {
    this.state = initialState;
    this.history.push(initialState);
  }

  // Apply a transform and record state
  applyTransform(name: string, transform: (c: number) => number): void {
    this.state = transform(this.state);
    this.history.push(this.state);
    console.log(`  [${name}] state: ${this.state}`);
  }

  getState(): number {
    return this.state;
  }

  getHistory(): number[] {
    return [...this.history];
  }
}

// Create state machine
const sm = new TransformStateMachine(0);
console.log(`State machine initialized at class ${sm.getState()}`);
console.log();

// Define some transform operations
const r1 = (c: number) => Atlas.Model.R(1).run({ x: c }) as number;
const d1 = (c: number) => Atlas.Model.D(1).run({ x: c }) as number;
const t2 = (c: number) => Atlas.Model.T(2).run({ x: c }) as number;
const m = (c: number) => Atlas.Model.M().run({ x: c }) as number;

console.log('Applying sequence of transforms:');
sm.applyTransform('R¹', r1);
sm.applyTransform('D¹', d1);
sm.applyTransform('T²', t2);
sm.applyTransform('M', m);
sm.applyTransform('R¹', r1);

console.log();
console.log(`State history: [${sm.getHistory().join(' → ')}]`);
console.log();

// ============================================================================
// Example 5: Feistel Network Structure
// ============================================================================

console.log('Example 5: Feistel Network Construction');
console.log('─'.repeat(80));
console.log();

/**
 * A Feistel network splits state into left and right halves,
 * applies a round function to one half, and XORs with the other
 */
function feistelRound(
  left: number,
  right: number,
  roundKey: number,
): { left: number; right: number } {
  // F function: transform + key mixing
  const addModel = Atlas.Model.add96('drop');
  const mixedResult = addModel.run({ a: right, b: roundKey });
  const mixed = typeof mixedResult === 'number' ? mixedResult : mixedResult.value;
  const fOutput = spiral(mixed);

  // XOR (in modulo 96) with left half
  const newRightResult = addModel.run({ a: left, b: fOutput });
  const newRight = typeof newRightResult === 'number' ? newRightResult : newRightResult.value;
  const newLeft = right;

  return { left: newLeft, right: newRight };
}

function feistelEncrypt(plaintext: number, keys: number[]): number {
  // Split plaintext into left and right (using simple division)
  let left = Math.floor(plaintext / 10) % 96;
  let right = plaintext % 96;

  console.log(`Initial: L=${left}, R=${right}`);

  for (let i = 0; i < keys.length; i++) {
    const result = feistelRound(left, right, keys[i]);
    left = result.left;
    right = result.right;
    console.log(`  Round ${i + 1}: L=${left}, R=${right}`);
  }

  // Combine back (simple for demonstration)
  const addModel = Atlas.Model.add96('drop');
  const mulModel = Atlas.Model.mul96('drop');
  const mulResult = mulModel.run({ a: left, b: 10 });
  const mulValue = typeof mulResult === 'number' ? mulResult : mulResult.value;
  const addResult = addModel.run({ a: mulValue, b: right });
  const ciphertext = typeof addResult === 'number' ? addResult : addResult.value;

  return ciphertext;
}

console.log('Feistel network encryption (4 rounds):');
const plaintext = 42;
const feistelKeys = [11, 23, 37, 59];
const ciphertext = feistelEncrypt(plaintext, feistelKeys);

console.log();
console.log(`Plaintext: ${plaintext} → Ciphertext: ${ciphertext}`);
console.log();

// ============================================================================
// Example 6: Transform Orbit Explorer
// ============================================================================

console.log('Example 6: Transform Orbit Analysis');
console.log('─'.repeat(80));
console.log();

/**
 * Find the orbit of a class under repeated application of a transform
 */
function findOrbit(
  initialClass: number,
  transform: (c: number) => number,
): number[] {
  const orbit: number[] = [initialClass];
  const seen = new Set<number>([initialClass]);

  let current = transform(initialClass);
  while (!seen.has(current)) {
    orbit.push(current);
    seen.add(current);
    current = transform(current);
  }

  return orbit;
}

// Find orbit of class 21 under our custom spiral transform
const orbit = findOrbit(21, spiral);

console.log(`Orbit of class 21 under spiral transform:`);
console.log(`  Length: ${orbit.length}`);
console.log(`  Classes: [${orbit.join(', ')}]`);
console.log();

// Verify the orbit closes
const nextClass = spiral(orbit[orbit.length - 1]);
console.log(`Orbit closure: spiral(${orbit[orbit.length - 1]}) = ${nextClass}`);
console.log(
  nextClass === orbit[0] ? '✓ Orbit closes correctly' : '✗ Orbit does not close',
);
console.log();

// ============================================================================
// Example 7: Composition Performance
// ============================================================================

console.log('Example 7: Composition Performance');
console.log('─'.repeat(80));
console.log();

const iterations = 100_000;

// Benchmark composed custom transform
console.time('Custom spiral transform (100k iterations)');
for (let i = 0; i < iterations; i++) {
  spiral(i % 96);
}
console.timeEnd('Custom spiral transform (100k iterations)');

// Benchmark full round function
console.time('Full round function (100k iterations)');
for (let i = 0; i < iterations; i++) {
  roundFunc(i % 96, 42);
}
console.timeEnd('Full round function (100k iterations)');

console.log();
console.log('Note: Composed operations maintain high performance because');
console.log('each primitive is a pre-compiled fused circuit!');
console.log();

// ============================================================================
// Summary
// ============================================================================

console.log('═'.repeat(80));
console.log('Composition Summary');
console.log('═'.repeat(80));
console.log();
console.log('The v0.4.0 model system enables rich composition patterns:');
console.log();
console.log('✓ Custom transforms from stdlib primitives');
console.log('✓ Cryptographic round functions and ciphers');
console.log('✓ Batch operations for parallel processing');
console.log('✓ State machines with transform transitions');
console.log('✓ Feistel networks and other cryptographic structures');
console.log('✓ Orbit analysis and algebraic exploration');
console.log();
console.log('Key benefits:');
console.log('  • Each primitive is pre-compiled (no interpretation)');
console.log('  • Composition is lightweight (function calls)');
console.log('  • Type-safe with automatic backend dispatch');
console.log('  • Enables domain-specific abstractions');
console.log();
console.log('This architecture provides the foundation for:');
console.log('  → Cryptographic protocol design');
console.log('  → Symbolic computation frameworks');
console.log('  → Domain-specific languages on Sigmatics');
console.log('  → High-performance algebraic applications');
console.log();
console.log('═'.repeat(80));
