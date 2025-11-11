/**
 * J-Invariant and Modular Functions
 *
 * Implementation of the j-invariant modular function and related Eisenstein series.
 *
 * The j-invariant is the fundamental modular function with q-expansion:
 *   j(τ) = q⁻¹ + 744 + 196,884q + 21,493,760q² + ...
 *
 * Where q = e^(2πiτ) with τ in the upper half-plane.
 *
 * Formula:
 *   j(τ) = E₄³(τ) / Δ(τ)
 *
 * Where:
 *   - E₄(τ) = Eisenstein series of weight 4 = 1 + 240 ∑ σ₃(n)q^n
 *   - Δ(τ) = η²⁴(τ) = modular discriminant
 *   - η(τ) = Dedekind eta function = q^(1/24) ∏(1 - q^n)
 *
 * Note: Some references write j = 1728 · g₂³/Δ using different normalizations
 * of the Eisenstein series. With our normalization E₄ = 1 + 240∑σ₃(n)q^n,
 * the formula is simply j = E₄³/Δ.
 *
 * Monstrous Moonshine Connection:
 *   The coefficient c(1) = 196,884 relates to the Monster group:
 *   196,884 = 196,560 + 324
 *           = (Leech kissing number) + (smallest Monster rep)
 */

/**
 * Power series representation
 * Coefficients indexed by power of q (can be negative)
 */
export interface PowerSeries {
  /** Coefficients: Map from exponent to coefficient */
  coefficients: Map<number, number>;
  /** Minimum exponent (can be negative for poles) */
  minExp: number;
  /** Maximum exponent computed */
  maxExp: number;
}

/**
 * Compute sum of k-th powers of divisors: σₖ(n) = ∑(d|n) d^k
 */
export function sigmaPower(n: number, k: number): number {
  if (n <= 0) return 0;
  if (n === 1) return 1;

  let sum = 0;
  for (let d = 1; d <= n; d++) {
    if (n % d === 0) {
      sum += Math.pow(d, k);
    }
  }
  return sum;
}

/**
 * Precompute σₖ(n) for n = 1..maxN
 */
export function precomputeSigma(maxN: number, k: number): number[] {
  const sigma = new Array(maxN + 1).fill(0);
  sigma[0] = 0;

  for (let n = 1; n <= maxN; n++) {
    sigma[n] = sigmaPower(n, k);
  }

  return sigma;
}

/**
 * Eisenstein series E₄(q) of weight 4
 *
 * E₄(q) = 1 + 240 ∑(n≥1) σ₃(n)q^n
 *       = 1 + 240q + 2160q² + 6720q³ + ...
 *
 * Where σ₃(n) = sum of cubes of divisors of n.
 */
export function eisensteinE4(maxTerms: number): PowerSeries {
  const coefficients = new Map<number, number>();

  // Constant term
  coefficients.set(0, 1);

  // Precompute σ₃(n) for efficiency
  const sigma3 = precomputeSigma(maxTerms, 3);

  // Compute E₄ = 1 + 240 ∑ σ₃(n)q^n
  for (let n = 1; n <= maxTerms; n++) {
    coefficients.set(n, 240 * sigma3[n]);
  }

  return {
    coefficients,
    minExp: 0,
    maxExp: maxTerms,
  };
}

/**
 * Dedekind eta function η(q) q-expansion
 *
 * η(q) = q^(1/24) ∏(n≥1) (1 - q^n)
 *
 * For integer q-expansion, we use:
 * η²⁴(q) = q ∏(n≥1) (1 - q^n)²⁴
 *        = q - 24q² + 252q³ - 1472q⁴ + ...
 */
export function dedekindEta24(maxTerms: number): PowerSeries {
  const coefficients = new Map<number, number>();

  // Start with q^1
  coefficients.set(1, 1);

  // Compute product ∏(n≥1) (1 - q^n)²⁴
  // We do this iteratively: multiply current series by (1 - q^n)²⁴ for each n
  for (let n = 1; n <= maxTerms; n++) {
    // Expand (1 - q^n)²⁴ using binomial theorem
    // (1 - x)²⁴ = ∑(k=0 to 24) C(24,k) (-1)^k x^k
    const binomialCoeffs = computeBinomial(24);

    // Multiply current series by (1 - q^n)²⁴
    const newCoeffs = new Map<number, number>();

    // Copy existing coefficients
    for (const [exp, coeff] of coefficients) {
      if (!newCoeffs.has(exp)) newCoeffs.set(exp, 0);
      newCoeffs.set(exp, newCoeffs.get(exp)! + coeff);
    }

    // Add terms from (1 - q^n)²⁴ multiplication
    for (let k = 1; k <= 24 && n * k <= maxTerms; k++) {
      const sign = k % 2 === 0 ? 1 : -1;
      const binom = binomialCoeffs[k];

      for (const [exp, coeff] of coefficients) {
        const newExp = exp + n * k;
        if (newExp <= maxTerms) {
          if (!newCoeffs.has(newExp)) newCoeffs.set(newExp, 0);
          newCoeffs.set(newExp, newCoeffs.get(newExp)! + sign * binom * coeff);
        }
      }
    }

    coefficients.clear();
    for (const [exp, coeff] of newCoeffs) {
      coefficients.set(exp, coeff);
    }
  }

  return {
    coefficients,
    minExp: 1,
    maxExp: maxTerms,
  };
}

/**
 * Compute binomial coefficients C(n, k) for k = 0..n
 */
function computeBinomial(n: number): number[] {
  const coeffs = new Array(n + 1).fill(0);
  coeffs[0] = 1;

  for (let i = 1; i <= n; i++) {
    for (let j = i; j >= 1; j--) {
      coeffs[j] = coeffs[j] + coeffs[j - 1];
    }
  }

  return coeffs;
}

/**
 * Multiply two power series
 */
export function multiplyPowerSeries(
  a: PowerSeries,
  b: PowerSeries,
  maxExp: number
): PowerSeries {
  const coefficients = new Map<number, number>();

  for (const [expA, coeffA] of a.coefficients) {
    for (const [expB, coeffB] of b.coefficients) {
      const newExp = expA + expB;
      if (newExp <= maxExp) {
        if (!coefficients.has(newExp)) coefficients.set(newExp, 0);
        coefficients.set(newExp, coefficients.get(newExp)! + coeffA * coeffB);
      }
    }
  }

  return {
    coefficients,
    minExp: a.minExp + b.minExp,
    maxExp,
  };
}

/**
 * Raise power series to integer power
 */
export function powerSeriesToPower(
  series: PowerSeries,
  power: number,
  maxExp: number
): PowerSeries {
  if (power === 0) {
    return {
      coefficients: new Map([[0, 1]]),
      minExp: 0,
      maxExp: 0,
    };
  }

  if (power === 1) {
    return series;
  }

  // Use repeated squaring for efficiency
  let result = series;
  let remaining = power - 1;

  while (remaining > 0) {
    if (remaining % 2 === 1) {
      result = multiplyPowerSeries(result, series, maxExp);
    }
    if (remaining > 1) {
      series = multiplyPowerSeries(series, series, maxExp);
    }
    remaining = Math.floor(remaining / 2);
  }

  return result;
}

/**
 * Divide two power series (computing quotient up to maxExp)
 *
 * Computes a/b using long division algorithm for power series.
 */
export function dividePowerSeries(
  numerator: PowerSeries,
  denominator: PowerSeries,
  maxExp: number
): PowerSeries {
  const coefficients = new Map<number, number>();

  // Get minimum exponents
  const minExpNum = numerator.minExp;
  const minExpDen = denominator.minExp;
  const minExpResult = minExpNum - minExpDen;

  // Get denominator's leading coefficient
  const denomLeading = denominator.coefficients.get(minExpDen) || 0;
  if (denomLeading === 0) {
    throw new Error('Cannot divide by zero');
  }

  // Compute quotient coefficients using long division
  for (let exp = minExpResult; exp <= maxExp; exp++) {
    // Compute coefficient of q^exp in quotient
    let coeff = numerator.coefficients.get(exp + minExpDen) || 0;

    // Subtract contributions from previously computed quotient terms
    for (const [quotExp, quotCoeff] of coefficients) {
      const denomExp = exp - quotExp + minExpDen;
      const denomCoeff = denominator.coefficients.get(denomExp) || 0;
      coeff -= quotCoeff * denomCoeff;
    }

    // Divide by leading coefficient of denominator
    coeff /= denomLeading;

    if (Math.abs(coeff) > 1e-10) {
      // Only store non-zero coefficients
      coefficients.set(exp, Math.round(coeff)); // Round to nearest integer
    }
  }

  return {
    coefficients,
    minExp: minExpResult,
    maxExp,
  };
}

/**
 * Scale power series by constant
 */
export function scalePowerSeries(series: PowerSeries, scalar: number): PowerSeries {
  const coefficients = new Map<number, number>();

  for (const [exp, coeff] of series.coefficients) {
    coefficients.set(exp, scalar * coeff);
  }

  return {
    coefficients,
    minExp: series.minExp,
    maxExp: series.maxExp,
  };
}

/**
 * Compute j-invariant q-expansion
 *
 * j(q) = E₄³(q) / Δ(q)
 *
 * Returns coefficients for q^(-1), q^0, q^1, q^2, ...
 *
 * Note: The standard normalization E₄ = 1 + 240∑σ₃(n)q^n and Δ = η²⁴
 * gives j(q) = q⁻¹ + 744 + 196884q + ... directly without needing a 1728 factor.
 */
export function jInvariant(maxTerms: number): PowerSeries {
  console.log(`Computing j-invariant to ${maxTerms} terms...`);

  // Step 1: Compute E₄(q)
  console.log('  Computing E₄(q)...');
  const e4 = eisensteinE4(maxTerms);

  // Step 2: Compute E₄³(q)
  console.log('  Computing E₄³(q)...');
  const e4Cubed = powerSeriesToPower(e4, 3, maxTerms);

  // Step 3: Compute Δ(q) = η²⁴(q)
  console.log('  Computing Δ(q) = η²⁴(q)...');
  const delta = dedekindEta24(maxTerms);

  // Step 4: Compute j(q) = E₄³ / Δ
  console.log('  Computing j(q) = E₄³/Δ...');
  const j = dividePowerSeries(e4Cubed, delta, maxTerms);

  console.log('  Done!');

  return j;
}

/**
 * Extract j-invariant coefficients as array
 * Returns [c(-1), c(0), c(1), c(2), ...] where j(q) = ∑ c(n)q^n
 */
export function extractJCoefficients(j: PowerSeries, numCoeffs: number): number[] {
  const coeffs: number[] = [];

  for (let n = j.minExp; n < j.minExp + numCoeffs; n++) {
    coeffs.push(j.coefficients.get(n) || 0);
  }

  return coeffs;
}

/**
 * Known j-invariant coefficients from literature (OEIS A000521)
 */
export const KNOWN_J_COEFFICIENTS: { [n: number]: number } = {
  '-1': 1,
  '0': 744,
  '1': 196884,
  '2': 21493760,
  '3': 864299970,
  '4': 20245856256,
};

/**
 * Validate computed j-invariant against known values
 */
export function validateJInvariant(j: PowerSeries): {
  valid: boolean;
  errors: string[];
  coefficients: { n: number; computed: number; expected: number; match: boolean }[];
} {
  const errors: string[] = [];
  const coefficients: { n: number; computed: number; expected: number; match: boolean }[] = [];

  for (const [nStr, expected] of Object.entries(KNOWN_J_COEFFICIENTS)) {
    const n = parseInt(nStr);
    const computed = j.coefficients.get(n) || 0;
    const match = computed === expected;

    coefficients.push({ n, computed, expected, match });

    if (!match) {
      errors.push(`c(${n}): expected ${expected}, got ${computed}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    coefficients,
  };
}
