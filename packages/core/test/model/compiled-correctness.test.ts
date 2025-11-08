/**
 * Compiled Model Correctness Tests
 *
 * Validates that compiled models satisfy algebraic laws:
 * - R⁴ = D³ = T⁸ = M² = identity
 * - Commutations: RD = DR, RT = TR, DT = TD
 * - Conjugations: MDM = D⁻¹, etc.
 * - Bridge round-trip: project(lift(i)) = i
 */

import { StdlibModels } from '../../src/server/registry';
import { project } from '../../src/bridge/project';

// Test helper
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runCompiledCorrectnessTests(): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Compiled Model Correctness Tests');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test transform orders (identity laws)
  console.log('Testing transform orders (R⁴ = D³ = T⁸ = M² = identity)...');

  let orderTests = 0;
  let orderPassed = 0;

  // R⁴ = identity
  for (let c = 0; c < 96; c += 10) {
    orderTests++;
    let result: any = c;
    for (let i = 0; i < 4; i++) {
      result = StdlibModels.R(1).run({ x: result });
    }
    if (result === c) {
      orderPassed++;
    } else {
      console.log(`  ✗ R⁴(${c}) = ${result}, expected ${c}`);
    }
  }

  // D³ = identity
  for (let c = 0; c < 96; c += 10) {
    orderTests++;
    let result: any = c;
    for (let i = 0; i < 3; i++) {
      result = StdlibModels.D(1).run({ x: result });
    }
    if (result === c) {
      orderPassed++;
    } else {
      console.log(`  ✗ D³(${c}) = ${result}, expected ${c}`);
    }
  }

  // T⁸ = identity
  for (let c = 0; c < 96; c += 10) {
    orderTests++;
    let result: any = c;
    for (let i = 0; i < 8; i++) {
      result = StdlibModels.T(1).run({ x: result });
    }
    if (result === c) {
      orderPassed++;
    } else {
      console.log(`  ✗ T⁸(${c}) = ${result}, expected ${c}`);
    }
  }

  // M² = identity
  for (let c = 0; c < 96; c += 10) {
    orderTests++;
    let result: any = c;
    result = StdlibModels.M().run({ x: result });
    result = StdlibModels.M().run({ x: result });
    if (result === c) {
      orderPassed++;
    } else {
      console.log(`  ✗ M²(${c}) = ${result}, expected ${c}`);
    }
  }

  console.log(`✓ Transform orders: ${orderPassed}/${orderTests} passed\n`);
  assert(orderPassed === orderTests, `Transform orders: ${orderPassed}/${orderTests}`);

  // Test commutations
  console.log('Testing commutations (RD = DR, RT = TR, DT = TD)...');

  let commutationTests = 0;
  let commutationPassed = 0;

  // RD = DR
  for (let c = 0; c < 96; c += 10) {
    commutationTests++;
    const rd = StdlibModels.D(1).run({ x: StdlibModels.R(1).run({ x: c }) });
    const dr = StdlibModels.R(1).run({ x: StdlibModels.D(1).run({ x: c }) });
    if (rd === dr) {
      commutationPassed++;
    } else {
      console.log(`  ✗ RD(${c}) = ${rd}, DR(${c}) = ${dr}`);
    }
  }

  // RT = TR
  for (let c = 0; c < 96; c += 10) {
    commutationTests++;
    const rt = StdlibModels.T(1).run({ x: StdlibModels.R(1).run({ x: c }) });
    const tr = StdlibModels.R(1).run({ x: StdlibModels.T(1).run({ x: c }) });
    if (rt === tr) {
      commutationPassed++;
    } else {
      console.log(`  ✗ RT(${c}) = ${rt}, TR(${c}) = ${tr}`);
    }
  }

  // DT = TD
  for (let c = 0; c < 96; c += 10) {
    commutationTests++;
    const dt = StdlibModels.T(1).run({ x: StdlibModels.D(1).run({ x: c }) });
    const td = StdlibModels.D(1).run({ x: StdlibModels.T(1).run({ x: c }) });
    if (dt === td) {
      commutationPassed++;
    } else {
      console.log(`  ✗ DT(${c}) = ${dt}, TD(${c}) = ${td}`);
    }
  }

  console.log(`✓ Commutations: ${commutationPassed}/${commutationTests} passed\n`);
  assert(
    commutationPassed === commutationTests,
    `Commutations: ${commutationPassed}/${commutationTests}`,
  );

  // Test conjugations (MDM = D⁻¹)
  console.log('Testing mirror conjugations (MDM = D⁻¹)...');

  let conjugationTests = 0;
  let conjugationPassed = 0;

  for (let c = 0; c < 96; c += 10) {
    conjugationTests++;

    // MDM
    const mdm = StdlibModels.M().run({
      x: StdlibModels.D(1).run({
        x: StdlibModels.M().run({ x: c }),
      }),
    });

    // D⁻¹ = D²
    const dInv = StdlibModels.D(2).run({ x: c });

    if (mdm === dInv) {
      conjugationPassed++;
    } else {
      console.log(`  ✗ MDM(${c}) = ${mdm}, D⁻¹(${c}) = ${dInv}`);
    }
  }

  console.log(`✓ Conjugations: ${conjugationPassed}/${conjugationTests} passed\n`);
  assert(
    conjugationPassed === conjugationTests,
    `Conjugations: ${conjugationPassed}/${conjugationTests}`,
  );

  // Test bridge round-trip via compiled models
  console.log('Testing bridge round-trip (lift then project)...');

  let bridgeTests = 0;
  let bridgePassed = 0;

  for (let c = 0; c < 96; c++) {
    bridgeTests++;
    const lifted = StdlibModels.lift(c).run({});
    const projected = project(lifted);

    if (projected === c) {
      bridgePassed++;
    } else {
      console.log(`  ✗ project(lift(${c})) = ${projected}, expected ${c}`);
    }
  }

  console.log(`✓ Bridge round-trip: ${bridgePassed}/${bridgeTests} passed\n`);
  assert(bridgePassed === bridgeTests, `Bridge round-trip: ${bridgePassed}/${bridgeTests}`);

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✓ All compiled model correctness tests passed!`);
  console.log(`  Total: ${orderTests + commutationTests + conjugationTests + bridgeTests} tests`);
  console.log('═══════════════════════════════════════════════════════════\n');
}
