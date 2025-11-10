#!/usr/bin/env node
/**
 * E₇ Matrix Eigenvalue Analysis
 *
 * Computes and analyzes the eigenvalue spectrum of the 96×96 E₇ adjacency matrix.
 * The eigenvalues reveal the spectral structure of the orbit graph and may contain
 * signatures of the E₇ Lie algebra.
 */

import {
  buildE7Matrix,
  computeEigenvalues,
  computeSpectralProperties,
} from '../src/compiler/e7-matrix';

console.log('═══════════════════════════════════════════════════════════');
console.log('  E₇ Matrix Eigenvalue Analysis');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Building E₇ matrix...');
const E7 = buildE7Matrix();
console.log('Matrix constructed (96×96)\n');

console.log('Computing eigenvalues via QR algorithm...');
console.log('(This may take a minute for a 96×96 matrix)\n');

const startTime = Date.now();
const spectral = computeSpectralProperties(E7);
const endTime = Date.now();

console.log(`Computation time: ${((endTime - startTime) / 1000).toFixed(2)}s\n`);

console.log('───────────────────────────────────────────────────────────');
console.log('Spectral Properties');
console.log('───────────────────────────────────────────────────────────\n');

console.log(`Spectral radius (λ_max): ${spectral.spectralRadius.toFixed(6)}`);
console.log(`Algebraic connectivity (λ_{n-1}): ${spectral.algebraicConnectivity.toFixed(6)}`);
console.log(`Number of eigenvalues: ${spectral.eigenvalues.length}`);
console.log();

// Analyze eigenvalue distribution
console.log('Eigenvalue Distribution:');
console.log('─────────────────────────────────────────────────────────────\n');

// Group eigenvalues into ranges
const ranges = [
  { min: 6, max: Infinity, label: '≥ 6' },
  { min: 4, max: 6, label: '[4, 6)' },
  { min: 2, max: 4, label: '[2, 4)' },
  { min: 0, max: 2, label: '[0, 2)' },
  { min: -2, max: 0, label: '[-2, 0)' },
  { min: -4, max: -2, label: '[-4, -2)' },
  { min: -Infinity, max: -4, label: '< -4' },
];

for (const range of ranges) {
  const count = spectral.eigenvalues.filter((λ) => λ >= range.min && λ < range.max).length;
  if (count > 0) {
    const bar = '█'.repeat(Math.ceil((count / spectral.eigenvalues.length) * 50));
    console.log(`  ${range.label.padEnd(12)} ${count.toString().padStart(3)} ${bar}`);
  }
}
console.log();

// Print top 10 eigenvalues
console.log('Top 10 Eigenvalues:');
console.log('─────────────────────────────────────────────────────────────\n');

for (let i = 0; i < Math.min(10, spectral.eigenvalues.length); i++) {
  const λ = spectral.eigenvalues[i];
  console.log(`  λ_${i.toString().padStart(2)}: ${λ.toFixed(10)}`);
}
console.log();

// Print bottom 10 eigenvalues
console.log('Bottom 10 Eigenvalues:');
console.log('─────────────────────────────────────────────────────────────\n');

const startIdx = Math.max(0, spectral.eigenvalues.length - 10);
for (let i = startIdx; i < spectral.eigenvalues.length; i++) {
  const λ = spectral.eigenvalues[i];
  console.log(`  λ_${i.toString().padStart(2)}: ${λ.toFixed(10)}`);
}
console.log();

// Degeneracies
if (spectral.degeneracies.size > 0) {
  console.log('Eigenvalue Degeneracies:');
  console.log('─────────────────────────────────────────────────────────────\n');

  const sortedDegeneracies = Array.from(spectral.degeneracies.entries()).sort(
    (a, b) => b[1] - a[1],
  );

  for (const [value, multiplicity] of sortedDegeneracies) {
    console.log(`  λ ≈ ${value.toFixed(6)}: multiplicity ${multiplicity}`);
  }
  console.log();
}

// Eigenvalue gaps
console.log('Largest Eigenvalue Gaps:');
console.log('─────────────────────────────────────────────────────────────\n');

const sortedGaps = spectral.eigenvalueGaps
  .map((gap, i) => ({ gap, index: i }))
  .sort((a, b) => b.gap - a.gap)
  .slice(0, 10);

for (const { gap, index } of sortedGaps) {
  console.log(
    `  λ_${index.toString().padStart(2)} - λ_${(index + 1).toString().padStart(2)}: ${gap.toFixed(6)}`,
  );
}
console.log();

// Check for E₇-related patterns
console.log('E₇ Pattern Analysis:');
console.log('─────────────────────────────────────────────────────────────\n');

// E₇ dimension is 133
const e7Dim = 133;
console.log(`E₇ Lie algebra dimension: ${e7Dim}`);
console.log(`133 mod 96 = ${e7Dim % 96} (prime generator)`);
console.log();

// Check trace (sum of eigenvalues = sum of diagonal)
const trace = spectral.eigenvalues.reduce((sum, λ) => sum + λ, 0);
console.log(`Trace (Σλ_i): ${trace.toFixed(6)}`);

// Check if trace matches diagonal sum
let diagSum = 0;
for (let i = 0; i < 96; i++) {
  diagSum += E7[i][i];
}
console.log(`Diagonal sum: ${diagSum.toFixed(6)}`);
console.log(`Match: ${Math.abs(trace - diagSum) < 1e-6 ? '✓' : '✗'}`);
console.log();

// Frobenius norm
const frobeniusNorm = Math.sqrt(spectral.eigenvalues.reduce((sum, λ) => sum + λ * λ, 0));
console.log(`Frobenius norm: ${frobeniusNorm.toFixed(6)}`);
console.log();

// Check for symmetry in eigenvalue spectrum
const positiveEigenvalues = spectral.eigenvalues.filter((λ) => λ > 1e-10).length;
const negativeEigenvalues = spectral.eigenvalues.filter((λ) => λ < -1e-10).length;
const zeroEigenvalues = spectral.eigenvalues.filter((λ) => Math.abs(λ) <= 1e-10).length;

console.log('Eigenvalue Sign Distribution:');
console.log(`  Positive: ${positiveEigenvalues}`);
console.log(`  Zero: ${zeroEigenvalues}`);
console.log(`  Negative: ${negativeEigenvalues}`);
console.log();

console.log('───────────────────────────────────────────────────────────');
console.log('Summary');
console.log('───────────────────────────────────────────────────────────\n');

console.log('The eigenvalue spectrum reveals:');
console.log(`  • Spectral radius: ${spectral.spectralRadius.toFixed(2)} (maximum connectivity)`);
console.log(`  • Algebraic connectivity: ${spectral.algebraicConnectivity.toFixed(6)} (graph cohesion)`);
console.log(`  • ${spectral.degeneracies.size} distinct degeneracy patterns`);
console.log(`  • Trace = ${trace.toFixed(2)} (self-loops count)`);
console.log();

if (spectral.degeneracies.size > 0) {
  console.log('Eigenvalue degeneracies suggest underlying symmetry structure,');
  console.log('consistent with E₇ exceptional group automorphisms.');
}

console.log('═══════════════════════════════════════════════════════════\n');
