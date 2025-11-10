#!/usr/bin/env node
/**
 * RSA Numbers Parser and Validator
 *
 * Parses RSA challenge numbers from Wikipedia HTML and validates them
 * as balanced semiprimes for use in hierarchical factorization testing.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * RSA challenge number with its factorization
 */
export interface RSANumber {
  /** Name (e.g., "RSA-100") */
  name: string;
  /** Number of decimal digits or bits */
  size: number;
  /** The composite number (product of two primes) */
  value: bigint;
  /** First prime factor */
  p: bigint;
  /** Second prime factor */
  q: bigint;
  /** Whether it's factored */
  factored: boolean;
  /** Year factored (if known) */
  yearFactored?: number;
  /** Number of bits */
  bits: number;
}

/**
 * Parse RSA numbers from Wikipedia HTML
 */
export function parseRSANumbersFromHTML(htmlPath: string): RSANumber[] {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const numbers: RSANumber[] = [];

  // Pattern to match RSA number sections
  const sectionPattern = /<h2 id="(RSA-\d+)">/g;
  const sections: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = sectionPattern.exec(html)) !== null) {
    sections.push(match[1]);
  }

  for (const name of sections) {
    try {
      // Extract the section content
      const sectionStart = html.indexOf(`id="${name}"`);
      if (sectionStart === -1) continue;

      const nextSection = html.indexOf('<h2 id="', sectionStart + 1);
      const sectionEnd = nextSection === -1 ? html.length : nextSection;
      const sectionContent = html.substring(sectionStart, sectionEnd);

      // Extract value and factors from <pre> tags
      const prePattern = /<pre>(.*?)<\/pre>/gs;
      const preMatches = Array.from(sectionContent.matchAll(prePattern));

      if (preMatches.length >= 2) {
        // First <pre> tag contains the composite number
        const valueLine = preMatches[0][1].replace(/\s+/g, '');
        const valueMatch = valueLine.match(/RSA-\d+\s*=\s*(\d+)/);

        if (valueMatch) {
          const valueStr = valueMatch[1];
          const value = BigInt(valueStr);

          // Second <pre> tag contains the factors (separated by × or *)
          let p: bigint | null = null;
          let q: bigint | null = null;

          if (preMatches.length >= 2) {
            const factorLine = preMatches[1][1].replace(/\s+/g, '');

            // Try pattern: RSA-nnn = p × q
            const factorMatch = factorLine.match(/RSA-\d+\s*=\s*(\d+)\s*[×*]\s*(\d+)/);

            if (factorMatch) {
              p = BigInt(factorMatch[1]);
              q = BigInt(factorMatch[2]);
            }
          }

          if (p && q) {
            // Validate that p * q = value
            if (p * q !== value) {
              console.warn(`Validation failed for ${name}: p * q ≠ value`);
              continue;
            }

            // Extract size from name (e.g., RSA-100 → 100)
            const sizeMatch = name.match(/RSA-(\d+)/);
            const size = sizeMatch ? parseInt(sizeMatch[1], 10) : 0;

            // Compute bit length
            const bits = value.toString(2).length;

            // Extract year factored (if mentioned)
            let yearFactored: number | undefined;
            const yearMatch = sectionContent.match(/factored.*?(\d{4})/i);
            if (yearMatch) {
              yearFactored = parseInt(yearMatch[1], 10);
            }

            numbers.push({
              name,
              size,
              value,
              p,
              q,
              factored: true,
              yearFactored,
              bits,
            });
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to parse ${name}: ${e}`);
    }
  }

  return numbers.sort((a, b) => a.size - b.size);
}

/**
 * Validate that an RSA number is a balanced semiprime
 */
export function validateBalancedSemiprime(rsa: RSANumber): {
  valid: boolean;
  errors: string[];
  properties: {
    isPrime_p: boolean;
    isPrime_q: boolean;
    productCorrect: boolean;
    balanced: boolean;
    balanceRatio: number;
  };
} {
  const errors: string[] = [];

  // Check that p and q are prime (Miller-Rabin test)
  const isPrime_p = isProbablePrime(rsa.p, 20);
  const isPrime_q = isProbablePrime(rsa.q, 20);

  if (!isPrime_p) {
    errors.push(`p = ${rsa.p} is not prime`);
  }
  if (!isPrime_q) {
    errors.push(`q = ${rsa.q} is not prime`);
  }

  // Check that p * q = value
  const productCorrect = rsa.p * rsa.q === rsa.value;
  if (!productCorrect) {
    errors.push(`p * q ≠ value (${rsa.p * rsa.q} ≠ ${rsa.value})`);
  }

  // Check balance: p and q should be roughly the same size
  const pBits = rsa.p.toString(2).length;
  const qBits = rsa.q.toString(2).length;
  const balanceRatio = pBits / qBits;
  const balanced = balanceRatio > 0.9 && balanceRatio < 1.1;

  if (!balanced) {
    errors.push(
      `Unbalanced: p has ${pBits} bits, q has ${qBits} bits (ratio ${balanceRatio.toFixed(2)})`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    properties: {
      isPrime_p,
      isPrime_q,
      productCorrect,
      balanced,
      balanceRatio,
    },
  };
}

/**
 * Miller-Rabin primality test (probabilistic)
 */
function isProbablePrime(n: bigint, rounds: number = 20): boolean {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;

  // Write n-1 as 2^r * d
  let d = n - 1n;
  let r = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    r++;
  }

  // Witness loop
  for (let i = 0; i < rounds; i++) {
    const a = randomBigInt(2n, n - 2n);
    let x = modPow(a, d, n);

    if (x === 1n || x === n - 1n) continue;

    let continueWitnessLoop = false;
    for (let j = 0n; j < r - 1n; j++) {
      x = modPow(x, 2n, n);
      if (x === n - 1n) {
        continueWitnessLoop = true;
        break;
      }
    }

    if (continueWitnessLoop) continue;

    return false; // Composite
  }

  return true; // Probably prime
}

/**
 * Modular exponentiation: (base^exp) mod mod
 */
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % mod;
    }
    exp = exp >> 1n;
    base = (base * base) % mod;
  }
  return result;
}

/**
 * Generate random bigint in range [min, max]
 */
function randomBigInt(min: bigint, max: bigint): bigint {
  const range = max - min + 1n;
  const bits = range.toString(2).length;
  const bytes = Math.ceil(bits / 8);

  let result: bigint;
  do {
    const randomBytes = Buffer.alloc(bytes);
    for (let i = 0; i < bytes; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
    result = BigInt('0x' + randomBytes.toString('hex'));
  } while (result >= range);

  return min + result;
}

/**
 * Compute statistics for RSA numbers dataset
 */
export function computeRSAStatistics(numbers: RSANumber[]): {
  count: number;
  sizeRange: [number, number];
  bitRange: [number, number];
  factored: number;
  unfactored: number;
  yearRange: [number, number];
  avgBalanceRatio: number;
} {
  const sizes = numbers.map((n) => n.size);
  const bits = numbers.map((n) => n.bits);
  const factored = numbers.filter((n) => n.factored).length;
  const yearsFactored = numbers
    .filter((n) => n.yearFactored !== undefined)
    .map((n) => n.yearFactored!);

  const balanceRatios: number[] = [];
  for (const rsa of numbers) {
    const pBits = rsa.p.toString(2).length;
    const qBits = rsa.q.toString(2).length;
    balanceRatios.push(pBits / qBits);
  }

  return {
    count: numbers.length,
    sizeRange: [Math.min(...sizes), Math.max(...sizes)],
    bitRange: [Math.min(...bits), Math.max(...bits)],
    factored,
    unfactored: numbers.length - factored,
    yearRange:
      yearsFactored.length > 0
        ? [Math.min(...yearsFactored), Math.max(...yearsFactored)]
        : [0, 0],
    avgBalanceRatio:
      balanceRatios.reduce((sum, r) => sum + r, 0) / balanceRatios.length,
  };
}

// Main execution
if (require.main === module) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RSA Numbers Parser and Validator');
  console.log('═══════════════════════════════════════════════════════════\n');

  const htmlPath = path.join(__dirname, '../../../RSA_numbers.html');

  if (!fs.existsSync(htmlPath)) {
    console.error(`Error: RSA_numbers.html not found at ${htmlPath}`);
    process.exit(1);
  }

  console.log(`Parsing RSA numbers from: ${htmlPath}\n`);

  const numbers = parseRSANumbersFromHTML(htmlPath);

  console.log(`Parsed ${numbers.length} RSA numbers\n`);

  // Compute statistics
  const stats = computeRSAStatistics(numbers);

  console.log('Dataset Statistics:');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Total numbers: ${stats.count}`);
  console.log(`  Size range: ${stats.sizeRange[0]} - ${stats.sizeRange[1]} (decimal digits/bits)`);
  console.log(`  Bit range: ${stats.bitRange[0]} - ${stats.bitRange[1]} bits`);
  console.log(`  Factored: ${stats.factored}`);
  console.log(`  Unfactored: ${stats.unfactored}`);
  if (stats.yearRange[0] > 0) {
    console.log(`  Years factored: ${stats.yearRange[0]} - ${stats.yearRange[1]}`);
  }
  console.log(`  Avg balance ratio: ${stats.avgBalanceRatio.toFixed(3)}`);
  console.log();

  // Validate first 10 numbers
  console.log('Validating First 10 Numbers:');
  console.log('───────────────────────────────────────────────────────────\n');

  for (let i = 0; i < Math.min(10, numbers.length); i++) {
    const rsa = numbers[i];
    const validation = validateBalancedSemiprime(rsa);

    console.log(`${rsa.name} (${rsa.bits} bits):`);
    console.log(`  Value: ${rsa.value.toString().substring(0, 60)}...`);
    console.log(`  p: ${rsa.p.toString().substring(0, 50)}... (${rsa.p.toString(2).length} bits)`);
    console.log(`  q: ${rsa.q.toString().substring(0, 50)}... (${rsa.q.toString(2).length} bits)`);
    console.log(`  Valid: ${validation.valid ? '✓' : '✗'}`);
    console.log(`  Product correct: ${validation.properties.productCorrect ? '✓' : '✗'}`);
    console.log(`  Balanced: ${validation.properties.balanced ? '✓' : '✗'} (ratio ${validation.properties.balanceRatio.toFixed(3)})`);
    console.log(`  p prime: ${validation.properties.isPrime_p ? '✓' : '✗'}`);
    console.log(`  q prime: ${validation.properties.isPrime_q ? '✓' : '✗'}`);

    if (validation.errors.length > 0) {
      console.log(`  Errors:`);
      for (const error of validation.errors) {
        console.log(`    - ${error}`);
      }
    }

    console.log();
  }

  // Export to JSON
  const outputPath = path.join(__dirname, 'rsa-numbers.json');
  const jsonData = numbers.map((n) => ({
    name: n.name,
    size: n.size,
    bits: n.bits,
    value: n.value.toString(),
    p: n.p.toString(),
    q: n.q.toString(),
    factored: n.factored,
    yearFactored: n.yearFactored,
  }));

  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
  console.log(`\nExported ${numbers.length} RSA numbers to: ${outputPath}`);

  console.log('═══════════════════════════════════════════════════════════\n');
}
