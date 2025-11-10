#!/usr/bin/env node
/**
 * Generate Orbit Tables from E₇ Orbit Computation
 *
 * Extracts the distance and parent tables from the 37-orbit
 * and generates TypeScript source code for orbit-tables.ts
 */

import { Atlas } from '../src';

// Compute orbit from class 37
function computeOrbit(start: number): {
  orbit: number[];
  distance: Map<number, number>;
  parent: Map<number, { from: number; op: string } | null>;
} {
  const RModel = Atlas.Model.R(1);
  const DModel = Atlas.Model.D(1);
  const TModel = Atlas.Model.T(1);
  const MModel = Atlas.Model.M();

  const orbit = new Set([start]);
  const queue = [start];
  const distance = new Map([[start, 0]]);
  const parent = new Map<number, { from: number; op: string } | null>([[start, null]]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = distance.get(current)!;

    const transforms = [
      { op: 'R', value: RModel.run({ x: current }) as number },
      { op: 'D', value: DModel.run({ x: current }) as number },
      { op: 'T', value: TModel.run({ x: current }) as number },
      { op: 'M', value: MModel.run({ x: current }) as number },
    ];

    for (const { op, value } of transforms) {
      if (!orbit.has(value)) {
        orbit.add(value);
        queue.push(value);
        distance.set(value, currentDist + 1);
        parent.set(value, { from: current, op });
      }
    }
  }

  return { orbit: Array.from(orbit).sort((a, b) => a - b), distance, parent };
}

const { orbit, distance, parent } = computeOrbit(37);

console.log('Generating orbit tables...\n');
console.log(`Orbit size: ${orbit.length}`);
console.log(`Orbit diameter: ${Math.max(...distance.values())}\n`);

// Generate distance table
console.log('Distance table:');
const distanceArray: number[] = [];
for (let i = 0; i < 96; i++) {
  distanceArray.push(distance.get(i) ?? 0);
}
console.log(`export const ORBIT_DISTANCE_TABLE: readonly number[] = [`);
for (let i = 0; i < 96; i += 8) {
  const chunk = distanceArray.slice(i, i + 8).join(', ');
  const comment = i === 0 ? ' // 0-7' : i === 88 ? ' // 88-95' : ` // ${i}-${i + 7}`;
  console.log(`  ${chunk},${comment}`);
}
console.log(`];`);
console.log();

// Generate parent table
console.log('Parent table:');
console.log(`export const ORBIT_PARENT_TABLE: readonly ({ from: number; op: OrbitTransform } | null)[] = [`);
for (let i = 0; i < 96; i++) {
  const p = parent.get(i);
  if (p === null || p === undefined) {
    console.log(`  null, // ${i} (root)`);
  } else {
    console.log(`  { from: ${p.from}, op: '${p.op}' }, // ${i}`);
  }
}
console.log(`];`);
console.log();

// Verify statistics
console.log('Statistics:');
console.log(`  Average distance: ${Array.from(distance.values()).reduce((a, b) => a + b, 0) / 96}`);

const histogram = new Map<number, number>();
for (const dist of distance.values()) {
  histogram.set(dist, (histogram.get(dist) ?? 0) + 1);
}

console.log('  Distance histogram:');
for (let d = 0; d <= Math.max(...distance.values()); d++) {
  const count = histogram.get(d) ?? 0;
  if (count > 0) {
    console.log(`    Distance ${d}: ${count} classes`);
  }
}
