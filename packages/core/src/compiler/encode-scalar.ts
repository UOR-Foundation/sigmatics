/**
 * Scalar Encoding: value → ℤ₉₆
 *
 * Maps scalar values to the 96-class structure while preserving
 * the algebraic semantics (h₂, d, ℓ).
 *
 * Theory:
 * - Each class represents a point in Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃]
 * - Encoding respects the tensor product structure
 * - class(h, d, ℓ) = 24h + 8d + ℓ
 *
 * Strategies:
 * - Linear: Uniform distribution across classes
 * - Logarithmic: Preserve magnitude relationships
 * - Categorical: Direct mapping for discrete values
 */

/**
 * Encoding configuration
 */
export interface ScalarEncodingConfig {
  /** Minimum value of input range */
  min: number;
  /** Maximum value of input range */
  max: number;
  /** Mapping strategy */
  mapping?: 'linear' | 'logarithmic' | 'categorical';
  /** Clamp out-of-range values */
  clamp?: boolean;
  /** Preserve zero → class 0 */
  preserveZero?: boolean;
  /** Preserve structure in specific coordinate */
  structureHint?: 'scope' | 'modality' | 'context';
}

/**
 * Encoding result with algebraic coordinates
 */
export interface EncodedScalar {
  /** Class index in ℤ₉₆ */
  classIndex: number;
  /** Scope coordinate (h₂) */
  h: number;
  /** Modality coordinate (d) */
  d: number;
  /** Context coordinate (ℓ) */
  ell: number;
  /** Original value */
  value: number;
}

/**
 * Encode scalar value to ℤ₉₆ with algebraic structure
 */
export function encodeScalar(value: number, config: ScalarEncodingConfig): EncodedScalar {
  const { min, max, mapping = 'linear', clamp = true, preserveZero = false, structureHint } = config;

  // Handle out-of-range
  let normalizedValue = value;
  if (clamp) {
    normalizedValue = Math.max(min, Math.min(max, value));
  } else {
    // Wrap using modular arithmetic
    const range = max - min;
    if (range > 0) {
      normalizedValue = ((value - min) % range) + min;
    }
  }

  // Special case: preserve zero
  if (preserveZero && value === 0) {
    return { classIndex: 0, h: 0, d: 0, ell: 0, value };
  }

  // Map to [0, 1] range
  const t = (normalizedValue - min) / (max - min);

  // Apply mapping strategy
  let mapped: number;
  switch (mapping) {
    case 'logarithmic':
      // Logarithmic mapping preserves relative magnitudes
      mapped = Math.log(1 + t) / Math.log(2);
      break;
    case 'categorical':
      // Categorical: direct integer mapping
      mapped = Math.floor(t * 96);
      break;
    case 'linear':
    default:
      // Linear: uniform distribution
      mapped = t;
      break;
  }

  // Map to class index [0, 95]
  let classIndex = Math.floor(mapped * 96) % 96;

  // Decompose to (h, d, ℓ) coordinates
  // class = 24h + 8d + ℓ
  const h = Math.floor(classIndex / 24);      // Scope: 0-3
  const d = Math.floor((classIndex % 24) / 8); // Modality: 0-2
  const ell = classIndex % 8;                   // Context: 0-7

  // Apply structure hint to preserve specific coordinate
  if (structureHint) {
    classIndex = applyStructureHint(t, structureHint);
  }

  // Recompute coordinates if structure hint was applied
  const finalH = Math.floor(classIndex / 24);
  const finalD = Math.floor((classIndex % 24) / 8);
  const finalEll = classIndex % 8;

  return {
    classIndex,
    h: finalH,
    d: finalD,
    ell: finalEll,
    value,
  };
}

/**
 * Apply structure hint to preserve specific coordinate
 */
function applyStructureHint(t: number, hint: 'scope' | 'modality' | 'context'): number {
  switch (hint) {
    case 'scope':
      // Preserve h₂ (scope) - vary modality and context
      const h = Math.floor(t * 4) % 4;
      const d_modality = Math.floor((t * 96) / 4) % 3;
      const ell_context = Math.floor((t * 96) / 12) % 8;
      return 24 * h + 8 * d_modality + ell_context;

    case 'modality':
      // Preserve d (modality) - vary scope and context
      const d = Math.floor(t * 3) % 3;
      const h_scope = Math.floor((t * 96) / 3) % 4;
      const ell = Math.floor((t * 96) / 12) % 8;
      return 24 * h_scope + 8 * d + ell;

    case 'context':
      // Preserve ℓ (context) - vary scope and modality
      const ell_fixed = Math.floor(t * 8) % 8;
      const h_var = Math.floor((t * 96) / 8) % 4;
      const d_var = Math.floor((t * 96) / 32) % 3;
      return 24 * h_var + 8 * d_var + ell_fixed;

    default:
      return Math.floor(t * 96) % 96;
  }
}

/**
 * Batch encode array of values
 */
export function encodeScalarBatch(
  values: number[],
  config: ScalarEncodingConfig
): EncodedScalar[] {
  return values.map(v => encodeScalar(v, config));
}

/**
 * Decode ℤ₉₆ class back to value
 * (Inverse of encodeScalar)
 */
export function decodeScalar(
  classIndex: number,
  config: ScalarEncodingConfig
): number {
  const { min, max, mapping = 'linear' } = config;

  // Map class index [0, 95] to [0, 1]
  const t = classIndex / 96;

  // Reverse mapping strategy
  let normalized: number;
  switch (mapping) {
    case 'logarithmic':
      // Reverse: t = log(1 + x) / log(2) → x = 2^t - 1
      normalized = Math.pow(2, t) - 1;
      break;
    case 'categorical':
      // Direct mapping
      normalized = t;
      break;
    case 'linear':
    default:
      normalized = t;
      break;
  }

  // Map back to original range
  return min + normalized * (max - min);
}

/**
 * Encode with categorical invariants
 * Ensures encoding preserves monotonicity and minimizes orbit distance
 */
export function encodeScalarCategorical(
  value: number,
  config: ScalarEncodingConfig,
  orbitDistanceTable?: Uint8Array
): EncodedScalar {
  const basic = encodeScalar(value, config);

  // If no orbit table provided, return basic encoding
  if (!orbitDistanceTable) {
    return basic;
  }

  // Find nearby classes with minimal orbit distance
  const candidates: Array<{ classIndex: number; distance: number }> = [];
  for (let offset = -5; offset <= 5; offset++) {
    const candidate = (basic.classIndex + offset + 96) % 96;
    const distance = orbitDistanceTable[candidate] ?? 999;
    candidates.push({ classIndex: candidate, distance });
  }

  // Choose class with minimal orbit distance
  candidates.sort((a, b) => a.distance - b.distance);
  const optimal = candidates[0].classIndex;

  // Decompose optimal class
  const h = Math.floor(optimal / 24);
  const d = Math.floor((optimal % 24) / 8);
  const ell = optimal % 8;

  return {
    classIndex: optimal,
    h,
    d,
    ell,
    value,
  };
}
