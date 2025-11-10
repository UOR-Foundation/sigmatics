/**
 * E₇ Orbit Tables
 *
 * Precomputed tables for the 37-orbit in ℤ₉₆:
 * - Distance from class 37 to every class [0, 95]
 * - Parent transform for orbit traversal
 * - Transform sequences for orbit reconstruction
 *
 * Generated from experimental validation (e7-orbit-research.ts):
 * - Orbit size: 96 classes (complete spanning)
 * - Orbit diameter: 12
 * - Prime count: 40/96 (41.7%)
 * - Prime power count: 88/96 (91.7%)
 */

/**
 * ORBIT_DISTANCE_TABLE[i] = distance from class 37 to class i
 *
 * Properties:
 * - Distance from 37 to itself = 0
 * - Maximum distance (diameter) = 12
 * - Average distance = 6.0
 */
export const ORBIT_DISTANCE_TABLE: readonly number[] = [
  8, 9, 10, 11, 12, 5, 6, 7, // 0-7
  6, 7, 8, 9, 10, 3, 4, 5, // 8-15
  7, 8, 9, 10, 11, 4, 5, 6, // 16-23
  5, 6, 7, 8, 9, 2, 3, 4, // 24-31
  3, 4, 5, 6, 7, 0, 1, 2, // 32-39
  4, 5, 6, 7, 8, 1, 2, 3, // 40-47
  6, 7, 8, 9, 10, 3, 4, 5, // 48-55
  4, 5, 6, 7, 8, 1, 2, 3, // 56-63
  5, 6, 7, 8, 9, 2, 3, 4, // 64-71
  7, 8, 9, 10, 11, 4, 5, 6, // 72-79
  5, 6, 7, 8, 9, 2, 3, 4, // 80-87
  6, 7, 8, 9, 10, 3, 4, 5, // 88-95
];

/**
 * Transform operation type
 */
export type OrbitTransform = 'R' | 'D' | 'T' | 'M';

/**
 * ORBIT_PARENT_TABLE[i] = { from, op } where:
 * - from: parent class index in breadth-first traversal
 * - op: transform operation to reach i from parent
 *
 * null indicates the root (class 37)
 */
export const ORBIT_PARENT_TABLE: readonly (
  | { from: number; op: OrbitTransform }
  | null
)[] = [
  { from: 7, op: 'T' }, // 0
  { from: 0, op: 'T' }, // 1
  { from: 1, op: 'T' }, // 2
  { from: 2, op: 'T' }, // 3
  { from: 3, op: 'T' }, // 4
  { from: 21, op: 'D' }, // 5
  { from: 5, op: 'T' }, // 6
  { from: 6, op: 'T' }, // 7
  { from: 15, op: 'T' }, // 8
  { from: 8, op: 'T' }, // 9
  { from: 9, op: 'T' }, // 10
  { from: 10, op: 'T' }, // 11
  { from: 11, op: 'T' }, // 12
  { from: 85, op: 'R' }, // 13
  { from: 13, op: 'T' }, // 14
  { from: 14, op: 'T' }, // 15
  { from: 23, op: 'T' }, // 16
  { from: 16, op: 'T' }, // 17
  { from: 17, op: 'T' }, // 18
  { from: 18, op: 'T' }, // 19
  { from: 19, op: 'T' }, // 20
  { from: 13, op: 'D' }, // 21
  { from: 21, op: 'T' }, // 22
  { from: 22, op: 'T' }, // 23
  { from: 31, op: 'T' }, // 24
  { from: 24, op: 'T' }, // 25
  { from: 25, op: 'T' }, // 26
  { from: 26, op: 'T' }, // 27
  { from: 27, op: 'T' }, // 28
  { from: 45, op: 'D' }, // 29
  { from: 29, op: 'T' }, // 30
  { from: 30, op: 'T' }, // 31
  { from: 39, op: 'T' }, // 32
  { from: 32, op: 'T' }, // 33
  { from: 33, op: 'T' }, // 34
  { from: 34, op: 'T' }, // 35
  { from: 35, op: 'T' }, // 36
  null, // 37 (root)
  { from: 37, op: 'T' }, // 38
  { from: 38, op: 'T' }, // 39
  { from: 47, op: 'T' }, // 40
  { from: 40, op: 'T' }, // 41
  { from: 41, op: 'T' }, // 42
  { from: 42, op: 'T' }, // 43
  { from: 43, op: 'T' }, // 44
  { from: 37, op: 'D' }, // 45
  { from: 45, op: 'T' }, // 46
  { from: 46, op: 'T' }, // 47
  { from: 55, op: 'T' }, // 48
  { from: 48, op: 'T' }, // 49
  { from: 49, op: 'T' }, // 50
  { from: 50, op: 'T' }, // 51
  { from: 51, op: 'T' }, // 52
  { from: 69, op: 'D' }, // 53
  { from: 53, op: 'T' }, // 54
  { from: 54, op: 'T' }, // 55
  { from: 63, op: 'T' }, // 56
  { from: 56, op: 'T' }, // 57
  { from: 57, op: 'T' }, // 58
  { from: 58, op: 'T' }, // 59
  { from: 59, op: 'T' }, // 60
  { from: 37, op: 'R' }, // 61
  { from: 61, op: 'T' }, // 62
  { from: 62, op: 'T' }, // 63
  { from: 71, op: 'T' }, // 64
  { from: 64, op: 'T' }, // 65
  { from: 65, op: 'T' }, // 66
  { from: 66, op: 'T' }, // 67
  { from: 67, op: 'T' }, // 68
  { from: 61, op: 'D' }, // 69
  { from: 69, op: 'T' }, // 70
  { from: 70, op: 'T' }, // 71
  { from: 79, op: 'T' }, // 72
  { from: 72, op: 'T' }, // 73
  { from: 73, op: 'T' }, // 74
  { from: 74, op: 'T' }, // 75
  { from: 75, op: 'T' }, // 76
  { from: 93, op: 'D' }, // 77
  { from: 77, op: 'T' }, // 78
  { from: 78, op: 'T' }, // 79
  { from: 87, op: 'T' }, // 80
  { from: 80, op: 'T' }, // 81
  { from: 81, op: 'T' }, // 82
  { from: 82, op: 'T' }, // 83
  { from: 83, op: 'T' }, // 84
  { from: 61, op: 'R' }, // 85
  { from: 85, op: 'T' }, // 86
  { from: 86, op: 'T' }, // 87
  { from: 95, op: 'T' }, // 88
  { from: 88, op: 'T' }, // 89
  { from: 89, op: 'T' }, // 90
  { from: 90, op: 'T' }, // 91
  { from: 91, op: 'T' }, // 92
  { from: 85, op: 'D' }, // 93
  { from: 93, op: 'T' }, // 94
  { from: 94, op: 'T' }, // 95
];

/**
 * Compute the transform sequence from class 37 to target class
 *
 * @param target Target class index [0, 95]
 * @returns Array of transform operations in application order
 *
 * @example
 * ```typescript
 * const path = computeOrbitPath(4);
 * // Returns ['T', 'T', 'T', 'T', 'T', 'T'] (length 6 for distance 12 class)
 * ```
 */
export function computeOrbitPath(target: number): OrbitTransform[] {
  if (target === 37) return [];

  const path: OrbitTransform[] = [];
  let current = target;

  while (current !== 37) {
    const parentInfo = ORBIT_PARENT_TABLE[current];
    if (parentInfo === null) {
      throw new Error(`Invalid orbit traversal: reached root before 37`);
    }

    path.unshift(parentInfo.op); // Prepend to build forward path
    current = parentInfo.from;
  }

  return path;
}

/**
 * Apply a sequence of transforms starting from a class
 *
 * @param start Starting class index
 * @param transforms Sequence of transforms to apply
 * @returns Resulting class index after all transforms
 *
 * Note: Requires Atlas models to be available at runtime.
 * For pure computation, use this during model execution.
 */
export function applyOrbitPath(start: number, transforms: OrbitTransform[]): number {
  // This would require importing Atlas models, which creates circular dependency
  // Instead, this is a utility for external use
  throw new Error(
    'applyOrbitPath requires Atlas models - use at model execution time',
  );
}

/**
 * Verify orbit table consistency
 *
 * Validates that:
 * - Distance table and parent table are consistent
 * - All classes are reachable from 37
 * - Distances match computed path lengths
 *
 * @returns true if tables are consistent
 */
export function verifyOrbitTables(): boolean {
  for (let i = 0; i < 96; i++) {
    if (i === 37) {
      // Root should have distance 0 and no parent
      if (ORBIT_DISTANCE_TABLE[i] !== 0) return false;
      if (ORBIT_PARENT_TABLE[i] !== null) return false;
      continue;
    }

    // Non-root should have parent
    if (ORBIT_PARENT_TABLE[i] === null) return false;

    // Distance should match path length
    const path = computeOrbitPath(i);
    if (path.length !== ORBIT_DISTANCE_TABLE[i]) return false;

    // Parent should have distance one less
    const parentInfo = ORBIT_PARENT_TABLE[i]!;
    const parentDist = ORBIT_DISTANCE_TABLE[parentInfo.from];
    const currentDist = ORBIT_DISTANCE_TABLE[i];
    if (parentDist !== currentDist - 1) return false;
  }

  return true;
}

/**
 * Get statistics about the orbit structure
 */
export function getOrbitStatistics(): {
  size: number;
  diameter: number;
  averageDistance: number;
  distanceHistogram: Map<number, number>;
} {
  const histogram = new Map<number, number>();

  let sum = 0;
  for (const dist of ORBIT_DISTANCE_TABLE) {
    sum += dist;
    histogram.set(dist, (histogram.get(dist) ?? 0) + 1);
  }

  return {
    size: ORBIT_DISTANCE_TABLE.length,
    diameter: Math.max(...ORBIT_DISTANCE_TABLE),
    averageDistance: sum / ORBIT_DISTANCE_TABLE.length,
    distanceHistogram: histogram,
  };
}
