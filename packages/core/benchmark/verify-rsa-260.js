#!/usr/bin/env node
/**
 * Independent Verification for RSA-260 Analysis
 */

const fs = require('fs');

const analysis = JSON.parse(fs.readFileSync('rsa-260-analysis.json', 'utf-8'));

console.log('═══════════════════════════════════════════════════════════');
console.log('  RSA-260 Analysis - Independent Verification');
console.log('═══════════════════════════════════════════════════════════\n');

const value = BigInt(analysis.original.value);

// Verify 1: Reconstruct from base-96 digits
let reconstructed = 0n;
for (let i = 0; i < analysis.hierarchical.digits.length; i++) {
  reconstructed += BigInt(analysis.hierarchical.digits[i]) * (96n ** BigInt(i));
}

console.log('Verification Checks:');
console.log(`  Original value: ${value.toString().substring(0, 60)}...`);
console.log(`  Reconstructed:  ${reconstructed.toString().substring(0, 60)}...`);
console.log(`  Match: ${reconstructed === value ? '✓' : '✗'}`);
console.log();

// Verify 2: All digits valid
const allDigitsValid = analysis.hierarchical.digits.every(d => d >= 0 && d < 96);
console.log(`  All digits in [0,95]: ${allDigitsValid ? '✓' : '✗'}`);
console.log();

// Statistics
console.log('Statistics:');
console.log(`  Digit count: ${analysis.hierarchical.digitCount}`);
console.log(`  Unique digits: ${analysis.statistics.uniqueDigits}`);
console.log(`  Entropy: ${analysis.statistics.entropy.toFixed(3)} bits/digit`);
console.log(`  Avg orbit distance: ${analysis.statistics.avgOrbitDistance.toFixed(2)}`);
console.log(`  Avg complexity: ${analysis.statistics.avgComplexity.toFixed(2)}`);
console.log();

console.log('IMPORTANT DISCLAIMER:');
console.log('─────────────────────');
console.log(analysis.disclaimer);
console.log();

if (reconstructed === value && allDigitsValid) {
  console.log('✓ Verification PASSED: Base-96 decomposition is correct.');
} else {
  console.log('✗ Verification FAILED');
  process.exit(1);
}
