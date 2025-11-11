/**
 * Debug: Check norms of all Atlas class vectors
 */

import {
  atlasClassToLeech,
  leechNorm,
  isInLeech,
} from '../../../../packages/core/src/sga/leech';

console.log('Checking norms of all 96 Atlas class vectors:');
console.log('='.repeat(70));

const normHistogram = new Map<number, number>();

for (let classIdx = 0; classIdx < 96; classIdx++) {
  const v = atlasClassToLeech(classIdx);
  const norm = leechNorm(v);
  const valid = isInLeech(v);

  // Decompose class
  const h = Math.floor(classIdx / 24);
  const d = Math.floor((classIdx % 24) / 8);
  const ell = classIdx % 8;

  console.log(`Class ${classIdx.toString().padStart(2)}: (h=${h}, d=${d}, ℓ=${ell}) → norm=${norm.toString().padStart(3)} valid=${valid} coords=[${v.slice(0, 8).join(',')}...]`);

  normHistogram.set(norm, (normHistogram.get(norm) ?? 0) + 1);
}

console.log('\n' + '='.repeat(70));
console.log('Norm histogram:');
const sortedNorms = Array.from(normHistogram.entries()).sort((a, b) => a[0] - b[0]);
for (const [norm, count] of sortedNorms) {
  console.log(`  Norm ${norm}: ${count} classes`);
}

console.log('\nNote: Leech lattice should have:');
console.log('  - No norm-2 vectors (rootless property)');
console.log('  - Minimal norm = 4');
console.log('  - 196,560 norm-4 vectors (kissing number)');
