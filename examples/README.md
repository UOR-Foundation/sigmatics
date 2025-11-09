# Sigmatics Examples

Comprehensive examples demonstrating the power and performance of the Sigmatics v0.4.0 declarative model system.

## Overview

The v0.4.0 refactor introduced a **declarative model system with fused circuits**, enabling:

- ⚡ **Pre-compiled operations** (no interpretation overhead)
- 🔄 **Dual backend architecture** (class permutations + full SGA algebra)
- 🧩 **Composable primitives** (build complex operations from stdlib)
- 🎯 **Automatic backend dispatch** (optimal performance for each use case)

These examples showcase Sigmatics in action, from basic usage to advanced cryptographic patterns.

## Quick Start

```bash
# From the examples directory
npm install
npm start  # Runs basic-usage.ts
```

## Examples

### 1. Basic Usage (`basic-usage.ts`)

**Purpose:** Introduction to Sigmatics fundamentals

**Covers:**
- Basic operations (mark, copy, swap, etc.)
- Transform operations (R, D, T, M)
- Class system exploration
- Belt addressing
- Operational backend (word lowering)
- Complex expressions
- Equivalence testing

**Run:**
```bash
npx ts-node basic-usage.ts
```

**Best for:** New users learning Sigmatics fundamentals

---

### 2. Fused Circuit Performance (`fused-circuit-performance.ts`) 🆕

**Purpose:** Demonstrates the performance benefits of compiled models

**Covers:**
- Ring operations benchmarks (add96, mul96)
- Transform operations benchmarks (R, D, T, M)
- Class vs SGA backend comparison
- Batch operation throughput
- Chained operation performance
- Real-world cryptographic patterns

**Run:**
```bash
npx ts-node fused-circuit-performance.ts
```

**Key Insights:**
- Compiled models eliminate interpretation overhead
- Class backend is ~10-100x faster for rank-1 operations
- High throughput enables cryptographic applications

**Best for:** Understanding performance characteristics and optimization

---

### 3. Algebraic Law Verification (`algebraic-law-verification.ts`) 🆕

**Purpose:** Verifies algebraic laws using fused circuits

**Covers:**
- Transform orders (R⁴ = D³ = T⁸ = M² = identity)
- Commutation properties (RD = DR, etc.)
- Mirror conjugation (MDM = D⁻¹)
- Ring operation properties (commutativity, associativity)
- Transform composition (group structure)
- Bridge round-trip (lift/project)

**Run:**
```bash
npx ts-node algebraic-law-verification.ts
```

**Key Insights:**
- Compiled models make property verification efficient
- All 96 classes verified in milliseconds
- Enables property-based testing and formal verification

**Best for:** Understanding the algebraic structure and verification patterns

---

### 4. Dual Backend Dispatch (`dual-backend-dispatch.ts`) 🆕

**Purpose:** Demonstrates automatic backend selection

**Covers:**
- Class backend (fast permutations for numbers)
- SGA backend (full algebra for SgaElements)
- Automatic dispatch based on input types
- Operations requiring SGA backend
- Performance comparison
- Use case recommendations
- Mixed-backend workflows

**Run:**
```bash
npx ts-node dual-backend-dispatch.ts
```

**Key Insights:**
- Same model works with both number and SgaElement inputs
- Backend selection is transparent to the user
- Optimal performance for each use case
- Results are consistent across backends

**Best for:** Understanding when to use each backend and how dispatch works

---

### 5. Custom Composition (`custom-composition.ts`) 🆕

**Purpose:** Building complex operations from stdlib primitives

**Covers:**
- Custom transform composition
- Cryptographic round functions
- Batch operations
- State machines with transform transitions
- Feistel network construction
- Transform orbit analysis
- Composition performance

**Run:**
```bash
npx ts-node custom-composition.ts
```

**Key Insights:**
- Stdlib models are composable building blocks
- Custom operations maintain high performance
- Enables domain-specific abstractions
- Foundation for cryptographic protocol design

**Best for:** Learning to build custom operations and cryptographic patterns

---

### 6. Cryptographic Hash Function (`cryptographic-hash.ts`) 🆕

**Purpose:** Practical cryptographic application using Sigmatics

**Covers:**
- Complete hash function implementation
- Compression function design
- Message padding and finalization
- Avalanche effect demonstration
- Collision resistance testing
- Performance benchmarking
- Output distribution analysis

**Run:**
```bash
npx ts-node cryptographic-hash.ts
```

**Key Insights:**
- Sigmatics transforms provide excellent diffusion
- Good avalanche effect (small input changes → large output changes)
- High throughput (thousands of hashes per second)
- Composable primitives enable rapid cryptographic prototyping

**Note:** This is a demonstration, NOT a cryptographically secure hash!

**Best for:** Understanding how to build complete cryptographic systems with Sigmatics

---

### 7. Extreme Scale Subset Sum (`extreme-scale-subset-sum.ts`) 🆕

**Purpose:** Demonstrates geometric pruning at scale with Sigmatics circuits

**Covers:**
- Multi-level pruning cascade (bounds + modular feasibility)
- Materializing solutions as Sigmatics circuits (mark@c.. || ...)
- Quick vs Full benchmark modes
- Performance metrics and speedup vs 2^n space

**Run (Quick mode):**
```bash
npx ts-node extreme-scale-subset-sum.ts
```

**Run (Full mode):**
```bash
RUN_MODE=FULL npx ts-node extreme-scale-subset-sum.ts
```

**Key Insights:**
- Layered constraints dramatically cut the explored space
- Modular filters are high-yield and fast
- Found subsets can be rendered as actual Sigmatics circuits

**Best for:** Seeing Sigmatics principles applied to large combinatorial search

---

### 8. Documentation Validation (`validate-docs.ts`)

**Purpose:** Validates that documentation examples are correct

**Covers:**
- Testing code snippets from README
- Verifying QUICKSTART examples
- Ensuring documentation stays up-to-date

**Run:**
```bash
npx ts-node validate-docs.ts
```

**Best for:** Maintainers ensuring documentation accuracy

---

## Architecture Overview

### Declarative Model System (v0.4.0)

```
┌─────────────────────────────────────────────────┐
│            User Code / Examples                  │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────▼──────────┐
        │   Atlas.Model.*    │  ← Pre-compiled models
        │  (stdlib fused     │
        │   circuits)        │
        └─────────┬──────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────────┐         ┌────────▼─────┐
│   Class    │         │      SGA     │
│  Backend   │         │   Backend    │
│            │         │              │
│ • Fast     │         │ • Full       │
│   tables   │         │   algebra    │
│ • Rank-1   │         │ • Multi-     │
│   only     │         │   grade      │
└────────────┘         └──────────────┘
     ▲                        ▲
     │                        │
     └────── Automatic ───────┘
             Dispatch
```

### Key Concepts

**Fused Circuits:**
- Operations are pre-compiled into efficient execution plans
- No interpretation overhead at runtime
- Optimal for hot-path operations

**Dual Backends:**
- **Class Backend:** Fast permutation tables for rank-1 operations (input: `number`)
- **SGA Backend:** Full Clifford algebra semantics (input: `SgaElement`)
- Automatic selection based on input types

**Stdlib Models:**
- Pre-defined operations: `add96`, `sub96`, `mul96`, `R`, `D`, `T`, `M`, `lift`, `projectClass`, `projectGrade`
- Available via `Atlas.Model.*`
- Can be composed into custom operations

## Usage Patterns

### Pattern 1: Fast Class Operations

```typescript
// Use numbers for maximum performance
const r2Model = Atlas.Model.R(2);
const result = r2Model.run({ x: 21 }); // Fast class backend
```

### Pattern 2: Full Algebraic Operations

```typescript
// Use SgaElements for full algebra
const element = Atlas.SGA.lift(21);
const r2Model = Atlas.Model.R(2);
const result = r2Model.run({ x: element }); // SGA backend
const projected = Atlas.SGA.project(result);
```

### Pattern 3: Custom Composition

```typescript
// Compose stdlib models into custom operations
function customTransform(c: number): number {
  const step1 = Atlas.Model.R(2).run({ x: c }) as number;
  const step2 = Atlas.Model.D(1).run({ x: step1 }) as number;
  const step3 = Atlas.Model.T(3).run({ x: step2 }) as number;
  return step3;
}
```

### Pattern 4: Cryptographic Round Function

```typescript
function roundFunction(state: number, key: number): number {
  const addModel = Atlas.Model.add96('drop');
  const mixed = addModel.run({ a: state, b: key }).value;
  const r2Model = Atlas.Model.R(2);
  const diffused = r2Model.run({ x: mixed }) as number;
  return diffused;
}
```

## Performance Characteristics

| Operation | Backend | Throughput | Use Case |
|-----------|---------|------------|----------|
| R² transform | Class | ~1M ops/sec | Cryptographic mixing |
| R² transform | SGA | ~100K ops/sec | Formal verification |
| add96 | Class | ~2M ops/sec | Fast arithmetic |
| Grade projection | SGA only | ~100K ops/sec | Multi-grade filtering |

*Benchmarks approximate, actual performance depends on hardware*

## Use Cases

### Cryptography
- **Fast mixing functions** using class backend
- **Feistel networks** with transform-based round functions
- **Block ciphers** with custom S-boxes from Sigmatics transforms
- **Hash functions** using orbit structures

### Formal Verification
- **Property testing** of algebraic laws
- **Commutative diagram** validation
- **Invariant checking** at runtime
- **Theorem proving** via SGA backend

### Symbolic Computation
- **Expression simplification** using transform composition
- **Orbit analysis** and cycle detection
- **Equivalence class** exploration
- **Permutation group** operations

### Geometric Algebra
- **Clifford algebra** operations via SGA backend
- **Grade projection** and filtering
- **Octonion multiplication** through Fano plane
- **Triality** and SO(8) transformations

## Development

### Adding New Examples

1. Create `my-example.ts` in the `examples/` directory
2. Import Sigmatics: `import Atlas from '@uor-foundation/sigmatics'`
3. Add documentation header explaining the example
4. Update this README with a new section

### Testing Examples

```bash
# Run all examples
for file in *.ts; do
  echo "Running $file..."
  npx ts-node "$file"
done
```

### Contributing

Examples should:
- ✅ Include clear documentation headers
- ✅ Use descriptive variable names
- ✅ Show both performance and correctness
- ✅ Demonstrate best practices
- ✅ Include timing benchmarks where relevant
- ✅ Explain when to use class vs SGA backend

## Further Reading

- **[QUICKSTART.md](../QUICKSTART.md)** - Getting started guide
- **[README.md](../README.md)** - Project overview
- **[ARCHITECTURE.md](../docs/ARCHITECTURE.md)** - System architecture
- **[MODEL_SPEC_v0.4.0.md](../docs/MODEL_SPEC_v0.4.0.md)** - Declarative model specification
- **[BACKEND_SEMANTICS.md](../docs/BACKEND_SEMANTICS.md)** - Backend implementation details

## FAQ

**Q: When should I use the class backend vs SGA backend?**

A: Use class backend (pass `number`) for maximum performance on rank-1 operations. Use SGA backend (pass `SgaElement`) when you need full algebraic semantics, multi-grade elements, or grade projections.

**Q: Can I mix class and SGA inputs in the same workflow?**

A: Yes! The system handles automatic dispatch and conversion. Results are consistent across backends.

**Q: How fast are the compiled models?**

A: Class backend operations can exceed 1M ops/sec. SGA backend is ~10-100x slower but still very fast for algebraic operations (~100K ops/sec).

**Q: Can I create my own fused circuits?**

A: Currently, you compose stdlib models into custom functions (see `custom-composition.ts`). Future versions may support user-defined model descriptors.

**Q: Do these examples work with earlier versions?**

A: These examples specifically demonstrate v0.4.0 features. For v0.3.x compatibility, see the legacy `basic-usage.ts` which uses both old and new APIs.

---

## License

MIT License - See [LICENSE](../LICENSE) for details

## Support

- **Issues:** [GitHub Issues](https://github.com/UOR-Foundation/sigmatics/issues)
- **Discussions:** [GitHub Discussions](https://github.com/UOR-Foundation/sigmatics/discussions)
- **Docs:** [Documentation](../docs/)

---

**Built with Sigmatics v0.4.0** - The declarative, high-performance symbolic algebra system 🚀
