#!/usr/bin/env node
/**
 * Test all commutative diagrams
 */

const { validateAll, summarizeResults } = require('./packages/core/dist/bridge/validation.js');

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Bridge Commutative Diagram Test Suite');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Running comprehensive validation...');
console.log('This validates all commutative diagrams for:');
console.log('  - Lift/project round trip (96 tests)');
console.log('  - R transform (288 tests: 96 classes × 3 powers)');
console.log('  - D transform (192 tests: 96 classes × 2 powers)');
console.log('  - T transform (672 tests: 96 classes × 7 powers)');
console.log('  - M transform (96 tests)');
console.log('');
console.log('Total: 1,344 commutative diagram tests');
console.log('');

const { allPassed, results, summary } = validateAll();

console.log('Summary:');
console.log(`  Total:  ${summary.total}`);
console.log(`  Passed: ${summary.passed}`);
console.log(`  Failed: ${summary.failed}`);

if (summary.failed > 0) {
  console.log('');
  console.log('Failed tests:');
  for (const result of results.filter((r) => !r.passed)) {
    console.log(`  ${result.name} - class ${result.classIndex}: ${result.error}`);
    console.log(`    Expected: ${result.expected}, Actual: ${result.actual}`);
  }
}

console.log('');
console.log('═══════════════════════════════════════════════════════════');

if (!allPassed) {
  console.error('✗ TESTS FAILED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  process.exit(1);
} else {
  console.log('✓ ALL TESTS PASSED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  process.exit(0);
}
