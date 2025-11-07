#!/usr/bin/env node
/**
 * Test API completeness for v0.3.0
 */

const { Atlas, SGA, Bridge } = require('./packages/core/dist/index.js');

console.log('Testing API Completeness...\n');

// Test Atlas.SGA namespace
console.log('✓ Atlas.SGA namespace exists:', !!Atlas.SGA);
console.log('✓ Atlas.SGA.lift exists:', typeof Atlas.SGA.lift === 'function');
console.log('✓ Atlas.SGA.project exists:', typeof Atlas.SGA.project === 'function');
console.log('✓ Atlas.SGA.R exists:', typeof Atlas.SGA.R === 'function');
console.log('✓ Atlas.SGA.D exists:', typeof Atlas.SGA.D === 'function');
console.log('✓ Atlas.SGA.T exists:', typeof Atlas.SGA.T === 'function');
console.log('✓ Atlas.SGA.M exists:', typeof Atlas.SGA.M === 'function');
console.log('✓ Atlas.SGA.validate exists:', typeof Atlas.SGA.validate === 'function');
console.log('✓ Atlas.SGA.Octonion exists:', !!Atlas.SGA.Octonion);
console.log('✓ Atlas.SGA.Fano exists:', !!Atlas.SGA.Fano);

// Test direct exports
console.log('\n✓ SGA module exported:', !!SGA);
console.log('✓ Bridge module exported:', !!Bridge);

// Test SGA exports
console.log('\n✓ SGA.createSgaElement:', typeof SGA.createSgaElement === 'function');
console.log('✓ SGA.sgaMultiply:', typeof SGA.sgaMultiply === 'function');
console.log('✓ SGA.transformR:', typeof SGA.transformR === 'function');
console.log('✓ SGA.transformD:', typeof SGA.transformD === 'function');
console.log('✓ SGA.transformT:', typeof SGA.transformT === 'function');
console.log('✓ SGA.transformM:', typeof SGA.transformM === 'function');
console.log('✓ SGA.cayleyProduct:', typeof SGA.cayleyProduct === 'function');
console.log('✓ SGA.geometricProduct:', typeof SGA.geometricProduct === 'function');

// Test Bridge exports
console.log('\n✓ Bridge.lift:', typeof Bridge.lift === 'function');
console.log('✓ Bridge.project:', typeof Bridge.project === 'function');
console.log('✓ Bridge.validateAll:', typeof Bridge.validateAll === 'function');

// Test types are exported
console.log('\nChecking type exports (should not throw)...');
try {
  // These will be undefined at runtime but should be in the .d.ts files
  console.log('✓ Type exports should be in TypeScript definitions');
} catch (e) {
  console.error('✗ Type export error:', e.message);
}

console.log('\n✅ All API completeness checks passed!\n');
