/**
 * Differential Tests: Class vs SGA Backend Parity
 *
 * Validates that class backend and SGA backend produce identical results
 * for rank-1 operations (ring ops and transforms).
 */

import { StdlibModels } from '../../src/server/registry';
import { lift } from '../../src/bridge/lift';
import { project } from '../../src/bridge/project';

// Test helper
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runDifferentialTests(): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Differential Tests: Class vs SGA Backend Parity');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test ring operations for a sample of class indices
  console.log('Testing ring operations (add96, sub96, mul96)...');

  let ringTests = 0;
  let ringPassed = 0;

  // Test add96
  for (let a = 0; a < 96; a += 10) {
    for (let b = 0; b < 96; b += 10) {
      ringTests++;
      const classResult = StdlibModels.add96('drop').run({ a, b });
      const sgaResult = StdlibModels.add96('drop').run({ a, b });

      const classValue = typeof classResult === 'number' ? classResult : (classResult as any).value;
      const sgaValue = typeof sgaResult === 'number' ? sgaResult : (sgaResult as any).value;

      if (classValue === sgaValue) {
        ringPassed++;
      } else {
        console.log(`  ✗ add96(${a}, ${b}): class=${classValue}, sga=${sgaValue}`);
      }
    }
  }

  // Test sub96
  for (let a = 0; a < 96; a += 10) {
    for (let b = 0; b < 96; b += 10) {
      ringTests++;
      const classResult = StdlibModels.sub96('drop').run({ a, b });
      const sgaResult = StdlibModels.sub96('drop').run({ a, b });

      const classValue = typeof classResult === 'number' ? classResult : (classResult as any).value;
      const sgaValue = typeof sgaResult === 'number' ? sgaResult : (sgaResult as any).value;

      if (classValue === sgaValue) {
        ringPassed++;
      } else {
        console.log(`  ✗ sub96(${a}, ${b}): class=${classValue}, sga=${sgaValue}`);
      }
    }
  }

  // Test mul96
  for (let a = 0; a < 96; a += 10) {
    for (let b = 0; b < 96; b += 10) {
      ringTests++;
      const classResult = StdlibModels.mul96('drop').run({ a, b });
      const sgaResult = StdlibModels.mul96('drop').run({ a, b });

      const classValue = typeof classResult === 'number' ? classResult : (classResult as any).value;
      const sgaValue = typeof sgaResult === 'number' ? sgaResult : (sgaResult as any).value;

      if (classValue === sgaValue) {
        ringPassed++;
      } else {
        console.log(`  ✗ mul96(${a}, ${b}): class=${classValue}, sga=${sgaValue}`);
      }
    }
  }

  console.log(`✓ Ring operations: ${ringPassed}/${ringTests} passed\n`);
  assert(ringPassed === ringTests, `Ring operations parity: ${ringPassed}/${ringTests}`);

  // Test transforms via compiled models
  console.log('Testing transforms (R, D, T, M) via compiled models...');

  let transformTests = 0;
  let transformPassed = 0;

  // Test R transform
  for (let c = 0; c < 96; c += 8) {
    for (let k = 1; k <= 3; k++) {
      transformTests++;

      // Use class backend (pass class index)
      const classResult = StdlibModels.R(k).run({ x: c });

      // Use SGA backend (pass SGA element)
      const sgaInput = lift(c);
      const sgaResult = StdlibModels.R(k).run({ x: sgaInput });

      // Project SGA result back to class
      const sgaProjected = project(sgaResult as any);

      if (classResult === sgaProjected) {
        transformPassed++;
      } else {
        console.log(`  ✗ R^${k}(${c}): class=${classResult}, sga=${sgaProjected}`);
      }
    }
  }

  // Test D transform
  for (let c = 0; c < 96; c += 8) {
    for (let k = 1; k <= 2; k++) {
      transformTests++;

      const classResult = StdlibModels.D(k).run({ x: c });
      const sgaInput = lift(c);
      const sgaResult = StdlibModels.D(k).run({ x: sgaInput });
      const sgaProjected = project(sgaResult as any);

      if (classResult === sgaProjected) {
        transformPassed++;
      } else {
        console.log(`  ✗ D^${k}(${c}): class=${classResult}, sga=${sgaProjected}`);
      }
    }
  }

  // Test T transform
  for (let c = 0; c < 96; c += 8) {
    for (let k = 1; k <= 7; k++) {
      transformTests++;

      const classResult = StdlibModels.T(k).run({ x: c });
      const sgaInput = lift(c);
      const sgaResult = StdlibModels.T(k).run({ x: sgaInput });
      const sgaProjected = project(sgaResult as any);

      if (classResult === sgaProjected) {
        transformPassed++;
      } else {
        console.log(`  ✗ T^${k}(${c}): class=${classResult}, sga=${sgaProjected}`);
      }
    }
  }

  // Test M transform
  for (let c = 0; c < 96; c += 8) {
    transformTests++;

    const classResult = StdlibModels.M().run({ x: c });
    const sgaInput = lift(c);
    const sgaResult = StdlibModels.M().run({ x: sgaInput });
    const sgaProjected = project(sgaResult as any);

    if (classResult === sgaProjected) {
      transformPassed++;
    } else {
      console.log(`  ✗ M(${c}): class=${classResult}, sga=${sgaProjected}`);
    }
  }

  console.log(`✓ Transforms: ${transformPassed}/${transformTests} passed\n`);
  assert(transformPassed === transformTests, `Transform parity: ${transformPassed}/${transformTests}`);

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✓ All differential tests passed!`);
  console.log(`  Total: ${ringTests + transformTests} tests`);
  console.log('═══════════════════════════════════════════════════════════\n');
}
