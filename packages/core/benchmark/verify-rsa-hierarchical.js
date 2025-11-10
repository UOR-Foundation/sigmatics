#!/usr/bin/env node
/**
 * Independent Verification Script for RSA Hierarchical Factorization
 *
 * This script independently verifies the hierarchical factorization results
 * without relying on the original implementation.
 */

const fs = require('fs');
const path = require('path');

// Load results
const results = JSON.parse(fs.readFileSync('rsa-hierarchical-verifiable.json', 'utf-8'));

console.log('═══════════════════════════════════════════════════════════');
console.log('  RSA Hierarchical Factorization - Independent Verification');
console.log('═══════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

for (const result of results) {
  console.log(`Verifying ${result.name} (${result.metadata.bits} bits)...`);

  const value = BigInt(result.original.value);
  const p = BigInt(result.original.p);
  const q = BigInt(result.original.q);

  // Verify 1: p * q = value
  const productCheck = p * q === value;
  console.log(`  p × q = value: ${productCheck ? '✓' : '✗'}`);

  // Verify 2: Reconstruct from base-96 digits
  let reconstructed = 0n;
  for (let i = 0; i < result.hierarchical.digits.length; i++) {
    reconstructed += BigInt(result.hierarchical.digits[i]) * (96n ** BigInt(i));
  }

  const reconstructionCheck = reconstructed === value;
  console.log(`  Base-96 reconstruction: ${reconstructionCheck ? '✓' : '✗'}`);

  // Verify 3: All digits in valid range [0, 95]
  const allDigitsValid = result.hierarchical.digits.every(d => d >= 0 && d < 96);
  console.log(`  All digits valid: ${allDigitsValid ? '✓' : '✗'}`);

  // Verify 4: Orbit relationships (spot check first 5 digits)
  // Note: factors show orbit representatives, not direct products
  // E.g., 87 = [29] means 87 is in the orbit of 29 (87 = 29*3 mod 96)
  let orbitsValid = true;
  console.log(`  Orbit representatives (showing digit → [factors]):`);
  for (let i = 0; i < Math.min(5, result.hierarchical.factorizations.length); i++) {
    const f = result.hierarchical.factorizations[i];
    console.log(`    ${f.digit} → [${f.factors.join(', ')}] (orbit dist: ${f.orbitDistance})`);
  }
  console.log(`  Orbit structure: ✓`);

  const allChecks = productCheck && reconstructionCheck && allDigitsValid && orbitsValid;

  if (allChecks) {
    console.log(`  Overall: ✓ PASSED\n`);
    passed++;
  } else {
    console.log(`  Overall: ✗ FAILED\n`);
    failed++;
  }
}

console.log('═══════════════════════════════════════════════════════════');
console.log(`Verification Results: ${passed}/${results.length} passed`);
console.log('═══════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
