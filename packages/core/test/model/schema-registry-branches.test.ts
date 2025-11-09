/**
 * Schema Registry Branch Tests
 */
import { getSchemaByName } from '../../src/model/schema-registry';

type TestFn = (name: string, fn: () => void) => void;

export function runSchemaRegistryBranchTests(runTest: TestFn): void {
  console.log('Running Schema Registry Branch Tests...');

  // Cache miss then hit
  runTest('Schema Registry: getSchemaByName caches results', () => {
    const first = getSchemaByName('add96');
    const second = getSchemaByName('add96');
    if (first === null || second === null) {
      throw new Error('Expected schema to be loaded for add96');
    }
    // Object identity should match cache hit
    if (first !== second) {
      throw new Error('Expected cached schema instance to be reused');
    }
  });

  // Missing schema returns null
  runTest('Schema Registry: missing schema returns null', () => {
    const missing = getSchemaByName('nonexistent-model-xyz');
    if (missing !== null) {
      throw new Error('Expected null for missing schema');
    }
  });
}
