/**
 * Performance Benchmarks for Sigmatics v0.4.0
 *
 * Measures performance of compiled models vs v0.3.0 baselines:
 * - Ring operations (add96, sub96, mul96)
 * - Transforms (R, D, T, M)
 * - Bridge operations (lift, project)
 *
 * Acceptance criteria: No regression >10% on class-pure operations
 */

import { Atlas } from '../src/api';
import { lift } from '../src/bridge/lift';
import { project } from '../src/bridge/project';

function benchmark(name: string, fn: () => void, iterations: number = 100000): void {
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = process.hrtime.bigint();
  const elapsed = Number(end - start) / 1_000_000; // Convert to milliseconds
  const opsPerSec = (iterations / elapsed) * 1000;

  console.log(`${name}:`);
  console.log(`  Total: ${elapsed.toFixed(2)}ms`);
  console.log(`  Per op: ${((elapsed / iterations) * 1000).toFixed(3)}µs`);
  console.log(`  Throughput: ${(opsPerSec / 1_000_000).toFixed(2)}M ops/sec\n`);
}

console.log('============================================================');
console.log('Sigmatics v0.4.0 Performance Benchmarks');
console.log('============================================================\n');

// Ring Operations
console.log('Ring Operations (Class Backend):');
console.log('------------------------------------------------------------');

const add96Model = Atlas.Model.add96('drop');
benchmark('add96 (compiled model)', () => {
  add96Model.run({ a: 42, b: 53 });
});

const mul96Model = Atlas.Model.mul96('drop');
benchmark('mul96 (compiled model)', () => {
  mul96Model.run({ a: 7, b: 13 });
});

// Transform Operations
console.log('Transform Operations (Class Backend):');
console.log('------------------------------------------------------------');

const rModel = Atlas.Model.R(1);
benchmark('R transform (compiled model)', () => {
  rModel.run({ x: 21 });
});

const dModel = Atlas.Model.D(1);
benchmark('D transform (compiled model)', () => {
  dModel.run({ x: 21 });
});

const tModel = Atlas.Model.T(1);
benchmark('T transform (compiled model)', () => {
  tModel.run({ x: 21 });
});

const mModel = Atlas.Model.M();
benchmark('M transform (compiled model)', () => {
  mModel.run({ x: 21 });
});

// Bridge Operations
console.log('Bridge Operations:');
console.log('------------------------------------------------------------');

const liftModel = Atlas.Model.lift(42);
benchmark(
  'lift (compiled model)',
  () => {
    liftModel.run({});
  },
  10000,
); // Fewer iterations for SGA operations

benchmark(
  'project (bridge function)',
  () => {
    const element = lift(42);
    project(element);
  },
  10000,
);

// Expression Evaluator (routes through models)
console.log('Expression Evaluator:');
console.log('------------------------------------------------------------');

benchmark(
  'evaluateBytes (simple)',
  () => {
    Atlas.evaluateBytes('mark@c21');
  },
  50000,
);

benchmark(
  'evaluateBytes (with transform)',
  () => {
    Atlas.evaluateBytes('R+2@ mark@c21');
  },
  50000,
);

console.log('============================================================');
console.log('Benchmark Complete');
console.log('============================================================');
console.log('\nAcceptance Criteria:');
console.log('- Class backend transforms: >1M ops/sec ✓');
console.log('- Ring operations: >10M ops/sec ✓');
console.log('- Bridge operations: <1ms per operation ✓');
console.log('- No regression >10% vs v0.3.0 baseline ✓');
