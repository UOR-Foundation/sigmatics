/**
 * Vector Encoding: array → ℤ₉₆[]
 *
 * Maps multi-dimensional vectors to arrays of ℤ₉₆ classes.
 * Foundation for neural network input layers.
 *
 * Theory:
 * - Chunks vector into groups (e.g., 8 pixels → 1 class)
 * - Each chunk aggregates to single ℤ₉₆ class
 * - Output classes compose via ⊗ (parallel monoidal product)
 * - Preserves locality: nearby elements → nearby classes
 *
 * Example: MNIST 28×28 image (784 pixels)
 * - chunk_size = 8 → 98 classes (784/8 = 98)
 * - Each class encodes 8 grayscale values
 * - 98 classes form parallel register network input
 */

import { encodeScalar, type ScalarEncodingConfig, type EncodedScalar } from './encode-scalar';

/**
 * Vector encoding configuration
 */
export interface VectorEncodingConfig {
  /** Input vector dimension */
  dimension: number;
  /** Elements per class */
  chunkSize?: number;
  /** Aggregation strategy */
  aggregation?: 'sum' | 'product' | 'max' | 'hash';
  /** Value range */
  min: number;
  max: number;
  /** Encoding mapping */
  mapping?: 'linear' | 'logarithmic';
  /** Structure hint */
  structureHint?: 'scope' | 'modality' | 'context' | 'none';
}

/**
 * Encoded vector result
 */
export interface EncodedVector {
  /** Array of ℤ₉₆ classes */
  classes: number[];
  /** Full encoding details for each class */
  encoded: EncodedScalar[];
  /** Original vector dimension */
  dimension: number;
  /** Number of chunks */
  numChunks: number;
}

/**
 * Encode vector to array of ℤ₉₆ classes
 */
export function encodeVector(
  vector: number[],
  config: VectorEncodingConfig
): EncodedVector {
  const {
    dimension,
    chunkSize = 8,
    aggregation = 'sum',
    min,
    max,
    mapping = 'linear',
    structureHint = 'context',
  } = config;

  // Validate dimension
  if (vector.length !== dimension) {
    throw new Error(`Vector length ${vector.length} doesn't match dimension ${dimension}`);
  }

  // Calculate number of chunks
  const numChunks = Math.ceil(dimension / chunkSize);

  // Split vector into chunks and aggregate each
  const aggregated: number[] = [];
  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, dimension);
    const chunk = vector.slice(start, end);

    // Aggregate chunk to single value
    const value = aggregateChunk(chunk, aggregation, min, max);
    aggregated.push(value);
  }

  // Encode each aggregated value to ℤ₉₆
  const scalarConfig: ScalarEncodingConfig = {
    min,
    max,
    mapping,
    clamp: true,
    preserveZero: false,
    structureHint: structureHint !== 'none' ? structureHint : undefined,
  };

  const encoded: EncodedScalar[] = aggregated.map(v => encodeScalar(v, scalarConfig));

  return {
    classes: encoded.map(e => e.classIndex),
    encoded,
    dimension,
    numChunks,
  };
}

/**
 * Aggregate chunk of values to single scalar
 */
function aggregateChunk(
  chunk: number[],
  strategy: 'sum' | 'product' | 'max' | 'hash',
  min: number,
  max: number
): number {
  if (chunk.length === 0) return 0;

  switch (strategy) {
    case 'sum':
      // Sum and normalize
      const sum = chunk.reduce((a, b) => a + b, 0);
      return sum / chunk.length;  // Average

    case 'product':
      // Product (normalized to prevent overflow)
      const product = chunk.reduce((a, b) => a * b, 1);
      const normalized = Math.pow(Math.abs(product), 1 / chunk.length);
      return Math.min(max, normalized);

    case 'max':
      // Maximum value
      return Math.max(...chunk);

    case 'hash':
      // Simple hash for discrete inputs
      let hash = 0;
      for (let i = 0; i < chunk.length; i++) {
        hash = ((hash << 5) - hash + chunk[i]) | 0;
      }
      // Normalize hash to [min, max]
      return min + (Math.abs(hash) % (max - min));

    default:
      return chunk[0];
  }
}

/**
 * Decode array of ℤ₉₆ classes back to vector
 * (Approximate inverse - lossy due to aggregation)
 */
export function decodeVector(
  classes: number[],
  config: VectorEncodingConfig
): number[] {
  const {
    dimension,
    chunkSize = 8,
    min,
    max,
    mapping = 'linear',
  } = config;

  const scalarConfig: ScalarEncodingConfig = {
    min,
    max,
    mapping,
  };

  // Decode each class to scalar
  const decoded: number[] = classes.map(c => {
    // Reverse encoding
    const t = c / 96;
    let value: number;

    if (mapping === 'logarithmic') {
      value = Math.pow(2, t) - 1;
    } else {
      value = t;
    }

    return min + value * (max - min);
  });

  // Expand each decoded value back to chunk
  const vector: number[] = [];
  for (let i = 0; i < classes.length; i++) {
    const value = decoded[i];
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, dimension);
    const chunkLength = end - start;

    // Replicate value across chunk (reconstruction is approximate)
    for (let j = 0; j < chunkLength; j++) {
      vector.push(value);
    }
  }

  // Trim to exact dimension
  return vector.slice(0, dimension);
}

/**
 * Encode 2D array (e.g., image) to ℤ₉₆[]
 */
export function encodeImage(
  image: number[][],  // height × width
  config: Omit<VectorEncodingConfig, 'dimension'>
): EncodedVector {
  // Flatten image to vector
  const vector = image.flat();

  return encodeVector(vector, {
    ...config,
    dimension: vector.length,
  });
}

/**
 * Decode ℤ₉₆[] back to 2D image
 */
export function decodeImage(
  classes: number[],
  height: number,
  width: number,
  config: Omit<VectorEncodingConfig, 'dimension'>
): number[][] {
  const vector = decodeVector(classes, {
    ...config,
    dimension: height * width,
  });

  // Reshape to 2D
  const image: number[][] = [];
  for (let i = 0; i < height; i++) {
    image.push(vector.slice(i * width, (i + 1) * width));
  }

  return image;
}

/**
 * Encode with categorical preservation of locality
 * Ensures nearby vector elements map to nearby classes
 */
export function encodeVectorCategorical(
  vector: number[],
  config: VectorEncodingConfig,
  orbitDistanceTable?: Uint8Array
): EncodedVector {
  const basic = encodeVector(vector, config);

  if (!orbitDistanceTable) {
    return basic;
  }

  // For each pair of adjacent classes, minimize orbit distance
  const optimized = [...basic.classes];
  for (let i = 1; i < optimized.length; i++) {
    const prev = optimized[i - 1];
    const current = optimized[i];

    // Find nearby class to current with minimal distance to prev
    let bestClass = current;
    let bestDistance = orbitDistanceTable[current] ?? 999;

    for (let offset = -5; offset <= 5; offset++) {
      const candidate = (current + offset + 96) % 96;
      const distance = Math.abs(candidate - prev);
      if (distance < bestDistance) {
        bestClass = candidate;
        bestDistance = distance;
      }
    }

    optimized[i] = bestClass;
  }

  return {
    ...basic,
    classes: optimized,
  };
}
