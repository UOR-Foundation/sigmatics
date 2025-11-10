/**
 * Extreme Scale Subset Sum Solver (Demonstration)
 * ------------------------------------------------
 * Showcases how Sigmatics' declarative model + fused circuits worldview can be
 * wrapped around a heavily pruned search over large combinatorial spaces.
 *
 * IMPORTANT: This is an illustrative geometric / constraint–driven pruning
 * model, not a proof of sub‑exponential complexity. It demonstrates layered
 * constraint cascades, modular feasibility pruning, and circuit materialization
 * of discovered subsets back into Sigmatics expressions.
 *
 * Two run modes:
 *   QUICK (default)  -> small n values so it finishes fast for CI / examples
 *   FULL             -> attempts the entire benchmark suite (can be long)
 *
 * Usage:
 *   npx ts-node extreme-scale-subset-sum.ts            # quick mode
 *   RUN_MODE=FULL npx ts-node extreme-scale-subset-sum.ts  # full benchmark
 */

import Atlas from '@uor-foundation/sigmatics';

interface OrbitEncoding {
  value: number;
  index: number;
  orbitId: number;
  h2: number; // quadrant (0..3)
  l: number; // ring position (0..7)
  // modular signatures
  m2: number;
  m3: number;
  m4: number;
  m5: number;
  m7: number;
  m8: number;
  m11: number;
  m13: number;
}

interface EncodingResult {
  orbits: OrbitEncoding[];
  cumSums: number[]; // prefix sums
}

interface ConstraintTables {
  target: number;
  modular: Record<string, number>;
  bounds: { min: number; max: number; sum: number; avg: number };
  modularTables: Record<number, Set<number>>;
}

interface SearchStats {
  nodesExplored: number;
  nodesPruned: number;
  level1Prunes: number;
  level2Prunes: number;
  level3Prunes: number;
  level4Prunes: number;
  totalSpace?: number;
  reduction?: number;
  elapsed?: number;
  nodesPerSecond?: number;
}

class HyperscaleGeometricSolver {
  private numbers: number[];
  private target: number;
  private n: number;
  private encoding: EncodingResult;
  private constraints: ConstraintTables;
  private stats: SearchStats;

  constructor(numbers: number[], target: number) {
    this.numbers = numbers;
    this.target = target;
    this.n = numbers.length;
    this.encoding = this.hyperEncode();
    this.constraints = this.compileHyperConstraints();
    this.stats = {
      nodesExplored: 0,
      nodesPruned: 0,
      level1Prunes: 0,
      level2Prunes: 0,
      level3Prunes: 0,
      level4Prunes: 0,
    };
  }

  private hyperEncode(): EncodingResult {
    const orbits: OrbitEncoding[] = this.numbers.map((num, idx) => {
      const h2 = num % 4;
      const l = (num * 7 + idx) % 8;
      const orbitId = h2 * 8 + l;
      return {
        value: num,
        index: idx,
        orbitId,
        h2,
        l,
        m2: num % 2,
        m3: num % 3,
        m4: num % 4,
        m5: num % 5,
        m7: num % 7,
        m8: num % 8,
        m11: num % 11,
        m13: num % 13,
      };
    });

    const cumSums = new Array(this.n + 1).fill(0);
    for (let i = 0; i < this.n; i++) cumSums[i + 1] = cumSums[i] + this.numbers[i];

    return { orbits, cumSums };
  }

  private compileHyperConstraints(): ConstraintTables {
    const bounds = {
      min: Math.min(...this.numbers),
      max: Math.max(...this.numbers),
      sum: this.numbers.reduce((a, b) => a + b, 0),
      avg: this.numbers.reduce((a, b) => a + b, 0) / this.numbers.length,
    };
    const modular = {
      m2: this.target % 2,
      m3: this.target % 3,
      m4: this.target % 4,
      m5: this.target % 5,
      m7: this.target % 7,
      m8: this.target % 8,
      m11: this.target % 11,
      m13: this.target % 13,
    };
    const modularTables = this.precomputeModularTables();
    return { target: this.target, modular, bounds, modularTables };
  }

  private precomputeModularTables(): Record<number, Set<number>> {
    const tables: Record<number, Set<number>> = {};
    for (const mod of [2, 3, 4, 5, 7, 8, 11, 13]) {
      const possible = new Set<number>([0]);
      for (const num of this.numbers) {
        const newPossible = new Set<number>(possible);
        for (const p of possible) newPossible.add((p + (num % mod)) % mod);
        tables[mod] = newPossible; // store intermediate expansions (over-approx)
      }
    }
    return tables;
  }

  private canMakeMod(pos: number, target: number, mod: number): boolean {
    // Conservative feasibility check from remaining slice
    const possible = new Set<number>([0]);
    for (let i = pos; i < this.n; i++) {
      const val = this.encoding.orbits[i].value % mod;
      const next = new Set<number>();
      for (const p of possible) {
        next.add(p);
        next.add((p + val) % mod);
      }
      possible.clear();
      next.forEach((v) => possible.add(v));
      if (possible.has(target)) return true;
      if (possible.size === mod) return true; // saturated
    }
    return possible.has(target);
  }

  private prune(sum: number, pos: number): boolean {
    // Level 1: Bounds
    if (sum > this.target) {
      this.stats.level1Prunes++;
      return true;
    }
    const remaining = this.encoding.cumSums[this.n] - this.encoding.cumSums[pos];
    if (sum + remaining < this.target) {
      this.stats.level1Prunes++;
      return true;
    }

    // Level 2: quick modular (mod 8)
    const needed = this.target - sum;
    if (!this.canMakeMod(pos, needed % 8, 8)) {
      this.stats.level2Prunes++;
      return true;
    }

    // Level 3: deeper modular combos
    if (!this.canMakeMod(pos, needed % 3, 3)) {
      this.stats.level3Prunes++;
      return true;
    }

    // Level 4: rare expensive check (mod 13) early in tree
    if (pos < this.n - 10 && !this.canMakeMod(pos, needed % 13, 13)) {
      this.stats.level4Prunes++;
      return true;
    }
    return false;
  }

  search(maxSolutions = 3, maxTimeMs = 5_000) {
    const solutions: number[][] = [];
    const start = Date.now();
    const selection = new Array(this.n).fill(0);

    const dfs = (pos: number, sum: number) => {
      if (Date.now() - start > maxTimeMs) return;
      if (solutions.length >= maxSolutions) return;
      this.stats.nodesExplored++;

      if (pos === this.n) {
        if (sum === this.target) solutions.push([...selection]);
        return;
      }

      if (this.prune(sum, pos)) {
        this.stats.nodesPruned++;
        return;
      }

      const val = this.numbers[pos];
      // choose
      selection[pos] = 1;
      dfs(pos + 1, sum + val);
      // skip
      selection[pos] = 0;
      dfs(pos + 1, sum);
    };

    dfs(0, 0);
    const elapsed = Date.now() - start;
    const totalSpace = Math.pow(2, this.n);

    this.stats.totalSpace = totalSpace;
    this.stats.elapsed = elapsed;
    this.stats.reduction = (this.stats.nodesPruned / totalSpace) * 100;
    this.stats.nodesPerSecond = this.stats.nodesExplored / (elapsed / 1000 || 1);

    return { solutions, stats: this.stats };
  }

  toCircuit(selection: number[]) {
    const indices = selection.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
    if (!indices.length) return null;
    const values = indices.map((i) => this.numbers[i]);
    const sum = values.reduce((a, b) => a + b, 0);

    if (indices.length > 24) {
      return { values: values.slice(0, 24), sum, circuitSize: indices.length };
    }

    const terms = indices.map((i) => {
      const o = this.encoding.orbits[i];
      // map (h2,l) into canonical class index-ish display (not an exact semantic map)
      const pseudoClass = 24 * o.h2 + o.l; // compress l into low bits
      return `mark@c${pseudoClass.toString().padStart(2, '0')}`;
    });
    return { values, sum, circuit: terms.join(' || ') };
  }
}

// ----------------------------------------------------------------------------
// Benchmark Harness
// ----------------------------------------------------------------------------

interface BenchmarkCase {
  name: string;
  n: number;
  gen: (n: number) => number[];
  target: number;
  time?: number;
}

const FULL_BENCH: BenchmarkCase[] = [
  {
    name: 'Warmup',
    n: 30,
    gen: (n) => Array.from({ length: n }, (_, i) => (i + 1) * 2),
    target: 200,
  },
  {
    name: 'Large',
    n: 50,
    gen: (n) => Array.from({ length: n }, (_, i) => (i + 1) * 3),
    target: 500,
  },
  {
    name: 'Very Large',
    n: 75,
    gen: (n) => Array.from({ length: n }, (_, i) => (i + 1) * 2 + 1),
    target: 750,
  },
  {
    name: 'Extreme',
    n: 100,
    gen: (n) => Array.from({ length: n }, (_, i) => (i + 1) * 4),
    target: 1000,
  },
  {
    name: 'Hyperscale',
    n: 150,
    gen: (n) => Array.from({ length: n }, (_, i) => (i + 1) * 3 + (i % 7)),
    target: 1500,
  },
];

const QUICK_BENCH: BenchmarkCase[] = [
  {
    name: 'Quick-Warmup',
    n: 20,
    gen: (n) => Array.from({ length: n }, (_, i) => (i + 1) * 2),
    target: 90,
  },
  {
    name: 'Quick-Mid',
    n: 28,
    gen: (n) => Array.from({ length: n }, (_, i) => (i + 1) * 3),
    target: 250,
  },
  {
    name: 'Quick-Large',
    n: 32,
    gen: (n) => Array.from({ length: n }, (_, i) => (i + 1) * 3 + (i % 5)),
    target: 400,
  },
];

const RUN_MODE = process.env.RUN_MODE === 'FULL' ? 'FULL' : 'QUICK';
const SUITE = RUN_MODE === 'FULL' ? FULL_BENCH : QUICK_BENCH;

console.log('╔' + '═'.repeat(78) + '╗');
console.log('║' + ` EXTREME SCALE SUBSET SUM (MODE: ${RUN_MODE}) `.padEnd(78) + '║');
console.log('╚' + '═'.repeat(78) + '╝\n');

const results: any[] = [];

for (const test of SUITE) {
  console.log('┌' + '─'.repeat(78) + '┐');
  console.log('│ ' + `${test.name.toUpperCase()}: n=${test.n}`.padEnd(76) + ' │');
  console.log('└' + '─'.repeat(78) + '┘');

  const numbers = test.gen(test.n);
  const classicalSpace = Math.pow(2, test.n);
  console.log(`  Classical Space: 2^${test.n} ≈ ${classicalSpace.toExponential(2)}`);
  console.log(`  Target: ${test.target}`);
  console.log('  Building constraints...');

  const solver = new HyperscaleGeometricSolver(numbers, test.target);
  console.log('  Searching (geometric pruning)...');
  const { solutions, stats } = solver.search(3, RUN_MODE === 'FULL' ? 15_000 : 3_000);

  console.log('  ✓ Search complete');
  console.log(`    Nodes Explored: ${stats.nodesExplored.toLocaleString()}`);
  console.log(`    Nodes Pruned:   ${stats.nodesPruned.toLocaleString()}`);
  console.log(
    `    L1/L2/L3/L4:    ${stats.level1Prunes}/${stats.level2Prunes}/${stats.level3Prunes}/${stats.level4Prunes}`,
  );
  console.log(`    Time (ms):      ${stats.elapsed}`);
  const speedup =
    stats.totalSpace && stats.nodesExplored > 0 ? stats.totalSpace / stats.nodesExplored : 0;
  console.log(`    Speedup vs brute force (approx): ${speedup.toExponential(2)}`);
  console.log(`    Throughput:     ${stats.nodesPerSecond?.toFixed(0)} nodes/sec`);
  console.log(`    Solutions:      ${solutions.length}`);

  if (solutions.length) {
    const circuit = solver.toCircuit(solutions[0]);
    if (circuit) {
      console.log('    Sample Materialization:');
      if ('circuitSize' in circuit) {
        console.log(`      Circuit Size: ${circuit.circuitSize}`);
        console.log(`      Values (sample): [${circuit.values.slice(0, 8).join(', ')}...]`);
      } else {
        console.log(`      Values: [${circuit.values.join(', ')}]`);
        console.log(`      Sum:    ${circuit.sum}`);
        console.log(`      Circuit: ${circuit.circuit}`);
      }
    }
  }
  console.log();

  results.push({ name: test.name, n: test.n, classicalSpace, ...stats });
}

console.log('═'.repeat(80));
console.log('SUMMARY');
console.log('═'.repeat(80));
console.log(
  'Scale                | n   | Classical Space    | Explored    | Speedup    | Time (ms)',
);
console.log('-'.repeat(80));
for (const r of results) {
  const classical = r.classicalSpace.toExponential(2).padStart(17);
  const explored = r.nodesExplored.toLocaleString().padStart(11);
  const speed = (r.classicalSpace / (r.nodesExplored || 1)).toExponential(2).padStart(11);
  const time = String(r.elapsed).padStart(9);
  console.log(
    `${r.name.padEnd(20)} | ${String(r.n).padStart(3)} | ${classical} | ${explored} | ${speed} | ${time}`,
  );
}

console.log('\nKey Takeaways:');
console.log('  • Layered pruning dramatically reduces explored space vs 2^n.');
console.log('  • Modular feasibility checks act as cheap high-yield filters.');
console.log('  • Materialization step shows how subsets can become Sigmatics circuits.');
console.log('  • Demonstrates how geometric / algebraic structure guides search.');
console.log();
console.log('(Demonstration only — not a formal complexity breakthrough.)');
