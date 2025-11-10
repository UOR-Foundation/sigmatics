/**
 * Tests for E₇ orbit tables
 *
 * Validates precomputed orbit structure for class 37 in ℤ₉₆.
 */

import {
  ORBIT_DISTANCE_TABLE,
  ORBIT_PARENT_TABLE,
  computeOrbitPath,
  verifyOrbitTables,
  getOrbitStatistics,
} from '../src/compiler/orbit-tables';
import { Atlas } from '../src';

export function runOrbitTableTests(): void {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  E₇ Orbit Table Tests');
  console.log('═══════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Table sizes
  {
    const testName = 'Orbit tables have correct size';
    try {
      if (ORBIT_DISTANCE_TABLE.length === 96 && ORBIT_PARENT_TABLE.length === 96) {
        console.log(`✓ ${testName}`);
        console.log(`  Distance table: ${ORBIT_DISTANCE_TABLE.length} entries`);
        console.log(`  Parent table: ${ORBIT_PARENT_TABLE.length} entries`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Distance table: ${ORBIT_DISTANCE_TABLE.length} (expected 96)`);
        console.log(`  Parent table: ${ORBIT_PARENT_TABLE.length} (expected 96)`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 2: Root properties
  {
    const testName = 'Class 37 is the orbit root';
    try {
      const dist37 = ORBIT_DISTANCE_TABLE[37];
      const parent37 = ORBIT_PARENT_TABLE[37];

      if (dist37 === 0 && parent37 === null) {
        console.log(`✓ ${testName}`);
        console.log(`  Distance from 37 to itself: ${dist37}`);
        console.log(`  Parent of 37: null`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Distance: ${dist37} (expected 0)`);
        console.log(`  Parent: ${parent37} (expected null)`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 3: Orbit diameter
  {
    const testName = 'Orbit diameter is 12';
    try {
      const maxDist = Math.max(...ORBIT_DISTANCE_TABLE);

      if (maxDist === 12) {
        console.log(`✓ ${testName}`);
        console.log(`  Maximum distance: ${maxDist}`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Maximum distance: ${maxDist} (expected 12)`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 4: All classes reachable
  {
    const testName = 'All classes have valid parent (except 37)';
    try {
      let allValid = true;

      for (let i = 0; i < 96; i++) {
        if (i === 37) continue; // Skip root

        const parent = ORBIT_PARENT_TABLE[i];
        if (parent === null) {
          console.log(`  Class ${i} has no parent!`);
          allValid = false;
        } else if (parent.from < 0 || parent.from >= 96) {
          console.log(`  Class ${i} has invalid parent index: ${parent.from}`);
          allValid = false;
        }
      }

      if (allValid) {
        console.log(`✓ ${testName}`);
        console.log(`  All 95 non-root classes have valid parents`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 5: Distance consistency with parent
  {
    const testName = 'Parent distances are consistent';
    try {
      let allConsistent = true;

      for (let i = 0; i < 96; i++) {
        if (i === 37) continue;

        const parent = ORBIT_PARENT_TABLE[i];
        if (parent === null) continue;

        const parentDist = ORBIT_DISTANCE_TABLE[parent.from];
        const currentDist = ORBIT_DISTANCE_TABLE[i];

        if (parentDist !== currentDist - 1) {
          console.log(
            `  Inconsistency at class ${i}: parent ${parent.from} has distance ${parentDist}, but current has ${currentDist}`,
          );
          allConsistent = false;
        }
      }

      if (allConsistent) {
        console.log(`✓ ${testName}`);
        console.log(`  All parent distances are exactly 1 less than child`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 6: Path computation
  {
    const testName = 'computeOrbitPath returns correct length';
    try {
      let allMatch = true;

      for (let i = 0; i < 96; i++) {
        const path = computeOrbitPath(i);
        const expectedLength = ORBIT_DISTANCE_TABLE[i];

        if (path.length !== expectedLength) {
          console.log(
            `  Path to class ${i}: length ${path.length}, expected ${expectedLength}`,
          );
          allMatch = false;
        }
      }

      if (allMatch) {
        console.log(`✓ ${testName}`);
        console.log(`  All 96 paths have correct length`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 7: Path validation with transforms
  {
    const testName = 'Orbit paths lead to correct target';
    try {
      const RModel = Atlas.Model.R(1);
      const DModel = Atlas.Model.D(1);
      const TModel = Atlas.Model.T(1);
      const MModel = Atlas.Model.M();

      let allValid = true;
      const sampleClasses = [0, 4, 13, 29, 45, 61, 85, 95]; // Sample from different distances

      for (const target of sampleClasses) {
        const path = computeOrbitPath(target);
        let current = 37;

        // Apply transforms
        for (const op of path) {
          switch (op) {
            case 'R':
              current = RModel.run({ x: current }) as number;
              break;
            case 'D':
              current = DModel.run({ x: current }) as number;
              break;
            case 'T':
              current = TModel.run({ x: current }) as number;
              break;
            case 'M':
              current = MModel.run({ x: current }) as number;
              break;
          }
        }

        if (current !== target) {
          console.log(
            `  Path to ${target} leads to ${current} instead (path: ${path.join(',')})`,
          );
          allValid = false;
        }
      }

      if (allValid) {
        console.log(`✓ ${testName}`);
        console.log(`  Sample paths verified: ${sampleClasses.join(', ')}`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 8: verifyOrbitTables function
  {
    const testName = 'verifyOrbitTables passes';
    try {
      const isValid = verifyOrbitTables();

      if (isValid) {
        console.log(`✓ ${testName}`);
        console.log(`  Full orbit table consistency verified`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Orbit tables failed consistency check`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 9: Orbit statistics
  {
    const testName = 'Orbit statistics match expected values';
    try {
      const stats = getOrbitStatistics();

      if (
        stats.size === 96 &&
        stats.diameter === 12 &&
        stats.averageDistance > 5 &&
        stats.averageDistance < 8
      ) {
        console.log(`✓ ${testName}`);
        console.log(`  Size: ${stats.size}`);
        console.log(`  Diameter: ${stats.diameter}`);
        console.log(`  Average distance: ${stats.averageDistance.toFixed(2)}`);
        console.log(`  Distance histogram:`);
        for (let d = 0; d <= 12; d++) {
          const count = stats.distanceHistogram.get(d) ?? 0;
          if (count > 0) {
            console.log(`    Distance ${d}: ${count} classes`);
          }
        }
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  Unexpected statistics:`);
        console.log(`  Size: ${stats.size} (expected 96)`);
        console.log(`  Diameter: ${stats.diameter} (expected 12)`);
        console.log(`  Average: ${stats.averageDistance.toFixed(2)} (expected ~6.5)`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 10: Specific known paths
  {
    const testName = 'Known orbit paths are correct';
    try {
      const knownPaths = [
        { target: 37, expected: [] }, // Self
        { target: 38, expected: ['T'] }, // Distance 1: 37 → T → 38
        { target: 45, expected: ['D'] }, // Distance 1: 37 → D → 45
        { target: 61, expected: ['R'] }, // Distance 1: 37 → R → 61
        { target: 29, expected: ['D', 'D'] }, // Distance 2: 37 → D → 45 → D → 29
      ];

      let allMatch = true;

      for (const { target, expected } of knownPaths) {
        const path = computeOrbitPath(target);
        const matches =
          path.length === expected.length && path.every((op, i) => op === expected[i]);

        if (!matches) {
          console.log(
            `  Path to ${target}: [${path.join(',')}], expected [${expected.join(',')}]`,
          );
          allMatch = false;
        }
      }

      if (allMatch) {
        console.log(`✓ ${testName}`);
        console.log(`  All known paths verified`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Test 11: E₇ dimension relationship
  {
    const testName = 'E₇ dimension (133) aligns with orbit structure';
    try {
      const diameter = Math.max(...ORBIT_DISTANCE_TABLE);
      const e7Dim = 133;
      const cycles = Math.floor(e7Dim / diameter);
      const remainder = e7Dim % diameter;

      if (cycles === 11 && remainder === 1) {
        console.log(`✓ ${testName}`);
        console.log(`  133 = ${cycles} × ${diameter} + ${remainder}`);
        console.log(`  E₇ dimension wraps orbit ${cycles} times + 1`);
        passed++;
      } else {
        console.log(`✗ ${testName}`);
        console.log(`  133 = ${cycles} × ${diameter} + ${remainder}`);
        console.log(`  Expected: 133 = 11 × 12 + 1`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${testName}: ${e}`);
      failed++;
    }
  }

  // Summary
  console.log('\n───────────────────────────────────────────────────────────');
  console.log(`Tests: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('✓ All orbit table tests passed!');
  } else {
    console.log(`✗ ${failed} test(s) failed`);
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}
