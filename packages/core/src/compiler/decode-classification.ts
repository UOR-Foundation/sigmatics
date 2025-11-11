/**
 * Classification Decoding: ℤ₉₆[] → probabilities
 *
 * Maps array of ℤ₉₆ classes to probability distribution.
 * Foundation for neural network output layers.
 *
 * Theory:
 * - Uses orbit distance for confidence weighting
 * - Softmax normalization with categorical temperature
 * - ε-bounded probabilities (lower orbit distance → higher confidence)
 * - Argmax for deterministic classification
 */

/**
 * Classification decoding configuration
 */
export interface ClassificationDecodingConfig {
  /** Number of output classes */
  numClasses: number;
  /** Decoding strategy */
  strategy?: 'argmax' | 'softmax' | 'orbit_distance';
  /** Softmax temperature */
  temperature?: number;
  /** Use orbit distance for weighting */
  useOrbitDistance?: boolean;
}

/**
 * Classification result
 */
export interface ClassificationResult {
  /** Predicted class index */
  predictedClass: number;
  /** Probability distribution */
  probabilities: number[];
  /** Confidence score [0, 1] */
  confidence: number;
  /** Orbit distances (if available) */
  orbitDistances?: number[];
}

/**
 * Decode ℤ₉₆ logits to probability distribution
 */
export function decodeClassification(
  logits: number[],  // Array of ℤ₉₆ class indices
  config: ClassificationDecodingConfig,
  orbitDistanceTable?: Uint8Array
): ClassificationResult {
  const {
    numClasses,
    strategy = 'softmax',
    temperature = 1.0,
    useOrbitDistance = false,
  } = config;

  // Convert logits to scores
  const scores = logitsToScores(logits, numClasses, orbitDistanceTable, useOrbitDistance);

  // Apply decoding strategy
  let probabilities: number[];
  let predictedClass: number;

  switch (strategy) {
    case 'argmax':
      probabilities = argmaxDecode(scores);
      predictedClass = probabilities.indexOf(1.0);
      break;

    case 'orbit_distance':
      probabilities = orbitDistanceDecode(scores, orbitDistanceTable);
      predictedClass = probabilities.indexOf(Math.max(...probabilities));
      break;

    case 'softmax':
    default:
      probabilities = softmaxDecode(scores, temperature);
      predictedClass = probabilities.indexOf(Math.max(...probabilities));
      break;
  }

  // Calculate confidence
  const confidence = probabilities[predictedClass];

  // Extract orbit distances if available
  const orbitDistances = useOrbitDistance && orbitDistanceTable
    ? logits.slice(0, numClasses).map(c => orbitDistanceTable[c % 96] ?? 999)
    : undefined;

  return {
    predictedClass,
    probabilities,
    confidence,
    orbitDistances,
  };
}

/**
 * Convert ℤ₉₆ logits to scores for each class
 */
function logitsToScores(
  logits: number[],
  numClasses: number,
  orbitDistanceTable?: Uint8Array,
  useOrbitDistance: boolean = false
): number[] {
  const scores = new Array(numClasses).fill(0);

  // Distribute logits across output classes
  // Strategy: Each logit contributes to class (logit % numClasses)
  for (let i = 0; i < logits.length; i++) {
    const classIdx = logits[i] % numClasses;
    scores[classIdx] += logits[i] / 96;  // Normalize to [0, 1]

    // Weight by orbit distance if available
    if (useOrbitDistance && orbitDistanceTable) {
      const orbitDist = orbitDistanceTable[logits[i] % 96] ?? 999;
      // Lower orbit distance → higher contribution
      const weight = Math.exp(-orbitDist / 10);  // ε ≈ 10
      scores[classIdx] *= weight;
    }
  }

  return scores;
}

/**
 * Argmax decoding: one-hot encoding of highest score
 */
function argmaxDecode(scores: number[]): number[] {
  const maxIdx = scores.indexOf(Math.max(...scores));
  return scores.map((_, i) => (i === maxIdx ? 1.0 : 0.0));
}

/**
 * Softmax decoding: exponential normalization
 */
function softmaxDecode(scores: number[], temperature: number): number[] {
  // Apply temperature
  const scaled = scores.map(s => s / temperature);

  // Softmax: exp(x) / sum(exp(x))
  const expScores = scaled.map(s => Math.exp(s));
  const sumExp = expScores.reduce((a, b) => a + b, 0);

  return expScores.map(e => e / sumExp);
}

/**
 * Orbit distance decoding: use categorical structure
 */
function orbitDistanceDecode(
  scores: number[],
  orbitDistanceTable?: Uint8Array
): number[] {
  if (!orbitDistanceTable) {
    return softmaxDecode(scores, 1.0);
  }

  // Weight by inverse orbit distance
  const weighted = scores.map((score, i) => {
    const orbitDist = orbitDistanceTable[i] ?? 999;
    // Lower distance → higher probability
    return score * Math.exp(-orbitDist / 10);
  });

  // Normalize to probabilities
  const sum = weighted.reduce((a, b) => a + b, 0);
  return weighted.map(w => w / sum);
}

/**
 * Batch decode multiple predictions
 */
export function decodeClassificationBatch(
  batchLogits: number[][],
  config: ClassificationDecodingConfig,
  orbitDistanceTable?: Uint8Array
): ClassificationResult[] {
  return batchLogits.map(logits =>
    decodeClassification(logits, config, orbitDistanceTable)
  );
}

/**
 * Compute cross-entropy loss between predictions and targets
 * (For training with categorical constraints)
 */
export function categoricalCrossEntropy(
  predictions: ClassificationResult[],
  targets: number[]
): number {
  let loss = 0;
  for (let i = 0; i < predictions.length; i++) {
    const targetClass = targets[i];
    const prob = predictions[i].probabilities[targetClass];
    // Cross-entropy: -log(p(correct_class))
    loss -= Math.log(Math.max(prob, 1e-10));  // Avoid log(0)
  }
  return loss / predictions.length;
}

/**
 * Decode with categorical constraint propagation
 * Uses orbit closure to refine probabilities
 */
export function decodeClassificationCategorical(
  logits: number[],
  config: ClassificationDecodingConfig,
  orbitDistanceTable?: Uint8Array,
  epsilon: number = 10
): ClassificationResult {
  const basic = decodeClassification(logits, config, orbitDistanceTable);

  if (!orbitDistanceTable) {
    return basic;
  }

  // Refine probabilities using ε-bounded orbit closure
  const refined = [...basic.probabilities];
  for (let i = 0; i < refined.length; i++) {
    const orbitDist = orbitDistanceTable[logits[i % logits.length] % 96] ?? 999;

    // If orbit distance > ε, reduce confidence
    if (orbitDist > epsilon) {
      const penalty = Math.exp(-(orbitDist - epsilon) / epsilon);
      refined[i] *= penalty;
    }
  }

  // Re-normalize
  const sum = refined.reduce((a, b) => a + b, 0);
  const probabilities = refined.map(p => p / sum);

  return {
    ...basic,
    probabilities,
    predictedClass: probabilities.indexOf(Math.max(...probabilities)),
    confidence: Math.max(...probabilities),
  };
}
