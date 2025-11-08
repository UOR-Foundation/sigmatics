# Test Coverage Status

## Current Status (v0.4.0)

**Overall Coverage**: 82.33%

- Lines: 82.33%
- Functions: 75.10%
- Branches: 82.66%
- Statements: 82.33%

**Enforcement Thresholds** (configured in `.c8rc.json`):

- Lines: 80%
- Functions: 75%
- Branches: 80%
- Statements: 80%

## Coverage by Module

### High Coverage (≥90%)

- **Lexer**: 100% - Tokenization and scanning
- **Parser**: 93.86% - Sigil expression parsing
- **Evaluator**: 98% - Expression evaluation engine
- **Class System**: 98.48% - Fast-path class operations
- **Group Algebras**: 94.44% - ℤ₄ and ℤ₃ group operations
- **Octonion**: 96.49% - Octonion algebra operations

### Moderate Coverage (70-90%)

- **Server/Registry**: 82.85% - Model compilation and caching
- **Clifford**: 80.7% - Cl₀,₇ Clifford algebra
- **Transforms**: 89.53% - R, D, T, M automorphisms
- **Validation**: 88.05% - Schema and descriptor validation
- **Schema Loader**: 77.35% - Runtime JSON-Schema validation
- **IR**: 66.5% - Intermediate representation
- **Fano**: 74.32% - Octonion multiplication tables
- **Fuser**: 72.61% - AST fusion optimization
- **Model Registry**: 71.34% - Schema registry

### Low Coverage (<70%)

- **SGA Backend**: 15.32% ⚠️ - Algebraic fallback path
- **SGA Element**: 68.99% - Tensor product operations
- **Rewrites**: 52.98% - IR optimization passes
- **Class Backend**: 90.95% but low branch coverage (55.17%)

## Path to 90% Coverage

### Priority 1: Critical Gaps

1. **SGA Backend** (15.32% → 90%): Add integration tests for:
   - Complex sigil expressions requiring SGA semantics
   - Operations beyond class backend capabilities
   - Grade projection edge cases
   - Bridge operations (lift/project) with non-trivial inputs

2. **IR Rewrites** (52.98% → 90%): Test optimization passes:
   - Pure power folding (R⁴=I, D³=I, T⁸=I, M²=I)
   - Transform commutation (RD=DR, RT=TR, DT=TD)
   - Mirror conjugation (MDM=D⁻¹, MRM=R⁻¹, MTM=T⁻¹)
   - Constant folding and fusion
   - Dead code elimination

### Priority 2: Moderate Improvements

3. **SGA Element** (68.99% → 85%): Cover edge cases:
   - Grade projection boundary conditions
   - Tensor product associativity
   - Zero handling and normalization

4. **IR Generation** (66.5% → 85%): Test complex expression compilation:
   - Deeply nested compositions
   - Mixed parallel/sequential operations
   - Transform chains with literals

5. **Schema Registry** (62.5% → 80%): Mock file I/O for:
   - Schema loading error paths
   - Cache invalidation
   - Missing schema handling

### Priority 3: Branch Coverage

6. **Class Backend**: Improve branch coverage from 55.17% → 80%
7. **Schema Loader**: Improve branch coverage from 42.1% → 70%

## Tools & Commands

```bash
# Run tests with coverage report
npm run coverage

# Run tests with coverage enforcement
npm run test:coverage

# Generate HTML coverage report
npm run coverage
# Open coverage/index.html in browser
```

## Exclusions

The following are excluded from coverage measurement:

- `**/index.ts` - Re-export files
- `**/types.ts` - Type definition files
- `test/**` - Test files
- `benchmark/**` - Benchmark files
- `dist/**` - Compiled output

## Notes

- Current thresholds (80%/75%) represent the v0.4.0 baseline
- Target thresholds for production release: 90% across all metrics
- Coverage tooling: c8 (modern coverage for Node.js/TypeScript)
- CI/CD integration: `npm run test:coverage` in build pipeline
