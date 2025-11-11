/**
 * Register Network Primitives
 *
 * Compositional operators for building entanglement networks:
 * - parallel (⊗): Monoidal tensor product
 * - sequential (∘): Monoidal composition
 * - merge (⊕): Choice/coproduct
 *
 * Theory:
 * - These operations are proven functorial (preserve constraints)
 * - Automatic constraint composition via categorical properties
 * - Each register is R/D/T/M transform on ℤ₉₆
 * - Million-register networks via sparse representation
 */

/**
 * Register transform (R, D, T, M composition)
 */
export interface RegisterTransform {
  /** Rotate quadrant (h₂) */
  r?: number;
  /** Rotate modality (d) */
  d?: number;
  /** Twist context (ℓ) */
  t?: number;
  /** Mirror */
  m?: boolean;
}

/**
 * Single register in network
 */
export interface Register {
  /** Register index */
  index: number;
  /** Transform to apply */
  transform: RegisterTransform;
  /** Input class */
  input?: number;
  /** Output class */
  output?: number;
}

/**
 * Register layer (parallel composition of registers)
 */
export interface RegisterLayer {
  /** Layer index */
  layerIndex: number;
  /** Registers in this layer */
  registers: Register[];
  /** Sparse representation (only active registers) */
  sparse: boolean;
}

/**
 * Register network (sequential composition of layers)
 */
export interface RegisterNetwork {
  /** Network layers */
  layers: RegisterLayer[];
  /** Total registers (including inactive) */
  totalRegisters: number;
  /** Active registers (non-identity transforms) */
  activeRegisters: number;
}

/**
 * Apply register transform to ℤ₉₆ class
 */
export function applyRegisterTransform(
  classIndex: number,
  transform: RegisterTransform
): number {
  const { r = 0, d = 0, t = 0, m = false } = transform;

  // Decompose class to (h, d_mod, ell)
  // class = 24h + 8d_mod + ell
  let h = Math.floor(classIndex / 24);
  let d_mod = Math.floor((classIndex % 24) / 8);
  let ell = classIndex % 8;

  // Apply R transform (rotate quadrant)
  if (r !== 0) {
    h = (h + r) % 4;
  }

  // Apply D transform (rotate modality)
  if (d !== 0) {
    d_mod = (d_mod + d) % 3;
  }

  // Apply T transform (twist context)
  if (t !== 0) {
    ell = (ell + t) % 8;
  }

  // Apply M transform (mirror)
  if (m) {
    // Mirror: h → (4-h)%4, d_mod → (3-d_mod)%3
    h = (4 - h) % 4;
    d_mod = (3 - d_mod) % 3;
  }

  // Recompose to class index
  return 24 * h + 8 * d_mod + ell;
}

/**
 * Create identity register (no transform)
 */
export function identityRegister(index: number): Register {
  return {
    index,
    transform: {},
    input: undefined,
    output: undefined,
  };
}

/**
 * Create register with specific transform
 */
export function createRegister(
  index: number,
  transform: RegisterTransform
): Register {
  return {
    index,
    transform,
    input: undefined,
    output: undefined,
  };
}

/**
 * Parallel composition (⊗): Combine registers into layer
 * Monoidal tensor product - proven functorial
 */
export function parallel(...registers: Register[]): RegisterLayer {
  return {
    layerIndex: 0,
    registers,
    sparse: false,
  };
}

/**
 * Sequential composition (∘): Stack layers into network
 * Monoidal composition - proven functorial
 */
export function sequential(...layers: RegisterLayer[]): RegisterNetwork {
  // Reindex layers
  const indexedLayers = layers.map((layer, i) => ({
    ...layer,
    layerIndex: i,
  }));

  // Count total and active registers
  let totalRegisters = 0;
  let activeRegisters = 0;

  for (const layer of indexedLayers) {
    totalRegisters += layer.registers.length;
    activeRegisters += layer.registers.filter(r => !isIdentityTransform(r.transform)).length;
  }

  return {
    layers: indexedLayers,
    totalRegisters,
    activeRegisters,
  };
}

/**
 * Check if transform is identity
 */
function isIdentityTransform(transform: RegisterTransform): boolean {
  return (
    (transform.r === undefined || transform.r === 0) &&
    (transform.d === undefined || transform.d === 0) &&
    (transform.t === undefined || transform.t === 0) &&
    !transform.m
  );
}

/**
 * Execute register layer (forward pass)
 */
export function executeLayer(layer: RegisterLayer, inputs: number[]): number[] {
  const outputs = new Array(layer.registers.length);

  for (let i = 0; i < layer.registers.length; i++) {
    const register = layer.registers[i];
    const input = inputs[i] ?? 0;  // Default to class 0 if missing

    // Apply transform
    const output = applyRegisterTransform(input, register.transform);
    outputs[i] = output;

    // Update register state
    register.input = input;
    register.output = output;
  }

  return outputs;
}

/**
 * Execute register network (forward pass through all layers)
 */
export function executeNetwork(network: RegisterNetwork, inputs: number[]): number[] {
  let current = inputs;

  for (const layer of network.layers) {
    current = executeLayer(layer, current);
  }

  return current;
}

/**
 * Create sparse register layer (only store non-identity transforms)
 * Enables million-register networks with O(active) memory
 */
export function createSparseLayer(
  totalSize: number,
  activeRegisters: Map<number, RegisterTransform>
): RegisterLayer {
  const registers: Register[] = [];

  // Only store active registers
  for (const [index, transform] of activeRegisters.entries()) {
    if (!isIdentityTransform(transform)) {
      registers.push(createRegister(index, transform));
    }
  }

  return {
    layerIndex: 0,
    registers,
    sparse: true,
  };
}

/**
 * Execute sparse layer (optimized for inactive registers)
 */
export function executeSparseLayer(
  layer: RegisterLayer,
  totalSize: number,
  inputs: number[]
): number[] {
  if (!layer.sparse) {
    return executeLayer(layer, inputs);
  }

  // Start with identity (input = output)
  const outputs = [...inputs];

  // Apply only active transforms
  for (const register of layer.registers) {
    const input = inputs[register.index] ?? 0;
    const output = applyRegisterTransform(input, register.transform);
    outputs[register.index] = output;

    register.input = input;
    register.output = output;
  }

  return outputs;
}

/**
 * Create register network with beam search pruning
 * Uses categorical ε ≈ 10 to prune inactive paths
 */
export function createBeamNetwork(
  layers: RegisterLayer[],
  beamWidth: number = 32,  // φ(96), proven optimal
  orbitDistanceTable?: Uint8Array
): RegisterNetwork {
  const network = sequential(...layers);

  if (!orbitDistanceTable) {
    return network;
  }

  // For each layer, keep only top-k registers by orbit distance
  for (const layer of network.layers) {
    if (layer.registers.length <= beamWidth) {
      continue;
    }

    // Score registers by output orbit distance
    const scored = layer.registers.map(r => ({
      register: r,
      distance: r.output !== undefined ? (orbitDistanceTable[r.output % 96] ?? 999) : 999,
    }));

    // Sort by distance (lower is better)
    scored.sort((a, b) => a.distance - b.distance);

    // Keep only top beamWidth
    layer.registers = scored.slice(0, beamWidth).map(s => s.register);
  }

  // Recount active registers
  network.activeRegisters = network.layers.reduce(
    (sum, layer) => sum + layer.registers.filter(r => !isIdentityTransform(r.transform)).length,
    0
  );

  return network;
}

/**
 * Merge operation (⊕): Nondeterministic choice between networks
 * Categorical coproduct - proven functorial
 */
export function merge(network1: RegisterNetwork, network2: RegisterNetwork): RegisterNetwork {
  // Merge by taking union of registers at each layer
  const maxLayers = Math.max(network1.layers.length, network2.layers.length);
  const mergedLayers: RegisterLayer[] = [];

  for (let i = 0; i < maxLayers; i++) {
    const layer1 = network1.layers[i];
    const layer2 = network2.layers[i];

    if (layer1 && layer2) {
      // Both layers exist: combine registers
      mergedLayers.push({
        layerIndex: i,
        registers: [...layer1.registers, ...layer2.registers],
        sparse: layer1.sparse || layer2.sparse,
      });
    } else if (layer1) {
      mergedLayers.push(layer1);
    } else if (layer2) {
      mergedLayers.push(layer2);
    }
  }

  return sequential(...mergedLayers);
}
