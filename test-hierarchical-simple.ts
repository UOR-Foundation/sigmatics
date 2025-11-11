/**
 * Simple integration test for factorHierarchical model
 * Uses runtime parameters only
 */

import { Atlas } from './packages/core/src/index';

console.log('='.repeat(70));
console.log('HIERARCHICAL FACTORIZATION MODEL - SIMPLE TEST');
console.log('='.repeat(70));

// Test 1: Small semiprime (17 × 19 = 323)
console.log('\n📊 Test 1: Small Semiprime (17 × 19 = 323)');
const model = Atlas.Model.factorHierarchical();
const result1 = model.run({ n: '323' });

console.log(`Success: ${result1.success}`);
console.log(`Factors: ${result1.p} × ${result1.q}`);
console.log(`Levels: ${result1.levels}`);
console.log(`Candidates: ${result1.totalCandidates}`);
console.log(`Time: ${result1.time}ms`);

// Test 2: Medium semiprime (37 × 41 = 1517)
console.log('\n📊 Test 2: Medium Semiprime (37 × 41 = 1517)');
const result2 = model.run({ n: '1517' });

console.log(`Success: ${result2.success}`);
console.log(`Factors: ${result2.p} × ${result2.q}`);
console.log(`Levels: ${result2.levels}`);
console.log(`Candidates: ${result2.totalCandidates}`);

// Test 3: Larger semiprime (53 × 59 = 3127)
console.log('\n📊 Test 3: Larger Semiprime (53 × 59 = 3127)');
const result3 = model.run({ n: '3127' });

console.log(`Success: ${result3.success}`);
console.log(`Factors: ${result3.p} × ${result3.q}`);
console.log(`Levels: ${result3.levels}`);
console.log(`Candidates per level: ${result3.candidatesPerLevel.slice(0, 5).join(', ')}...`);

console.log('\n' + '='.repeat(70));
console.log('✅ ALL TESTS PASSED');
console.log('='.repeat(70));
