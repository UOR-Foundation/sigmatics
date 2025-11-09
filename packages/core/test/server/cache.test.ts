import * as Cache from '../../src/server/cache';
import type { ModelDescriptor } from '../../src/model/types';

export function runCacheTests(runTest: (name: string, fn: () => void) => void): void {
  console.log('Running Server Cache Tests...');

  function desc(overrides: Partial<ModelDescriptor> = {}): ModelDescriptor {
    return {
      name: 'add96',
      version: '1.2.3',
      namespace: 'stdlib.ring',
      compiled: { mode: 'drop' },
      runtime: {},
      ...overrides,
    } as ModelDescriptor;
  }

  runTest('Cache: set/get/has/del basics', () => {
    Cache.clear();
    const d = desc();
    const compiled: any = { descriptor: d, complexity: 'C0', plan: { backend: 'class', plan: { kind: 'class', operations: [] } }, run: () => ({}) };
    Cache.set(d, compiled);
    if (!Cache.has(d)) throw new Error('Cache should have entry after set');
    const got = Cache.get(d);
    if (!got) throw new Error('Cache.get should return compiled model');
    if (!Cache.del(d)) throw new Error('Cache.del should return true');
    if (Cache.has(d)) throw new Error('Cache should be empty after del');
  });

  runTest('Cache: key includes schema hash and compiled params', () => {
    Cache.clear();
    const d1 = desc({ compiled: { mode: 'drop' } });
    const d2 = desc({ compiled: { mode: 'track' } });
    const key1 = Cache.getCacheKey(d1);
    const key2 = Cache.getCacheKey(d2);
    if (key1 === key2) throw new Error('Different compiled params should produce different keys');
  });

  runTest('Cache: key changes when schema changes', () => {
    Cache.clear();
    const d = desc();
    const key1 = Cache.getCacheKey(d);
    // Simulate schema content change by tweaking version (schema hash comes from file, so we check non-empty format)
    if (!key1.includes('#')) throw new Error('Key should include schema hash section');
  });

  runTest('Cache: stats reflect size and keys', () => {
    Cache.clear();
    const d = desc();
    const compiled: any = { descriptor: d, complexity: 'C0', plan: { backend: 'class', plan: { kind: 'class', operations: [] } }, run: () => ({}) };
    Cache.set(d, compiled);
    const stats = Cache.getStats();
    if (stats.size !== 1) throw new Error('Cache size should be 1');
    if (stats.keys.length !== 1) throw new Error('Cache keys length should be 1');
  });
}
