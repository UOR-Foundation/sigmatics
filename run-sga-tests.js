#!/usr/bin/env node
/**
 * Run all SGA tests
 */

const { runSgaLawsTests } = require('./packages/core/dist/test/sga/laws.test.js');
const { runBridgeTests } = require('./packages/core/dist/test/sga/bridge.test.js');

console.log('\n');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║                                                           ║');
console.log('║        SIGMATICS v0.3.0 - COMPREHENSIVE TEST SUITE       ║');
console.log('║                                                           ║');
console.log('╚═══════════════════════════════════════════════════════════╝');

try {
  // Run SGA algebraic laws tests
  runSgaLawsTests();

  // Run bridge commutative diagram tests
  runBridgeTests();

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║        ✓✓✓ ALL TESTS PASSED! ✓✓✓                        ║');
  console.log('║                                                           ║');
  console.log('║  v0.3.0 IMPLEMENTATION FULLY VERIFIED:                   ║');
  console.log('║                                                           ║');
  console.log('║  ✓ All algebraic laws hold (R⁴=id, D³=id, T⁸=id, M²=id) ║');
  console.log('║  ✓ All transform commutations verified                   ║');
  console.log('║  ✓ All 1,344 commutative diagrams pass                   ║');
  console.log('║  ✓ SGA correctly implements class transforms             ║');
  console.log('║                                                           ║');
  console.log('║  The SGA algebraic foundation is mathematically sound    ║');
  console.log('║  and correctly implements the permutation system.        ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  process.exit(0);
} catch (error) {
  console.error('\n');
  console.error('╔═══════════════════════════════════════════════════════════╗');
  console.error('║                                                           ║');
  console.error('║        ✗✗✗ TESTS FAILED ✗✗✗                              ║');
  console.error('║                                                           ║');
  console.error('╚═══════════════════════════════════════════════════════════╝');
  console.error('\n');
  console.error(error);
  process.exit(1);
}
