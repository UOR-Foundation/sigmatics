/**
 * SGA Test Suite Runner
 *
 * Runs all SGA tests including:
 * - Algebraic laws (R⁴=id, D³=id, T⁸=id, M²=id, commutation, conjugation)
 * - Bridge commutative diagrams (1344 tests)
 */

import { runSgaLawsTests } from './laws.test';
import { runBridgeTests } from './bridge.test';

export function runAllSgaTests(): void {
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║        SIGMATICS v0.3.0 - SGA TEST SUITE                 ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    // Run algebraic laws tests
    runSgaLawsTests();

    // Run bridge commutative diagram tests
    runBridgeTests();

    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║        ✓ ALL SGA TESTS PASSED!                           ║');
    console.log('║                                                           ║');
    console.log('║  v0.3.0 Implementation Verified:                         ║');
    console.log('║  • All algebraic laws hold                               ║');
    console.log('║  • All commutative diagrams verified                     ║');
    console.log('║  • SGA correctly implements class transforms             ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n');
  } catch (error) {
    console.error('\n\n');
    console.error('╔═══════════════════════════════════════════════════════════╗');
    console.error('║                                                           ║');
    console.error('║        ✗ SGA TESTS FAILED                                ║');
    console.error('║                                                           ║');
    console.error('╚═══════════════════════════════════════════════════════════╝');
    console.error('\n');
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  try {
    runAllSgaTests();
  } catch (error) {
    process.exit(1);
  }
}
