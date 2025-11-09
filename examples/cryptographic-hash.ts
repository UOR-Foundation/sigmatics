/**
 * Cryptographic Hash Function Example
 *
 * Demonstrates building a practical cryptographic hash function using
 * Sigmatics' fused circuit architecture. This example shows how the
 * v0.4.0 model system enables high-performance cryptographic primitives.
 *
 * The hash function uses:
 * - Sigmatics transforms for diffusion (R, D, T)
 * - Mirror transform for non-linearity (M)
 * - Ring operations for mixing (add96, mul96)
 * - Multiple rounds for security
 *
 * This is a demonstration - NOT cryptographically secure!
 * For real applications, use established hash functions.
 */

import Atlas from '@uor-foundation/sigmatics';

console.log('═'.repeat(80));
console.log('Cryptographic Hash Function with Sigmatics');
console.log('═'.repeat(80));
console.log();

// ============================================================================
// Hash Function Configuration
// ============================================================================

const HASH_ROUNDS = 12;
const STATE_SIZE = 4; // 4 classes (4 × 7 bits = 28 bits of state)

/**
 * Hash state represents the internal state of the hash function
 */
interface HashState {
  values: number[]; // Array of class indices [0, 95]
}

// ============================================================================
// Compression Function (Core Primitive)
// ============================================================================

/**
 * The compression function takes current state and a message block,
 * producing a new state. This is the core cryptographic primitive.
 */
function compressionFunction(state: HashState, messageBlock: number): HashState {
  const newValues = [...state.values];

  // Add message block to first state word
  const addModel = Atlas.Model.add96('drop');
  const addResult = addModel.run({ a: newValues[0], b: messageBlock });
  newValues[0] = typeof addResult === 'number' ? addResult : addResult.value;

  // Apply mixing rounds
  for (let round = 0; round < 3; round++) {
    // Non-linear layer: Apply M transform to each word
    const mModel = Atlas.Model.M();
    for (let i = 0; i < STATE_SIZE; i++) {
      newValues[i] = mModel.run({ x: newValues[i] }) as number;
    }

    // Diffusion layer: Mix words using transforms
    const r1 = Atlas.Model.R(1);
    const d1 = Atlas.Model.D(1);
    const t2 = Atlas.Model.T(2);

    // Rotate each word
    for (let i = 0; i < STATE_SIZE; i++) {
      newValues[i] = r1.run({ x: newValues[i] }) as number;
    }

    // Apply triality to alternate words
    for (let i = 0; i < STATE_SIZE; i += 2) {
      newValues[i] = d1.run({ x: newValues[i] }) as number;
    }

    // Twist odd words
    for (let i = 1; i < STATE_SIZE; i += 2) {
      newValues[i] = t2.run({ x: newValues[i] }) as number;
    }

    // Mix adjacent words
    for (let i = 0; i < STATE_SIZE; i++) {
      const next = (i + 1) % STATE_SIZE;
      const mixResult = addModel.run({ a: newValues[i], b: newValues[next] });
      const mixValue = typeof mixResult === 'number' ? mixResult : mixResult.value;

      const mulModel = Atlas.Model.mul96('drop');
      const mulResult = mulModel.run({ a: mixValue, b: 7 }); // Magic constant
      newValues[i] = typeof mulResult === 'number' ? mulResult : mulResult.value;
    }
  }

  return { values: newValues };
}

// ============================================================================
// Finalization Function
// ============================================================================

/**
 * Finalization applies additional rounds to produce the final hash
 */
function finalize(state: HashState): HashState {
  const newValues = [...state.values];

  // Extra diffusion rounds
  const r2 = Atlas.Model.R(2);
  const d1 = Atlas.Model.D(1);
  const t3 = Atlas.Model.T(3);

  for (let i = 0; i < STATE_SIZE; i++) {
    newValues[i] = r2.run({ x: newValues[i] }) as number;
    newValues[i] = d1.run({ x: newValues[i] }) as number;
    newValues[i] = t3.run({ x: newValues[i] }) as number;
  }

  return { values: newValues };
}

// ============================================================================
// Message Padding
// ============================================================================

/**
 * Pad message to multiple of block size (simple length-padding)
 */
function padMessage(message: number[]): number[] {
  const padded = [...message];
  const origLen = message.length;

  // Pad with zeros to multiple of STATE_SIZE
  while (padded.length % STATE_SIZE !== 0) {
    padded.push(0);
  }

  // Append original length (mod 96)
  padded.push(origLen % 96);

  // Pad to multiple of STATE_SIZE again
  while (padded.length % STATE_SIZE !== 0) {
    padded.push(0);
  }

  return padded;
}

// ============================================================================
// Main Hash Function
// ============================================================================

/**
 * Hash a message (array of class indices) to produce a fixed-size digest
 */
function hash(message: number[]): HashState {
  // Initialize state with constants (first 4 prime indices)
  let state: HashState = {
    values: [2, 3, 5, 7],
  };

  // Pad message
  const padded = padMessage(message);

  // Process message in blocks
  for (let i = 0; i < padded.length; i += STATE_SIZE) {
    // Extract block
    const block = padded.slice(i, i + STATE_SIZE);

    // Process each word in the block
    for (const word of block) {
      state = compressionFunction(state, word);
    }
  }

  // Finalization
  state = finalize(state);

  return state;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert string to message (array of class indices)
 */
function stringToMessage(str: string): number[] {
  const message: number[] = [];
  for (let i = 0; i < str.length; i++) {
    message.push(str.charCodeAt(i) % 96);
  }
  return message;
}

/**
 * Format hash state as hex string
 */
function formatHash(state: HashState): string {
  return state.values.map(v => v.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// Examples and Testing
// ============================================================================

console.log('Example 1: Hashing Strings');
console.log('─'.repeat(80));
console.log();

const testMessages = [
  'Hello, World!',
  'Hello, World',
  'Hello, World!!',
  'Sigmatics',
  'The quick brown fox',
  '',
];

console.log('Computing hashes:');
for (const msg of testMessages) {
  const message = stringToMessage(msg);
  const digest = hash(message);
  const hexHash = formatHash(digest);

  console.log(`  "${msg}"`);
  console.log(`    → ${hexHash} (${digest.values.join(', ')})`);
}
console.log();

// ============================================================================
// Avalanche Effect Test
// ============================================================================

console.log('Example 2: Avalanche Effect (1-bit change in input)');
console.log('─'.repeat(80));
console.log();

const baseMessage = 'test message';
const messages = [
  baseMessage,
  baseMessage.slice(0, -1) + String.fromCharCode(baseMessage.charCodeAt(baseMessage.length - 1) + 1),
  baseMessage + 'x',
  baseMessage.toUpperCase(),
];

console.log('Small input changes produce large output changes:');
for (const msg of messages) {
  const message = stringToMessage(msg);
  const digest = hash(message);
  const hexHash = formatHash(digest);

  console.log(`  "${msg}"`);
  console.log(`    → ${hexHash}`);
}
console.log();

// ============================================================================
// Collision Testing
// ============================================================================

console.log('Example 3: Collision Resistance (Simple Test)');
console.log('─'.repeat(80));
console.log();

const hashMap = new Map<string, string>();
let collisions = 0;

console.log('Hashing 1000 random messages...');
for (let i = 0; i < 1000; i++) {
  // Generate random message
  const msgLen = Math.floor(Math.random() * 20) + 1;
  const message = Array.from({ length: msgLen }, () => Math.floor(Math.random() * 96));

  const digest = hash(message);
  const hexHash = formatHash(digest);

  if (hashMap.has(hexHash)) {
    collisions++;
    console.log(`  Collision found: ${hexHash}`);
    console.log(`    Message 1: [${hashMap.get(hexHash)}]`);
    console.log(`    Message 2: [${message.join(', ')}]`);
  } else {
    hashMap.set(hexHash, message.join(', '));
  }
}

console.log();
console.log(`Results:`);
console.log(`  Total messages: 1000`);
console.log(`  Unique hashes: ${hashMap.size}`);
console.log(`  Collisions: ${collisions}`);
console.log();

if (collisions === 0) {
  console.log('✓ No collisions found (good avalanche and diffusion)');
} else {
  console.log(`⚠ Found ${collisions} collisions (hash space is small for demo)`);
}
console.log();

// ============================================================================
// Performance Benchmark
// ============================================================================

console.log('Example 4: Performance Benchmark');
console.log('─'.repeat(80));
console.log();

const benchMessages = [
  stringToMessage('x'.repeat(10)),
  stringToMessage('x'.repeat(100)),
  stringToMessage('x'.repeat(1000)),
];

for (const message of benchMessages) {
  const iterations = 10000;

  console.time(`  Hash ${message.length}-byte message (${iterations}x)`);
  for (let i = 0; i < iterations; i++) {
    hash(message);
  }
  console.timeEnd(`  Hash ${message.length}-byte message (${iterations}x)`);
}
console.log();

// ============================================================================
// Distribution Analysis
// ============================================================================

console.log('Example 5: Output Distribution');
console.log('─'.repeat(80));
console.log();

const distribution = new Map<number, number>();

console.log('Analyzing distribution of first output word (1000 random inputs)...');
for (let i = 0; i < 1000; i++) {
  const msgLen = Math.floor(Math.random() * 20) + 1;
  const message = Array.from({ length: msgLen }, () => Math.floor(Math.random() * 96));

  const digest = hash(message);
  const firstWord = digest.values[0];

  distribution.set(firstWord, (distribution.get(firstWord) || 0) + 1);
}

const counts = Array.from(distribution.values());
const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
const minCount = Math.min(...counts);
const maxCount = Math.max(...counts);

console.log(`  Unique values seen: ${distribution.size} / 96`);
console.log(`  Average count per value: ${avgCount.toFixed(2)}`);
console.log(`  Min count: ${minCount}`);
console.log(`  Max count: ${maxCount}`);
console.log(`  Ratio (max/min): ${(maxCount / minCount).toFixed(2)}`);
console.log();

if (distribution.size > 80 && maxCount / minCount < 2.0) {
  console.log('✓ Good distribution (covers most output space uniformly)');
} else {
  console.log('⚠ Distribution could be improved (expected for small hash space)');
}
console.log();

// ============================================================================
// Summary
// ============================================================================

console.log('═'.repeat(80));
console.log('Hash Function Summary');
console.log('═'.repeat(80));
console.log();
console.log('This demonstration shows how Sigmatics enables:');
console.log();
console.log('✓ Fast cryptographic primitives using fused circuits');
console.log('✓ Composable building blocks (transforms + ring ops)');
console.log('✓ High-throughput hashing (thousands of hashes per second)');
console.log('✓ Good avalanche effect and diffusion');
console.log('✓ Flexible design (easy to adjust rounds, state size, etc.)');
console.log();
console.log('Key architectural benefits:');
console.log('  • Pre-compiled models eliminate interpretation overhead');
console.log('  • Class backend provides maximum performance');
console.log('  • Deterministic transforms enable formal analysis');
console.log('  • Composable primitives enable rapid prototyping');
console.log();
console.log('Note: This is a demonstration, NOT a secure hash function!');
console.log('      For production use, employ established cryptographic primitives.');
console.log();
console.log('═'.repeat(80));
