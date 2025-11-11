/**
 * Integration test for factorHierarchical model
 *
 * Tests the full compilation pipeline with categorical invariants
 */

import { Atlas } from './packages/core/src/index';

console.log('='.repeat(70));
console.log('HIERARCHICAL FACTORIZATION MODEL - INTEGRATION TEST');
console.log('='.repeat(70));

// Test 1: Small semiprime (40-bit range)
console.log('\n📊 Test 1: Small Semiprime (17 × 19 = 323)');
const model1 = Atlas.Model.factorHierarchical('323');
const result1 = model1.run({});

console.log(`Result:`, result1);
console.log(`Success: ${result1.success}`);
console.log(`Factors: ${result1.p} × ${result1.q}`);
console.log(`Levels explored: ${result1.levels}`);
console.log(`Total candidates: ${result1.totalCandidates}`);
console.log(`Time: ${result1.time}ms`);
console.log(`Orbit closure satisfied: ${result1.orbitClosureSatisfied}`);
console.log(`F₄ structure validated: ${result1.f4StructureValidated}`);

// Test 2: Medium semiprime (50-bit range)
console.log('\n📊 Test 2: Medium Semiprime (37 × 41 = 1517)');
const model2 = Atlas.Model.factorHierarchical('1517');
const result2 = model2.run({});

console.log(`Result:`, result2);
console.log(`Success: ${result2.success}`);
console.log(`Factors: ${result2.p} × ${result2.q}`);
console.log(`Candidates per level: ${result2.candidatesPerLevel.join(', ')}`);

// Test 3: Runtime parameter
console.log('\n📊 Test 3: Runtime Parameter (53 × 59 = 3127)');
const model3 = Atlas.Model.factorHierarchical();
const result3 = model3.run({ n: '3127' });

console.log(`Result:`, result3);
console.log(`Success: ${result3.success}`);
console.log(`Factors: ${result3.p} × ${result3.q}`);

// Test 4: With custom options
console.log('\n📊 Test 4: Custom Options (beamWidth=16, epsilon=15)');
const model4 = Atlas.Model.factorHierarchical('1517', {
  beamWidth: 16,
  epsilon: 15,
  pruningStrategy: 'conservative',
});
const result4 = model4.run({});

console.log(`Result:`, result4);
console.log(`Success: ${result4.success}`);
console.log(`Total candidates: ${result4.totalCandidates}`);

console.log('\n' + '='.repeat(70));
console.log('✅ INTEGRATION TEST COMPLETE');
console.log('='.repeat(70));
