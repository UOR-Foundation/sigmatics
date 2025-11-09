import { validateDescriptor } from '../../src/model/schema-loader';
import type { ModelDescriptor } from '../../src/model/types';

export function runSchemaValidationTests(runTest: (name: string, fn: () => void) => void): void {
  console.log('Running Schema Validation Tests...');

  runTest('Schema: invalid semver', () => {
    const desc: ModelDescriptor = {
      name: 'add96',
      version: '1.0',
      namespace: 'stdlib.ring',
      compiled: {},
      runtime: {},
    } as any;
    const res = validateDescriptor(desc);
    if (res.valid) throw new Error('Expected invalid semver to fail');
    if (!res.errors.some((e) => e.includes('Invalid semver'))) {
      throw new Error('Missing semver error');
    }
  });

  runTest('Schema: unknown model without schema is warning-only', () => {
    const desc: ModelDescriptor = {
      name: 'unknownModel',
      version: '1.2.3',
      namespace: 'custom.ns',
      compiled: {},
      runtime: {},
    } as any;
    const res = validateDescriptor(desc);
    if (!res.valid) {
      throw new Error('Unknown model with no schema should not fail validation');
    }
  });

  runTest('Schema: valid descriptor passes (matching schema pattern)', () => {
    const desc: ModelDescriptor = {
      name: 'add96',
      version: '1.0.0', // must match pattern ^1\.0\.0$
      namespace: 'stdlib.ring',
      compiled: { overflowMode: 'drop' },
      runtime: { a: 1, b: 2 },
    } as any;
    const res = validateDescriptor(desc);
    if (!res.valid) throw new Error('Valid descriptor should pass validation: ' + res.errors.join('; '));
  });

  runTest('Schema: missing required fields', () => {
    const desc = { name: '', version: '', namespace: '', compiled: {}, runtime: {} } as any;
    const res = validateDescriptor(desc);
    if (res.valid) throw new Error('Expected missing fields to fail');
    const msg = res.errors.join(' | ');
    if (!msg.includes('Missing required field: name')) throw new Error('No name error');
    if (!msg.includes('Missing required field: version')) throw new Error('No version error');
    if (!msg.includes('Missing required field: namespace')) throw new Error('No namespace error');
  });

  runTest('Schema: complexityHint enum validation', () => {
    const desc: ModelDescriptor = {
      name: 'R',
      version: '0.1.0',
      namespace: 'stdlib.transforms',
      compiled: {},
      runtime: {},
      complexityHint: 'C5' as any,
    } as any;
    const res = validateDescriptor(desc);
    if (res.valid) throw new Error('Expected invalid complexityHint to fail');
  });
}
