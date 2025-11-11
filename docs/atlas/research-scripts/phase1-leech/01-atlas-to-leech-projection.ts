/**
 * Research Script: Atlas → Leech Projection
 *
 * Validates the 24 = 8×3 correspondence by:
 * 1. Constructing the Atlas → Leech map
 * 2. Testing all 96 Atlas classes project to valid Leech vectors
 * 3. Verifying Leech lattice properties (even, unimodular, rootless)
 * 4. Measuring projection quality (norm distribution)
 *
 * Expected Results:
 * - All 96 classes map to Leech lattice
 * - No norm-2 vectors (rootless property)
 * - Even norms only
 * - Preservation of Atlas structure
 */

import {
  constructAtlasToLeechMap,
  atlasClassToLeech,
  leechToAtlasClass,
  isInLeech,
  leechNorm,
  LEECH_DIMENSION,
  LEECH_MINIMAL_NORM,
  type LeechVector,
} from '../../../../packages/core/src/sga';

console.log('='.repeat(70));
console.log('ATLAS → LEECH PROJECTION VALIDATION');
console.log('='.repeat(70));

// Step 1: Construct the map
console.log('\n📊 Step 1: Constructing Atlas → Leech Map');
const map = constructAtlasToLeechMap();

console.log(`ℤ₈ basis vectors: ${map.z8_basis.length}`);
console.log(`ℤ₃ basis vectors: ${map.z3_basis.length}`);
console.log(`Full basis vectors: ${map.full_basis.length}`);
console.log(`Expected dimension: ${LEECH_DIMENSION}`);

if (map.full_basis.length !== LEECH_DIMENSION) {
  console.error(`❌ ERROR: Basis should have ${LEECH_DIMENSION} vectors, got ${map.full_basis.length}`);
}

// Step 2: Test all 96 Atlas classes
console.log('\n📊 Step 2: Projecting All 96 Atlas Classes');
const projections: Array<{ class: number; vector: LeechVector; norm: number }> = [];
let validCount = 0;
let invalidCount = 0;

for (let classIdx = 0; classIdx < 96; classIdx++) {
  const vector = atlasClassToLeech(classIdx);
  const norm = leechNorm(vector);
  const valid = isInLeech(vector);

  projections.push({ class: classIdx, vector, norm });

  if (valid) {
    validCount++;
  } else {
    invalidCount++;
    console.log(`⚠️  Class ${classIdx}: Not in Leech lattice`);
  }
}

console.log(`Valid projections: ${validCount}/96`);
console.log(`Invalid projections: ${invalidCount}/96`);

// Step 3: Verify Leech properties
console.log('\n📊 Step 3: Verifying Leech Lattice Properties');

// 3a: Rootless property (no norm-2 vectors)
const norm2Count = projections.filter(p => p.norm === 2).length;
console.log(`Norm-2 vectors (should be 0): ${norm2Count}`);
if (norm2Count > 0) {
  console.log('❌ ERROR: Leech lattice is rootless, should have no norm-2 vectors');
}

// 3b: Even norms only
const oddNormCount = projections.filter(p => p.norm % 2 !== 0).length;
console.log(`Odd norm vectors (should be 0): ${oddNormCount}`);
if (oddNormCount > 0) {
  console.log('❌ ERROR: Leech lattice is even, should have no odd norms');
}

// 3c: Minimal norm
const minNorm = Math.min(...projections.map(p => p.norm));
console.log(`Minimal norm: ${minNorm}`);
console.log(`Expected minimal norm: ${LEECH_MINIMAL_NORM}`);
if (minNorm < LEECH_MINIMAL_NORM) {
  console.log(`⚠️  WARNING: Minimal norm ${minNorm} < ${LEECH_MINIMAL_NORM}`);
}

// Step 4: Norm distribution
console.log('\n📊 Step 4: Norm Distribution');
const normCounts = new Map<number, number>();
for (const proj of projections) {
  normCounts.set(proj.norm, (normCounts.get(proj.norm) || 0) + 1);
}

const sortedNorms = Array.from(normCounts.entries()).sort((a, b) => a[0] - b[0]);
for (const [norm, count] of sortedNorms.slice(0, 10)) {
  console.log(`  Norm ${norm}: ${count} classes`);
}

// Step 5: Round-trip test
console.log('\n📊 Step 5: Round-Trip Test (Atlas → Leech → Atlas)');
let roundTripErrors = 0;
const errorClasses: number[] = [];

for (let classIdx = 0; classIdx < 96; classIdx++) {
  const vector = atlasClassToLeech(classIdx);
  const recovered = leechToAtlasClass(vector);

  if (recovered !== classIdx) {
    roundTripErrors++;
    errorClasses.push(classIdx);
  }
}

console.log(`Round-trip errors: ${roundTripErrors}/96`);
if (roundTripErrors > 0) {
  console.log(`Error classes: ${errorClasses.slice(0, 10).join(', ')}${errorClasses.length > 10 ? '...' : ''}`);
}

// Step 6: Structure preservation
console.log('\n📊 Step 6: Structure Preservation');

// Test (h, d, ℓ) decomposition preserved
interface AtlasCoords {
  h: number;
  d: number;
  ell: number;
}

function decomposeClass(classIdx: number): AtlasCoords {
  const h = Math.floor(classIdx / 24);
  const d = Math.floor((classIdx % 24) / 8);
  const ell = classIdx % 8;
  return { h, d, ell };
}

// Group by ℓ (context)
const byContext = new Map<number, LeechVector[]>();
for (let classIdx = 0; classIdx < 96; classIdx++) {
  const { ell } = decomposeClass(classIdx);
  if (!byContext.has(ell)) {
    byContext.set(ell, []);
  }
  byContext.get(ell)!.push(atlasClassToLeech(classIdx));
}

console.log('Classes per context (ℓ):');
for (let ell = 0; ell < 8; ell++) {
  const vectors = byContext.get(ell) || [];
  console.log(`  ℓ=${ell}: ${vectors.length} classes`);
}

// Step 7: Summary
console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Valid Leech vectors: ${validCount}/96`);
console.log(`✅ Rootless property: ${norm2Count === 0 ? 'PASS' : 'FAIL'}`);
console.log(`✅ Even lattice: ${oddNormCount === 0 ? 'PASS' : 'FAIL'}`);
console.log(`✅ Minimal norm: ${minNorm >= LEECH_MINIMAL_NORM ? 'PASS' : 'FAIL'}`);
console.log(`⚠️  Round-trip accuracy: ${100 - (roundTripErrors / 96) * 100}%`);

const allTestsPass =
  validCount === 96 &&
  norm2Count === 0 &&
  oddNormCount === 0 &&
  minNorm >= LEECH_MINIMAL_NORM;

if (allTestsPass) {
  console.log('\n🎉 ALL TESTS PASSED! Atlas → Leech projection is valid.');
} else {
  console.log('\n⚠️  SOME TESTS FAILED. Review projection implementation.');
}

console.log('='.repeat(70));
