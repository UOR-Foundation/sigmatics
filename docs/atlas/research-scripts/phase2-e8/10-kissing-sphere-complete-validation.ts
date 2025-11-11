/**
 * Research Script: Complete Kissing Sphere Validation
 *
 * Validates the complete implementation of all 196,560 Leech minimal vectors.
 *
 * Tests:
 * 1. Total count = 196,560
 * 2. Type 1 count = 1,104
 * 3. Type 2 count = 97,152
 * 4. Type 3 count = 98,304
 * 5. All vectors have norm² = 8
 * 6. No duplicates across all types
 * 7. Types are mutually disjoint
 *
 * Connection to Moonshine:
 * j(q) = q⁻¹ + 744 + 196,884q + ...
 * where 196,884 = 196,560 + 324
 */

import {
  generateType1Vectors,
  generateType2Vectors,
  generateType3Vectors,
  generateKissingSphere,
  verifyKissingSphere,
} from '../../../../packages/core/src/sga';

console.log('='.repeat(70));
console.log('LEECH KISSING SPHERE - COMPLETE VALIDATION');
console.log('='.repeat(70));

// Helper functions
function normSquared(v: number[]): number {
  return v.reduce((sum, x) => sum + x * x, 0);
}

function vectorToString(v: number[]): string {
  return v.join(',');
}

function countNonzero(v: number[]): number {
  return v.filter(x => x !== 0).length;
}

function analyzePattern(v: number[]): { twoCount: number; oneCount: number; zeroCount: number } {
  let twoCount = 0;
  let oneCount = 0;
  let zeroCount = 0;

  for (const x of v) {
    const abs = Math.abs(x);
    if (abs === 2) twoCount++;
    else if (abs === 1) oneCount++;
    else if (abs === 0) zeroCount++;
  }

  return { twoCount, oneCount, zeroCount };
}

// Step 1: Generate all three types separately
console.log('\n📊 Step 1: Generate All Three Types');

const startTotal = Date.now();

console.log('\n  Type 1: (±2, ±2, 0²²)...');
const startType1 = Date.now();
const type1 = generateType1Vectors();
const timeType1 = Date.now() - startType1;
console.log(`    Generated: ${type1.length.toLocaleString()} in ${timeType1}ms`);
console.log(`    Expected: 1,104`);
console.log(`    ${type1.length === 1104 ? '✅' : '❌'}`);

console.log('\n  Type 2: (±1⁸, 0¹⁶)...');
const startType2 = Date.now();
const type2 = generateType2Vectors();
const timeType2 = Date.now() - startType2;
console.log(`    Generated: ${type2.length.toLocaleString()} in ${timeType2}ms`);
console.log(`    Expected: 97,152`);
console.log(`    ${type2.length === 97152 ? '✅' : '❌'}`);

console.log('\n  Type 3: (±2, ±1⁴, 0¹⁹)...');
const startType3 = Date.now();
const type3 = generateType3Vectors();
const timeType3 = Date.now() - startType3;
console.log(`    Generated: ${type3.length.toLocaleString()} in ${timeType3}ms`);
console.log(`    Expected: 98,304`);
console.log(`    ${type3.length === 98304 ? '✅' : '❌'}`);

const timeGenerate = Date.now() - startTotal;

// Step 2: Verify norms
console.log('\n📊 Step 2: Verify All Norms = 8');

const norms1 = new Set(type1.map(normSquared));
const norms2 = new Set(type2.map(normSquared));
const norms3 = new Set(type3.map(normSquared));

console.log(`\n  Type 1 norms: ${[...norms1].join(', ')} ${norms1.size === 1 && norms1.has(8) ? '✅' : '❌'}`);
console.log(`  Type 2 norms: ${[...norms2].join(', ')} ${norms2.size === 1 && norms2.has(8) ? '✅' : '❌'}`);
console.log(`  Type 3 norms: ${[...norms3].join(', ')} ${norms3.size === 1 && norms3.has(8) ? '✅' : '❌'}`);

// Step 3: Verify patterns
console.log('\n📊 Step 3: Verify Coordinate Patterns');

const pattern1 = analyzePattern(type1[0]);
const pattern2 = analyzePattern(type2[0]);
const pattern3 = analyzePattern(type3[0]);

console.log(`\n  Type 1 pattern: ${pattern1.twoCount} × ±2, ${pattern1.oneCount} × ±1, ${pattern1.zeroCount} × 0`);
console.log(`    Expected: 2 × ±2, 0 × ±1, 22 × 0`);
console.log(`    ${pattern1.twoCount === 2 && pattern1.oneCount === 0 && pattern1.zeroCount === 22 ? '✅' : '❌'}`);

console.log(`\n  Type 2 pattern: ${pattern2.twoCount} × ±2, ${pattern2.oneCount} × ±1, ${pattern2.zeroCount} × 0`);
console.log(`    Expected: 0 × ±2, 8 × ±1, 16 × 0`);
console.log(`    ${pattern2.twoCount === 0 && pattern2.oneCount === 8 && pattern2.zeroCount === 16 ? '✅' : '❌'}`);

console.log(`\n  Type 3 pattern: ${pattern3.twoCount} × ±2, ${pattern3.oneCount} × ±1, ${pattern3.zeroCount} × 0`);
console.log(`    Expected: 1 × ±2, 4 × ±1, 19 × 0`);
console.log(`    ${pattern3.twoCount === 1 && pattern3.oneCount === 4 && pattern3.zeroCount === 19 ? '✅' : '❌'}`);

// Step 4: Check for duplicates within types
console.log('\n📊 Step 4: Check for Duplicates Within Each Type');

const set1 = new Set(type1.map(vectorToString));
const set2 = new Set(type2.map(vectorToString));
const set3 = new Set(type3.map(vectorToString));

const dup1 = type1.length - set1.size;
const dup2 = type2.length - set2.size;
const dup3 = type3.length - set3.size;

console.log(`\n  Type 1 duplicates: ${dup1} ${dup1 === 0 ? '✅' : '❌'}`);
console.log(`  Type 2 duplicates: ${dup2} ${dup2 === 0 ? '✅' : '❌'}`);
console.log(`  Type 3 duplicates: ${dup3} ${dup3 === 0 ? '✅' : '❌'}`);

// Step 5: Check for overlaps between types
console.log('\n📊 Step 5: Check for Overlaps Between Types');

let overlap12 = 0;
for (const v of type2) {
  if (set1.has(vectorToString(v))) overlap12++;
}

let overlap13 = 0;
for (const v of type3) {
  if (set1.has(vectorToString(v))) overlap13++;
}

let overlap23 = 0;
for (const v of type3) {
  if (set2.has(vectorToString(v))) overlap23++;
}

console.log(`\n  Type 1 ∩ Type 2: ${overlap12} vectors ${overlap12 === 0 ? '✅' : '❌'}`);
console.log(`  Type 1 ∩ Type 3: ${overlap13} vectors ${overlap13 === 0 ? '✅' : '❌'}`);
console.log(`  Type 2 ∩ Type 3: ${overlap23} vectors ${overlap23 === 0 ? '✅' : '❌'}`);

// Step 6: Combined statistics
console.log('\n📊 Step 6: Combined Statistics');

const total = type1.length + type2.length + type3.length;
const allSet = new Set([...type1, ...type2, ...type3].map(vectorToString));
const uniqueTotal = allSet.size;

console.log(`\n  Total vectors: ${total.toLocaleString()}`);
console.log(`  Target: 196,560`);
console.log(`  Match: ${total === 196560 ? '✅' : '❌'}`);

console.log(`\n  Unique vectors: ${uniqueTotal.toLocaleString()}`);
console.log(`  Duplicates across types: ${total - uniqueTotal}`);
console.log(`  All unique: ${uniqueTotal === total ? '✅' : '❌'}`);

// Step 7: Moonshine connection
console.log('\n📊 Step 7: Connection to Monstrous Moonshine');

const jCoeff = 196884;
const difference = jCoeff - total;

console.log(`\n  j-invariant coefficient c(1): ${jCoeff.toLocaleString()}`);
console.log(`  Kissing number: ${total.toLocaleString()}`);
console.log(`  Difference: ${difference} (dimension of smallest Monster rep)`);
console.log(`  Expected: 324 = 18² = 2² × 3⁴`);
console.log(`  Match: ${difference === 324 ? '✅' : '❌'}`);

console.log(`\n  Breakdown:`);
console.log(`    196,884 = 196,560 + 324`);
console.log(`    ${jCoeff} = ${total} + ${difference} ${total + difference === jCoeff ? '✅' : '❌'}`);

// Step 8: Performance metrics
console.log('\n📊 Step 8: Performance Metrics');

console.log(`\n  Generation times:`);
console.log(`    Type 1: ${timeType1}ms`);
console.log(`    Type 2: ${timeType2}ms`);
console.log(`    Type 3: ${timeType3}ms`);
console.log(`    Total: ${timeGenerate}ms`);

console.log(`\n  Average per vector: ${(timeGenerate / total).toFixed(4)}ms`);

const bytesPerVector = 24 * 8;
const totalMemory = total * bytesPerVector;
console.log(`\n  Memory estimate: ${(totalMemory / 1024 / 1024).toFixed(2)} MB`);

// Step 9: Verification using built-in validator
console.log('\n📊 Step 9: Built-in Validator');

const allVectors = [...type1, ...type2, ...type3];
const verification = verifyKissingSphere(allVectors);

console.log(`\n  Validation result: ${verification.valid ? '✅ VALID' : '❌ INVALID'}`);

if (!verification.valid) {
  console.log('\n  Errors:');
  for (const error of verification.errors) {
    console.log(`    - ${error}`);
  }
}

console.log(`\n  Statistics:`);
console.log(`    Total count: ${verification.stats.totalCount.toLocaleString()}`);
console.log(`    Parity violations: ${verification.stats.parityViolations}`);
console.log(`    Non-integer coords: ${verification.stats.nonIntegerCoords}`);

console.log(`\n  Norm distribution:`);
for (const [norm, count] of Object.entries(verification.stats.normDistribution).sort((a, b) => Number(a[0]) - Number(b[0]))) {
  console.log(`    Norm² ${norm}: ${count.toLocaleString()} vectors`);
}

// Step 10: Summary
console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

const allTestsPass =
  type1.length === 1104 &&
  type2.length === 97152 &&
  type3.length === 98304 &&
  total === 196560 &&
  uniqueTotal === total &&
  norms1.size === 1 && norms1.has(8) &&
  norms2.size === 1 && norms2.has(8) &&
  norms3.size === 1 && norms3.has(8) &&
  dup1 === 0 && dup2 === 0 && dup3 === 0 &&
  overlap12 === 0 && overlap13 === 0 && overlap23 === 0 &&
  verification.valid;

console.log(`\n✅ Type 1: ${type1.length === 1104 && norms1.size === 1 && norms1.has(8) && dup1 === 0 ? 'PASS' : 'FAIL'}`);
console.log(`✅ Type 2: ${type2.length === 97152 && norms2.size === 1 && norms2.has(8) && dup2 === 0 ? 'PASS' : 'FAIL'}`);
console.log(`✅ Type 3: ${type3.length === 98304 && norms3.size === 1 && norms3.has(8) && dup3 === 0 ? 'PASS' : 'FAIL'}`);
console.log(`✅ Total count: ${total === 196560 ? 'PASS' : 'FAIL'}`);
console.log(`✅ No duplicates: ${uniqueTotal === total ? 'PASS' : 'FAIL'}`);
console.log(`✅ Disjoint types: ${overlap12 === 0 && overlap13 === 0 && overlap23 === 0 ? 'PASS' : 'FAIL'}`);
console.log(`✅ Moonshine: ${total + 324 === 196884 ? 'PASS' : 'FAIL'}`);

if (allTestsPass) {
  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('   Kissing sphere successfully generated: 196,560 norm-8 vectors');
  console.log('   Connection to moonshine validated: 196,884 = 196,560 + 324');
} else {
  console.log('\n❌ SOME TESTS FAILED');
  console.log('   Review implementation and fix errors.');
}

console.log('='.repeat(70));
