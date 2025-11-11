/**
 * Research Script: Partial Kissing Sphere Validation (Types 1 & 2)
 *
 * Validates the implementation of Types 1 and 2 Leech minimal vectors.
 *
 * Tests:
 * 1. Type 1 count = 1,104
 * 2. Type 2 count = 97,152
 * 3. All vectors have norm² = 8
 * 4. No duplicates within each type
 * 5. No overlap between Type 1 and Type 2
 *
 * Note: Type 3 construction requires further research.
 */

import {
  generateType1Vectors,
  generateType2Vectors,
} from '../../../../packages/core/src/sga';

console.log('='.repeat(70));
console.log('LEECH KISSING SPHERE - PARTIAL VALIDATION (TYPES 1 & 2)');
console.log('='.repeat(70));

// Helper: Compute norm²
function normSquared(v: number[]): number {
  return v.reduce((sum, x) => sum + x * x, 0);
}

// Helper: Vector to string for Set-based deduplication
function vectorToString(v: number[]): string {
  return v.join(',');
}

// Helper: Count nonzero coordinates
function countNonzero(v: number[]): number {
  return v.filter(x => x !== 0).length;
}

// Step 1: Generate Type 1 vectors
console.log('\n📊 Step 1: Type 1 Vectors (±2, ±2, 0²²)');

const startType1 = Date.now();
const type1 = generateType1Vectors();
const timeType1 = Date.now() - startType1;

console.log(`\nGenerated ${type1.length.toLocaleString()} vectors in ${timeType1}ms`);
console.log(`Expected: 1,104`);

if (type1.length === 1104) {
  console.log('✅ Type 1 count correct!');
} else {
  console.log(`❌ ERROR: Expected 1,104, got ${type1.length}`);
}

// Analyze Type 1
const type1Norms: { [norm: number]: number } = {};
const type1Nonzeros: { [count: number]: number } = {};

for (const v of type1) {
  const norm = normSquared(v);
  type1Norms[norm] = (type1Norms[norm] || 0) + 1;

  const nz = countNonzero(v);
  type1Nonzeros[nz] = (type1Nonzeros[nz] || 0) + 1;
}

console.log('\nType 1 norm² distribution:');
for (const [norm, count] of Object.entries(type1Norms).sort((a, b) => Number(a[0]) - Number(b[0]))) {
  const match = Number(norm) === 8;
  console.log(`  Norm² ${norm}: ${count} vectors ${match ? '✅' : '❌'}`);
}

console.log('\nType 1 nonzero count distribution:');
for (const [nz, count] of Object.entries(type1Nonzeros).sort((a, b) => Number(a[0]) - Number(b[0]))) {
  const match = Number(nz) === 2;
  console.log(`  ${nz} nonzero coords: ${count} vectors ${match ? '✅' : '❌'}`);
}

// Check for duplicates in Type 1
const type1Set = new Set<string>();
let type1Duplicates = 0;
for (const v of type1) {
  const key = vectorToString(v);
  if (type1Set.has(key)) {
    type1Duplicates++;
  } else {
    type1Set.add(key);
  }
}

console.log(`\nType 1 duplicates: ${type1Duplicates} ${type1Duplicates === 0 ? '✅' : '❌'}`);
console.log(`Type 1 unique: ${type1Set.size}`);

// Step 2: Generate Type 2 vectors
console.log('\n📊 Step 2: Type 2 Vectors (±2⁸, 0¹⁶)');

const startType2 = Date.now();
const type2 = generateType2Vectors();
const timeType2 = Date.now() - startType2;

console.log(`\nGenerated ${type2.length.toLocaleString()} vectors in ${timeType2}ms`);
console.log(`Expected: 97,152`);

if (type2.length === 97152) {
  console.log('✅ Type 2 count correct!');
} else {
  console.log(`❌ ERROR: Expected 97,152, got ${type2.length}`);
}

// Analyze Type 2
const type2Norms: { [norm: number]: number } = {};
const type2Nonzeros: { [count: number]: number } = {};

for (const v of type2) {
  const norm = normSquared(v);
  type2Norms[norm] = (type2Norms[norm] || 0) + 1;

  const nz = countNonzero(v);
  type2Nonzeros[nz] = (type2Nonzeros[nz] || 0) + 1;
}

console.log('\nType 2 norm² distribution:');
for (const [norm, count] of Object.entries(type2Norms).sort((a, b) => Number(a[0]) - Number(b[0]))) {
  const match = Number(norm) === 8;
  console.log(`  Norm² ${norm}: ${count} vectors ${match ? '✅' : '❌'}`);
}

console.log('\nType 2 nonzero count distribution:');
for (const [nz, count] of Object.entries(type2Nonzeros).sort((a, b) => Number(a[0]) - Number(b[0]))) {
  const match = Number(nz) === 8;
  console.log(`  ${nz} nonzero coords: ${count} vectors ${match ? '✅' : '❌'}`);
}

// Check for duplicates in Type 2
const type2Set = new Set<string>();
let type2Duplicates = 0;
for (const v of type2) {
  const key = vectorToString(v);
  if (type2Set.has(key)) {
    type2Duplicates++;
  } else {
    type2Set.add(key);
  }
}

console.log(`\nType 2 duplicates: ${type2Duplicates} ${type2Duplicates === 0 ? '✅' : '❌'}`);
console.log(`Type 2 unique: ${type2Set.size}`);

// Step 3: Check overlap between Type 1 and Type 2
console.log('\n📊 Step 3: Overlap Between Type 1 and Type 2');

let overlap = 0;
for (const v of type2) {
  const key = vectorToString(v);
  if (type1Set.has(key)) {
    overlap++;
  }
}

console.log(`\nOverlap: ${overlap} vectors ${overlap === 0 ? '✅' : '❌'}`);

if (overlap > 0) {
  console.log('⚠️  WARNING: Type 1 and Type 2 have overlapping vectors!');
  console.log('   This violates the disjoint sets property.');
}

// Step 4: Combined statistics
console.log('\n📊 Step 4: Combined Statistics');

const totalUnique = type1Set.size + (type2Set.size - overlap);
console.log(`\nTotal Type 1: ${type1.length.toLocaleString()}`);
console.log(`Total Type 2: ${type2.length.toLocaleString()}`);
console.log(`Combined: ${(type1.length + type2.length).toLocaleString()}`);
console.log(`Unique (after dedup): ${totalUnique.toLocaleString()}`);

console.log(`\nTarget for Types 1+2: 1,104 + 97,152 = 98,256`);
const combinedTarget = 1104 + 97152;
if (type1.length + type2.length === combinedTarget) {
  console.log('✅ Combined count matches target!');
} else {
  console.log(`❌ Combined count mismatch: got ${type1.length + type2.length}, expected ${combinedTarget}`);
}

// Step 5: Performance metrics
console.log('\n📊 Step 5: Performance Metrics');

console.log(`\nType 1 generation: ${timeType1}ms`);
console.log(`  Average: ${(timeType1 / type1.length).toFixed(3)}ms per vector`);

console.log(`\nType 2 generation: ${timeType2}ms`);
console.log(`  Average: ${(timeType2 / type2.length).toFixed(3)}ms per vector`);

const totalTime = timeType1 + timeType2;
const totalVectors = type1.length + type2.length;
console.log(`\nTotal generation time: ${totalTime}ms`);
console.log(`Overall average: ${(totalTime / totalVectors).toFixed(3)}ms per vector`);

// Memory estimate
const bytesPerVector = 24 * 8; // 24 numbers × 8 bytes (Float64)
const totalMemory = totalVectors * bytesPerVector;
console.log(`\nMemory usage: ~${(totalMemory / 1024 / 1024).toFixed(2)} MB`);

// Step 6: Next steps
console.log('\n📊 Step 6: Remaining Work');

console.log('\n⏸️  Type 3 construction requires further research:');
console.log('  - Expected count: 98,304 = 4,096 × 24');
console.log('  - Must be DISJOINT from Types 1 and 2');
console.log('  - Pattern must NOT be (±2, ±2, 0²²)');
console.log('  - Likely uses different coord structure');
console.log('  - Total target: 196,560 = 1,104 + 97,152 + 98,304');

// Step 7: Summary
console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

const type1Pass = type1.length === 1104 &&
  Object.keys(type1Norms).length === 1 &&
  Number(Object.keys(type1Norms)[0]) === 8 &&
  type1Duplicates === 0;

const type2Pass = type2.length === 97152 &&
  Object.keys(type2Norms).length === 1 &&
  Number(Object.keys(type2Norms)[0]) === 8 &&
  type2Duplicates === 0;

const overlapPass = overlap === 0;

console.log(`\n✅ Type 1 validation: ${type1Pass ? 'PASS' : 'FAIL'}`);
console.log(`  - Count: ${type1.length} ${type1.length === 1104 ? '✓' : '✗'}`);
console.log(`  - Norm² = 8: ${Object.keys(type1Norms).length === 1 && Number(Object.keys(type1Norms)[0]) === 8 ? '✓' : '✗'}`);
console.log(`  - No duplicates: ${type1Duplicates === 0 ? '✓' : '✗'}`);

console.log(`\n✅ Type 2 validation: ${type2Pass ? 'PASS' : 'FAIL'}`);
console.log(`  - Count: ${type2.length.toLocaleString()} ${type2.length === 97152 ? '✓' : '✗'}`);
console.log(`  - Norm² = 8: ${Object.keys(type2Norms).length === 1 && Number(Object.keys(type2Norms)[0]) === 8 ? '✓' : '✗'}`);
console.log(`  - No duplicates: ${type2Duplicates === 0 ? '✓' : '✗'}`);

console.log(`\n✅ Disjointness: ${overlapPass ? 'PASS' : 'FAIL'}`);
console.log(`  - Type 1 ∩ Type 2 = ∅: ${overlap === 0 ? '✓' : '✗'}`);

if (type1Pass && type2Pass && overlapPass) {
  console.log('\n🎉 Types 1 and 2 are correctly implemented!');
  console.log('   Ready for Type 3 research and implementation.');
} else {
  console.log('\n❌ Some validations failed - review implementation!');
}

console.log('='.repeat(70));
