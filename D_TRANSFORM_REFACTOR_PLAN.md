# D-Transform Refactor Plan for Sigmatics

**Generated:** November 5, 2025
**Target Package:** `@uor-foundation/sigmatics` (packages/core)
**Branch:** `claude/d-transform-refactor-plan-011CUqNW2c81YPQ7HfpiVNq2`
**Status:** Ready for Implementation

---

## Executive Summary

This refactor plan implements the D-transform (triality rotation) to complete the transform algebra of the Sigmatics package. The D-transform rotates the modality parameter `d` with period 3, expanding the transform group from 64 elements (ℤ/4ℤ × ℤ/8ℤ × ℤ/2ℤ) to 96 elements (ℤ/4ℤ × ℤ/3ℤ × ℤ/8ℤ).

### Transform Algebra
```
Current:  G = ℤ/4ℤ × ℤ/8ℤ × ℤ/2ℤ = 64 elements (R, T, ~)
Complete: G = ℤ/4ℤ × ℤ/3ℤ × ℤ/8ℤ = 96 elements (R, D, T, ~)
```

### D-Transform Definition
```
D+k: (h₂, d, ℓ) ↦ (h₂, (d+k) mod 3, ℓ)
```

**Properties:**
- Period 3: D+3 = identity
- Preserves h₂ and ℓ
- Commutes with R and T (abelian group)
- Maps triality orbits: {(h₂, d=0, ℓ), (h₂, d=1, ℓ), (h₂, d=2, ℓ)}

---

## Current Codebase Architecture

### Package Structure
```
packages/core/
├── src/
│   ├── index.ts                    # Main export (24 lines)
│   ├── types/types.ts              # Type definitions (141 lines)
│   ├── lexer/lexer.ts              # Tokenizer (240 lines)
│   ├── parser/parser.ts            # AST parser (287 lines)
│   ├── class-system/class.ts       # 96-class system (282 lines)
│   ├── evaluator/evaluator.ts      # Dual backends (339 lines)
│   └── api/index.ts                # High-level API (221 lines)
├── test/index.ts                    # Test suite (861 lines)
└── package.json
```

### Current Transform System

**Grammar:**
```
<transform> ::= [ R±q ] [ T±m ] [ ~ ]
```

**Type System (types.ts:49-53):**
```typescript
export interface Transform {
  R?: number;  // rotate quadrants (mod 4)
  T?: number;  // twist context ring (mod 8)
  M?: boolean; // mirror modality
}
```

**Lexer Tokens (lexer.ts:6-22):**
```typescript
type TokenType =
  | 'ROTATE'   // R
  | 'TWIST'    // T
  | 'TILDE'    // ~
  // ... other tokens
```

**Class System Functions (class.ts:133-188):**
```typescript
export function applyRotation(comp: SigilComponents, k: number): SigilComponents
export function applyTwist(comp: SigilComponents, k: number): SigilComponents
export function applyMirror(comp: SigilComponents): SigilComponents
export function applyTransforms(comp: SigilComponents, transforms: {...}): SigilComponents
```

---

## Implementation Plan

### Phase 1: Type System Foundation
**Files:** `packages/core/src/types/types.ts`
**Estimated Lines Changed:** ~15 lines
**Estimated Time:** 30 minutes

#### Task 1.1: Update Transform Interface
**Location:** types.ts:49-53

**Current:**
```typescript
export interface Transform {
  R?: number;  // rotate quadrants
  T?: number;  // twist context ring
  M?: boolean; // mirror modality
}
```

**Updated:**
```typescript
export interface Transform {
  R?: number;  // rotate quadrants (mod 4)
  D?: number;  // triality rotation (mod 3) ← NEW
  T?: number;  // twist context ring (mod 8)
  M?: boolean; // mirror modality
}
```

#### Task 1.2: Add D-Transform Result Types
**Location:** types.ts (end of file, after BeltAddress)

**New Type Definitions:**
```typescript
/**
 * Triality orbit containing 3 classes with same (h₂, ℓ) but different d
 */
export interface TrialityOrbit {
  baseCoordinates: { h2: ScopeQuadrant; l: ContextSlot };
  classes: [number, number, number];  // [d=0, d=1, d=2]
}

/**
 * Result of applying D-transform
 */
export interface DTransformResult {
  oldClass: number;
  newClass: number;
  transformation: {
    h2: ScopeQuadrant;
    d_old: Modality;
    d_new: Modality;
    l: ContextSlot;
  };
}
```

**Acceptance Criteria:**
- [ ] Transform interface includes D? field
- [ ] TrialityOrbit type defined
- [ ] DTransformResult type defined
- [ ] TypeScript compilation succeeds
- [ ] No breaking changes to existing code

---

### Phase 2: Lexer Updates
**Files:** `packages/core/src/lexer/lexer.ts`
**Estimated Lines Changed:** ~10 lines
**Estimated Time:** 20 minutes

#### Task 2.1: Add TRIALITY Token Type
**Location:** lexer.ts:6-22

**Current:**
```typescript
export type TokenType =
  | 'CLASS'
  | 'GENERATOR'
  // ...
  | 'ROTATE'    // R
  | 'TWIST'     // T
  | 'TILDE'     // ~
  // ...
```

**Updated:**
```typescript
export type TokenType =
  | 'CLASS'
  | 'GENERATOR'
  // ...
  | 'ROTATE'    // R
  | 'TRIALITY'  // D ← NEW
  | 'TWIST'     // T
  | 'TILDE'     // ~
  // ...
```

#### Task 2.2: Update readIdentifier Method
**Location:** lexer.ts:130-153

**Current:**
```typescript
private readIdentifier(start: number): Token {
  let value = '';

  while (this.position < this.source.length && this.isAlphaNumeric(this.source[this.position])) {
    value += this.source[this.position];
    this.position++;
  }

  // Check for R or T transform prefixes
  if (value === 'R') {
    return this.makeToken('ROTATE', value, start);
  }
  if (value === 'T') {
    return this.makeToken('TWIST', value, start);
  }

  // Check if it's a generator
  if (GENERATORS.has(value)) {
    return this.makeToken('GENERATOR', value, start);
  }

  // Unknown identifier
  return this.makeToken('ERROR', value, start);
}
```

**Updated:**
```typescript
private readIdentifier(start: number): Token {
  let value = '';

  while (this.position < this.source.length && this.isAlphaNumeric(this.source[this.position])) {
    value += this.source[this.position];
    this.position++;
  }

  // Check for R, D, or T transform prefixes
  if (value === 'R') {
    return this.makeToken('ROTATE', value, start);
  }
  if (value === 'D') {                                    // ← NEW
    return this.makeToken('TRIALITY', value, start);      // ← NEW
  }                                                        // ← NEW
  if (value === 'T') {
    return this.makeToken('TWIST', value, start);
  }

  // Check if it's a generator
  if (GENERATORS.has(value)) {
    return this.makeToken('GENERATOR', value, start);
  }

  // Unknown identifier
  return this.makeToken('ERROR', value, start);
}
```

**Acceptance Criteria:**
- [ ] TRIALITY token type added
- [ ] Lexer recognizes 'D' as TRIALITY token
- [ ] D token placed between R and T in readIdentifier logic
- [ ] All existing tests pass
- [ ] New lexer test: `tokenize('D+1')` produces TRIALITY, PLUS, NUMBER

---

### Phase 3: Parser Updates
**Files:** `packages/core/src/parser/parser.ts`
**Estimated Lines Changed:** ~20 lines
**Estimated Time:** 30 minutes

#### Task 3.1: Update Grammar Documentation
**Location:** parser.ts:4-11

**Current:**
```typescript
* Grammar (EBNF):
*   <phrase>     ::= [ <transform> "@" ] <par>
*   <par>        ::= <seq> { "||" <seq> }
*   <seq>        ::= <term> { "." <term> }
*   <term>       ::= <op> | "(" <par> ")"
*   <op>         ::= <generator> "@" <sigil>
*   <sigil>      ::= "c" <int:0..95> ["^" ("+"|"-") <int>] ["~"] ["@" <λ:int 0..47>]
*   <transform>  ::= [ "R" ("+"|"-") <int> ] [ "T" ("+"|"-") <int> ] [ "~" ]
```

**Updated:**
```typescript
* Grammar (EBNF):
*   <phrase>     ::= [ <transform> "@" ] <par>
*   <par>        ::= <seq> { "||" <seq> }
*   <seq>        ::= <term> { "." <term> }
*   <term>       ::= <op> | "(" <par> ")"
*   <op>         ::= <generator> "@" <sigil>
*   <sigil>      ::= "c" <int:0..95> ["^" ("+"|"-") <int>] ["~"] ["@" <λ:int 0..47>]
*   <transform>  ::= [ "R" ("+"|"-") <int> ] [ "D" ("+"|"-") <int> ] [ "T" ("+"|"-") <int> ] [ "~" ]
*                                              ↑ NEW
```

#### Task 3.2: Update parsePhrase Lookahead
**Location:** parser.ts:38-56

**Current:**
```typescript
parsePhrase(): Phrase {
  let phrase: Phrase;
  const currentType = this.current().type;

  // Use lookahead to decide whether to parse a transform prefix
  if (currentType === 'ROTATE' || currentType === 'TWIST' || currentType === 'TILDE') {
    const transform = this.parseTransform();
    // ...
  }
  // ...
}
```

**Updated:**
```typescript
parsePhrase(): Phrase {
  let phrase: Phrase;
  const currentType = this.current().type;

  // Use lookahead to decide whether to parse a transform prefix
  if (currentType === 'ROTATE' || currentType === 'TRIALITY' || currentType === 'TWIST' || currentType === 'TILDE') {
    //                                ↑ NEW
    const transform = this.parseTransform();
    // ...
  }
  // ...
}
```

#### Task 3.3: Update parseTerm Lookahead
**Location:** parser.ts:96-109

**Current:**
```typescript
private parseTerm(): Term {
  const currentType = this.current().type;

  // Allow transform prefixes within sequences or groups
  if (currentType === 'ROTATE' || currentType === 'TWIST' || currentType === 'TILDE') {
    const transform = this.parseTransform();
    // ...
  }
  // ...
}
```

**Updated:**
```typescript
private parseTerm(): Term {
  const currentType = this.current().type;

  // Allow transform prefixes within sequences or groups
  if (currentType === 'ROTATE' || currentType === 'TRIALITY' || currentType === 'TWIST' || currentType === 'TILDE') {
    //                                ↑ NEW
    const transform = this.parseTransform();
    // ...
  }
  // ...
}
```

#### Task 3.4: Update parseTransform Method
**Location:** parser.ts:195-235

**Current:**
```typescript
private parseTransform(): Transform {
  const transform: Transform = {};
  let hasAny = false;

  // Check for R±q
  if (this.current().type === 'ROTATE') {
    hasAny = true;
    this.advance();
    const sign = this.parseSign();
    const q = parseInt(this.expect('NUMBER').value, 10);
    transform.R = sign * q;
  }

  // Check for T±k
  if (this.current().type === 'TWIST') {
    hasAny = true;
    this.advance();
    const sign = this.parseSign();
    const k = parseInt(this.expect('NUMBER').value, 10);
    transform.T = sign * k;
  }

  // Check for ~
  if (this.current().type === 'TILDE') {
    hasAny = true;
    this.advance();
    transform.M = true;
  }

  if (!hasAny) {
    throw new Error(
      `Expected a transform token (R, T, or ~) at position ${this.current().position}`,
    );
  }

  return transform;
}
```

**Updated:**
```typescript
private parseTransform(): Transform {
  const transform: Transform = {};
  let hasAny = false;

  // Check for R±q
  if (this.current().type === 'ROTATE') {
    hasAny = true;
    this.advance();
    const sign = this.parseSign();
    const q = parseInt(this.expect('NUMBER').value, 10);
    transform.R = sign * q;
  }

  // Check for D±k (NEW)
  if (this.current().type === 'TRIALITY') {
    hasAny = true;
    this.advance();
    const sign = this.parseSign();
    const k = parseInt(this.expect('NUMBER').value, 10);
    transform.D = sign * k;
  }

  // Check for T±k
  if (this.current().type === 'TWIST') {
    hasAny = true;
    this.advance();
    const sign = this.parseSign();
    const k = parseInt(this.expect('NUMBER').value, 10);
    transform.T = sign * k;
  }

  // Check for ~
  if (this.current().type === 'TILDE') {
    hasAny = true;
    this.advance();
    transform.M = true;
  }

  if (!hasAny) {
    throw new Error(
      `Expected a transform token (R, D, T, or ~) at position ${this.current().position}`,
    );
  }

  return transform;
}
```

**Acceptance Criteria:**
- [ ] Grammar documentation updated
- [ ] parsePhrase lookahead includes TRIALITY
- [ ] parseTerm lookahead includes TRIALITY
- [ ] parseTransform handles D±k between R and T
- [ ] Parser produces Transform objects with D field
- [ ] Error message includes 'D' in expected tokens
- [ ] All existing tests pass

---

### Phase 4: Class System Core Logic
**Files:** `packages/core/src/class-system/class.ts`
**Estimated Lines Added:** ~120 lines
**Estimated Time:** 90 minutes

#### Task 4.1: Add applyTriality Function
**Location:** class.ts:148 (after applyMirror)

**New Function:**
```typescript
/**
 * Apply triality transform D±k (mod 3 on d)
 * D+k: (h₂, d, ℓ) ↦ (h₂, (d+k) mod 3, ℓ)
 *
 * Preserves h₂ and ℓ, rotates modality:
 * - D+1: 0→1, 1→2, 2→0
 * - D+2: 0→2, 2→1, 1→0 (same as D-1)
 * - D+3: identity
 */
export function applyTriality(comp: SigilComponents, k: number): SigilComponents {
  // Normalize k to [0, 2] range
  const normalized = ((k % 3) + 3) % 3;

  // Apply modality rotation
  const d = ((comp.d + normalized) % 3) as 0 | 1 | 2;

  return { ...comp, d };
}
```

#### Task 4.2: Update applyTransforms Function
**Location:** class.ts:171-188

**Current:**
```typescript
export function applyTransforms(
  comp: SigilComponents,
  transforms: { R?: number; T?: number; M?: boolean },
): SigilComponents {
  let result = comp;

  if (transforms.R !== undefined) {
    result = applyRotation(result, transforms.R);
  }
  if (transforms.T !== undefined) {
    result = applyTwist(result, transforms.T);
  }
  if (transforms.M) {
    result = applyMirror(result);
  }

  return result;
}
```

**Updated:**
```typescript
export function applyTransforms(
  comp: SigilComponents,
  transforms: { R?: number; D?: number; T?: number; M?: boolean },
): SigilComponents {
  let result = comp;

  // Apply in order: R, D, T (commutative group), then M
  // Order doesn't matter for R, D, T since they act on independent components
  if (transforms.R !== undefined) {
    result = applyRotation(result, transforms.R);
  }
  if (transforms.D !== undefined) {
    result = applyTriality(result, transforms.D);
  }
  if (transforms.T !== undefined) {
    result = applyTwist(result, transforms.T);
  }
  if (transforms.M) {
    result = applyMirror(result);
  }

  return result;
}
```

#### Task 4.3: Add Triality Orbit Functions
**Location:** class.ts (end of file, after formatClassInfo)

**New Functions:**
```typescript
// ============================================================================
// Triality Orbits
// ============================================================================

/**
 * Apply D-transform to a class index
 * @param classIndex - Starting class (0-95)
 * @param k - Rotation amount (will be normalized to 0-2)
 * @returns New class index after D-transform
 */
export function applyDTransformToClass(classIndex: number, k: number): DTransformResult {
  if (classIndex < 0 || classIndex >= 96) {
    throw new Error(`Invalid class index: ${classIndex}`);
  }

  // Get components
  const components = decodeClassIndex(classIndex);
  const { h2, d, l } = components;

  // Apply triality
  const transformed = applyTriality(components, k);
  const d_new = transformed.d;

  // Calculate new class index
  const newClass = componentsToClassIndex(transformed);

  return {
    oldClass: classIndex,
    newClass,
    transformation: {
      h2,
      d_old: d,
      d_new,
      l,
    },
  };
}

/**
 * Get triality orbit containing a class
 * Returns all 3 classes in the orbit with same (h₂, ℓ) but different d
 *
 * @param classIndex - Any class in the orbit
 * @returns TrialityOrbit with all 3 classes
 */
export function getTrialityOrbit(classIndex: number): TrialityOrbit {
  const components = decodeClassIndex(classIndex);
  const { h2, l } = components;

  // Generate all 3 classes in orbit
  const classes: [number, number, number] = [
    componentsToClassIndex({ h2, d: 0, l }),
    componentsToClassIndex({ h2, d: 1, l }),
    componentsToClassIndex({ h2, d: 2, l }),
  ];

  return {
    baseCoordinates: { h2, l },
    classes,
  };
}

/**
 * Generate all 32 triality orbits
 * Each orbit contains 3 classes (96 classes / 3 = 32 orbits)
 */
export function getAllTrialityOrbits(): TrialityOrbit[] {
  const orbits: TrialityOrbit[] = [];

  for (let h2 = 0; h2 < 4; h2++) {
    for (let l = 0; l < 8; l++) {
      orbits.push({
        baseCoordinates: {
          h2: h2 as 0 | 1 | 2 | 3,
          l: l as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
        },
        classes: [
          24 * h2 + 8 * 0 + l,
          24 * h2 + 8 * 1 + l,
          24 * h2 + 8 * 2 + l,
        ],
      });
    }
  }

  return orbits;
}
```

#### Task 4.4: Import DTransformResult and TrialityOrbit Types
**Location:** class.ts:6

**Current:**
```typescript
import type { SigilComponents, ClassInfo, BeltAddress } from '../types';
```

**Updated:**
```typescript
import type { SigilComponents, ClassInfo, BeltAddress, DTransformResult, TrialityOrbit } from '../types';
```

**Acceptance Criteria:**
- [ ] applyTriality function correctly rotates d modulo 3
- [ ] applyTriality preserves h₂ and ℓ
- [ ] applyTransforms includes D-transform handling
- [ ] applyDTransformToClass returns correct result
- [ ] getTrialityOrbit generates correct 3-class orbit
- [ ] getAllTrialityOrbits generates 32 orbits covering all 96 classes
- [ ] D+3 is identity (returns same class)
- [ ] D-1 equivalent to D+2
- [ ] All existing tests pass

---

### Phase 5: Evaluator Integration
**Files:** `packages/core/src/evaluator/evaluator.ts`
**Estimated Lines Changed:** ~40 lines
**Estimated Time:** 45 minutes

#### Task 5.1: Update combineTransforms Function
**Location:** evaluator.ts:152-166

**Current:**
```typescript
function combineTransforms(outer?: Transform, inner?: Transform): Transform | undefined {
  if (!outer && !inner) return undefined;
  if (!outer) return inner;
  if (!inner) return outer;

  const combined: Transform = {};

  // Add rotations
  if (outer.R !== undefined || inner.R !== undefined) {
    combined.R = (outer.R || 0) + (inner.R || 0);
  }

  // Add twists
  if (outer.T !== undefined || inner.T !== undefined) {
    combined.T = (outer.T || 0) + (inner.T || 0);
  }

  // XOR mirrors (double mirror cancels)
  if (outer.M || inner.M) {
    combined.M = !!(outer.M !== inner.M);
  }

  return combined;
}
```

**Updated:**
```typescript
function combineTransforms(outer?: Transform, inner?: Transform): Transform | undefined {
  if (!outer && !inner) return undefined;
  if (!outer) return inner;
  if (!inner) return outer;

  const combined: Transform = {};

  // Add rotations (mod 4)
  if (outer.R !== undefined || inner.R !== undefined) {
    combined.R = (outer.R || 0) + (inner.R || 0);
  }

  // Add triality rotations (mod 3) ← NEW
  if (outer.D !== undefined || inner.D !== undefined) {
    combined.D = (outer.D || 0) + (inner.D || 0);
  }

  // Add twists (mod 8)
  if (outer.T !== undefined || inner.T !== undefined) {
    combined.T = (outer.T || 0) + (inner.T || 0);
  }

  // XOR mirrors (double mirror cancels)
  if (outer.M || inner.M) {
    combined.M = !!(outer.M !== inner.M);
  }

  return combined;
}
```

#### Task 5.2: Update Operational Backend Word Generation
**Location:** evaluator.ts:250-300 (approximate, in generateTransformWords)

**Find the function that generates operational words for transforms. If it doesn't exist as a separate function, it's likely inline in the operational evaluator.**

**Current Pattern (example):**
```typescript
if (transform.R) {
  words.push(`→ρ[${normalizeRotation(transform.R)}]`);
  // ... body words
  words.push(`←ρ[${normalizeRotation(transform.R)}]`);
}
```

**Add D-transform Support:**
```typescript
if (transform.D) {
  const normalized = ((transform.D % 3) + 3) % 3;
  words.push(`→δ[${normalized}]`);
  // ... (D-transform context)
}
// ... later in the code
if (transform.D) {
  const normalized = ((transform.D % 3) + 3) % 3;
  words.push(`←δ[${normalized}]`);
}
```

**Note:** The exact implementation depends on how operational words are currently generated. You may need to:
1. Add a helper function `generateDTransformWords(k: number): string[]`
2. Integrate it into the word generation flow
3. Ensure proper nesting with other transforms

**Acceptance Criteria:**
- [ ] combineTransforms handles D field
- [ ] D-transforms combine additively (like R and T)
- [ ] Operational backend emits D-transform words
- [ ] Transform order preserved: R, D, T, M
- [ ] All existing evaluator tests pass

---

### Phase 6: High-Level API
**Files:** `packages/core/src/api/index.ts`
**Estimated Lines Added:** ~60 lines
**Estimated Time:** 30 minutes

#### Task 6.1: Add D-Transform Public Methods
**Location:** api/index.ts (after equivalenceClass method, around line 180)

**New Methods:**
```typescript
/**
 * Apply D-transform to a class index
 *
 * @param classIndex - Starting class (0-95)
 * @param k - Triality rotation amount (will be normalized to 0-2)
 * @returns Result object with old/new class and transformation details
 *
 * @example
 * const result = Atlas.applyDTransform(21, 1);
 * console.log(result.newClass); // 5
 * console.log(result.transformation); // { h2: 0, d_old: 2, d_new: 0, l: 5 }
 */
static applyDTransform(classIndex: number, k: number): DTransformResult {
  return applyDTransformToClass(classIndex, k);
}

/**
 * Get triality orbit for a class
 * Returns all 3 classes with same (h₂, ℓ) but different d
 *
 * @param classIndex - Any class in the orbit (0-95)
 * @returns TrialityOrbit containing all 3 classes
 *
 * @example
 * const orbit = Atlas.getTrialityOrbit(21);
 * console.log(orbit.classes); // [5, 13, 21]
 * console.log(orbit.baseCoordinates); // { h2: 0, l: 5 }
 */
static getTrialityOrbit(classIndex: number): TrialityOrbit {
  return getTrialityOrbit(classIndex);
}

/**
 * Get all 32 triality orbits
 * Each orbit contains 3 classes (96 classes / 3 = 32 orbits)
 *
 * @returns Array of 32 TrialityOrbit objects
 *
 * @example
 * const orbits = Atlas.getAllTrialityOrbits();
 * console.log(orbits.length); // 32
 * console.log(orbits[0].classes); // [0, 8, 16]
 */
static getAllTrialityOrbits(): TrialityOrbit[] {
  return getAllTrialityOrbits();
}
```

#### Task 6.2: Update Imports
**Location:** api/index.ts (top of file)

**Current:**
```typescript
import {
  decodeByteToComponents,
  byteToClassIndex,
  classIndexToCanonicalByte,
  getClassInfo,
  getEquivalenceClass,
  formatClassInfo,
  computeBeltAddress,
  decomposeBeltAddress,
} from '../class-system';
```

**Updated:**
```typescript
import {
  decodeByteToComponents,
  byteToClassIndex,
  classIndexToCanonicalByte,
  getClassInfo,
  getEquivalenceClass,
  formatClassInfo,
  computeBeltAddress,
  decomposeBeltAddress,
  applyDTransformToClass,
  getTrialityOrbit,
  getAllTrialityOrbits,
} from '../class-system';
```

#### Task 6.3: Update Type Imports
**Location:** api/index.ts (top of file)

**Current:**
```typescript
import type {
  ClassInfo,
  BeltAddress,
  LiteralResult,
  OperationalResult,
  Phrase,
} from '../types';
```

**Updated:**
```typescript
import type {
  ClassInfo,
  BeltAddress,
  LiteralResult,
  OperationalResult,
  Phrase,
  DTransformResult,
  TrialityOrbit,
} from '../types';
```

**Acceptance Criteria:**
- [ ] Atlas.applyDTransform() method added
- [ ] Atlas.getTrialityOrbit() method added
- [ ] Atlas.getAllTrialityOrbits() method added
- [ ] All methods have JSDoc documentation
- [ ] All methods have usage examples in JSDoc
- [ ] Imports updated correctly
- [ ] All existing API tests pass

---

### Phase 7: Comprehensive Testing
**Files:** `packages/core/test/index.ts`
**Estimated Lines Added:** ~250 lines
**Estimated Time:** 120 minutes

#### Task 7.1: Add D-Transform Unit Tests
**Location:** test/index.ts (add new section after existing transform tests)

**Test Suite:**
```typescript
// ============================================================================
// D-Transform Tests
// ============================================================================

function testDTransformBasics() {
  runTest('D+1 rotates modality 0→1', () => {
    // c0 (h₂=0, d=0, ℓ=0) → D+1 → c8 (h₂=0, d=1, ℓ=0)
    const result = Atlas.applyDTransform(0, 1);
    assertEqual(result.newClass, 8);
    assertEqual(result.transformation.d_old, 0);
    assertEqual(result.transformation.d_new, 1);
  });

  runTest('D+1 rotates modality 1→2', () => {
    // c8 (h₂=0, d=1, ℓ=0) → D+1 → c16 (h₂=0, d=2, ℓ=0)
    const result = Atlas.applyDTransform(8, 1);
    assertEqual(result.newClass, 16);
    assertEqual(result.transformation.d_new, 2);
  });

  runTest('D+1 rotates modality 2→0', () => {
    // c16 (h₂=0, d=2, ℓ=0) → D+1 → c0 (h₂=0, d=0, ℓ=0)
    const result = Atlas.applyDTransform(16, 1);
    assertEqual(result.newClass, 0);
    assertEqual(result.transformation.d_new, 0);
  });

  runTest('D+2 is same as D-1', () => {
    const plus2 = Atlas.applyDTransform(8, 2);
    const minus1 = Atlas.applyDTransform(8, -1);
    assertEqual(plus2.newClass, minus1.newClass);
  });

  runTest('D+3 is identity (period 3)', () => {
    for (let c = 0; c < 96; c++) {
      const result = Atlas.applyDTransform(c, 3);
      assertEqual(result.newClass, c);
    }
  });

  runTest('D+6 is identity (double period)', () => {
    const result = Atlas.applyDTransform(21, 6);
    assertEqual(result.newClass, 21);
  });

  runTest('D-transform preserves h₂', () => {
    for (let c = 0; c < 96; c++) {
      const info = Atlas.classInfo(Atlas.canonicalByte(c));
      const result = Atlas.applyDTransform(c, 1);
      const newInfo = Atlas.classInfo(Atlas.canonicalByte(result.newClass));
      assertEqual(newInfo.components.h2, info.components.h2);
    }
  });

  runTest('D-transform preserves ℓ', () => {
    for (let c = 0; c < 96; c++) {
      const info = Atlas.classInfo(Atlas.canonicalByte(c));
      const result = Atlas.applyDTransform(c, 1);
      const newInfo = Atlas.classInfo(Atlas.canonicalByte(result.newClass));
      assertEqual(newInfo.components.l, info.components.l);
    }
  });
}

function testTrialityOrbits() {
  runTest('triality orbit contains 3 classes', () => {
    const orbit = Atlas.getTrialityOrbit(0);
    assertEqual(orbit.classes.length, 3);
  });

  runTest('triality orbit for c0 is [0, 8, 16]', () => {
    const orbit = Atlas.getTrialityOrbit(0);
    assertArrayEqual(orbit.classes, [0, 8, 16]);
  });

  runTest('triality orbit for c21 is [5, 13, 21]', () => {
    const orbit = Atlas.getTrialityOrbit(21);
    assertArrayEqual(orbit.classes, [5, 13, 21]);
  });

  runTest('orbit is same for all 3 members', () => {
    const orbit1 = Atlas.getTrialityOrbit(0);
    const orbit2 = Atlas.getTrialityOrbit(8);
    const orbit3 = Atlas.getTrialityOrbit(16);
    assertArrayEqual(orbit1.classes, orbit2.classes);
    assertArrayEqual(orbit2.classes, orbit3.classes);
  });

  runTest('base coordinates match class h₂ and ℓ', () => {
    const orbit = Atlas.getTrialityOrbit(21);
    const info = Atlas.classInfo(Atlas.canonicalByte(21));
    assertEqual(orbit.baseCoordinates.h2, info.components.h2);
    assertEqual(orbit.baseCoordinates.l, info.components.l);
  });

  runTest('all 32 orbits generated', () => {
    const orbits = Atlas.getAllTrialityOrbits();
    assertEqual(orbits.length, 32);
  });

  runTest('all 96 classes covered by orbits', () => {
    const orbits = Atlas.getAllTrialityOrbits();
    const allClasses = new Set<number>();
    for (const orbit of orbits) {
      for (const c of orbit.classes) {
        allClasses.add(c);
      }
    }
    assertEqual(allClasses.size, 96);
  });

  runTest('no class appears in multiple orbits', () => {
    const orbits = Atlas.getAllTrialityOrbits();
    const seen = new Set<number>();
    for (const orbit of orbits) {
      for (const c of orbit.classes) {
        if (seen.has(c)) {
          throw new Error(`Class ${c} appears in multiple orbits`);
        }
        seen.add(c);
      }
    }
  });
}

function testDTransformCommutativity() {
  runTest('D commutes with R', () => {
    for (let c = 0; c < 96; c++) {
      // Apply D then R
      const dr = Atlas.applyDTransform(c, 1);
      const drByte = Atlas.canonicalByte(dr.newClass);
      const drComp = Atlas.classInfo(drByte).components;
      const drr = Atlas.classInfo(
        Atlas.encodeComponentsToByte(Atlas.applyRotation(drComp, 1))
      );

      // Apply R then D
      const rByte = Atlas.canonicalByte(c);
      const rComp = Atlas.classInfo(rByte).components;
      const rd = Atlas.classInfo(
        Atlas.encodeComponentsToByte(Atlas.applyRotation(rComp, 1))
      );
      const rdr = Atlas.applyDTransform(rd.classIndex, 1);

      assertEqual(drr.classIndex, rdr.newClass,
        `D and R should commute for class ${c}`);
    }
  });

  runTest('D commutes with T', () => {
    for (let c = 0; c < 96; c++) {
      // Apply D then T
      const dr = Atlas.applyDTransform(c, 1);
      const drByte = Atlas.canonicalByte(dr.newClass);
      const drComp = Atlas.classInfo(drByte).components;
      const drt = Atlas.classInfo(
        Atlas.encodeComponentsToByte(Atlas.applyTwist(drComp, 3))
      );

      // Apply T then D
      const tByte = Atlas.canonicalByte(c);
      const tComp = Atlas.classInfo(tByte).components;
      const td = Atlas.classInfo(
        Atlas.encodeComponentsToByte(Atlas.applyTwist(tComp, 3))
      );
      const tdr = Atlas.applyDTransform(td.classIndex, 1);

      assertEqual(drt.classIndex, tdr.newClass,
        `D and T should commute for class ${c}`);
    }
  });
}
```

#### Task 7.2: Add D-Transform Integration Tests
**Location:** test/index.ts (add section for parser/evaluator integration)

**Test Suite:**
```typescript
// ============================================================================
// D-Transform Integration Tests
// ============================================================================

function testDTransformParsing() {
  runTest('parse D+1 prefix transform', () => {
    const ast = Atlas.parse('D+1@ mark@c0');
    if (ast.kind !== 'Xform') {
      throw new Error('Expected Xform node');
    }
    assertEqual(ast.transform.D, 1);
  });

  runTest('parse D-1 prefix transform', () => {
    const ast = Atlas.parse('D-1@ mark@c0');
    if (ast.kind !== 'Xform') {
      throw new Error('Expected Xform node');
    }
    assertEqual(ast.transform.D, -1);
  });

  runTest('parse combined R+2 D+1 T+3', () => {
    const ast = Atlas.parse('R+2 D+1 T+3@ mark@c0');
    if (ast.kind !== 'Xform') {
      throw new Error('Expected Xform node');
    }
    assertEqual(ast.transform.R, 2);
    assertEqual(ast.transform.D, 1);
    assertEqual(ast.transform.T, 3);
  });

  runTest('parse D+1 T+2 (no R)', () => {
    const ast = Atlas.parse('D+1 T+2@ mark@c0');
    if (ast.kind !== 'Xform') {
      throw new Error('Expected Xform node');
    }
    assertEqual(ast.transform.D, 1);
    assertEqual(ast.transform.T, 2);
    assertEqual(ast.transform.R, undefined);
  });
}

function testDTransformEvaluation() {
  runTest('evaluate D+1@ mark@c21 to bytes', () => {
    // c21 (h₂=0, d=2, ℓ=5) → D+1 → c5 (h₂=0, d=0, ℓ=5)
    const result = Atlas.evaluateBytes('D+1@ mark@c21');
    const classIndex = Atlas.classIndex(result.bytes[0]);
    assertEqual(classIndex, 5);
  });

  runTest('evaluate D+2@ mark@c21 to bytes', () => {
    // c21 (h₂=0, d=2, ℓ=5) → D+2 → c13 (h₂=0, d=1, ℓ=5)
    const result = Atlas.evaluateBytes('D+2@ mark@c21');
    const classIndex = Atlas.classIndex(result.bytes[0]);
    assertEqual(classIndex, 13);
  });

  runTest('evaluate D-1@ mark@c21 to bytes', () => {
    // D-1 should equal D+2
    const result = Atlas.evaluateBytes('D-1@ mark@c21');
    const classIndex = Atlas.classIndex(result.bytes[0]);
    assertEqual(classIndex, 13);
  });

  runTest('evaluate R+1 D+1@ mark@c0 to bytes', () => {
    // c0 (h₂=0, d=0, ℓ=0) → D+1 → c8 (h₂=0, d=1, ℓ=0) → R+1 → c32 (h₂=1, d=1, ℓ=0)
    const result = Atlas.evaluateBytes('R+1 D+1@ mark@c0');
    const classIndex = Atlas.classIndex(result.bytes[0]);
    assertEqual(classIndex, 32);
  });

  runTest('evaluate D+1 T+1@ mark@c0 to bytes', () => {
    // c0 (h₂=0, d=0, ℓ=0) → D+1 → c8 (h₂=0, d=1, ℓ=0) → T+1 → c10 (h₂=0, d=1, ℓ=1)
    const result = Atlas.evaluateBytes('D+1 T+1@ mark@c0');
    const classIndex = Atlas.classIndex(result.bytes[0]);
    assertEqual(classIndex, 10);
  });

  runTest('evaluate combined R+2 D+1 T+3@ mark@c0', () => {
    const result = Atlas.evaluateBytes('R+2 D+1 T+3@ mark@c0');
    assertEqual(result.bytes.length, 1);
    // Verify specific result based on transform composition
  });
}

function testDTransformOperationalBackend() {
  runTest('operational words include D-transform markers', () => {
    const result = Atlas.evaluateWords('D+1@ mark@c0');
    const hasTrialityMarker = result.words.some(w => w.includes('δ'));
    if (!hasTrialityMarker) {
      throw new Error('Expected triality marker δ in operational words');
    }
  });
}
```

#### Task 7.3: Add Test Runner Calls
**Location:** test/index.ts (in main test runner function)

**Add to test runner:**
```typescript
// D-Transform tests
testDTransformBasics();
testTrialityOrbits();
testDTransformCommutativity();
testDTransformParsing();
testDTransformEvaluation();
testDTransformOperationalBackend();
```

**Acceptance Criteria:**
- [ ] All D-transform unit tests pass
- [ ] All triality orbit tests pass
- [ ] All commutativity tests pass
- [ ] All parsing tests pass
- [ ] All evaluation tests pass
- [ ] All operational backend tests pass
- [ ] All existing tests still pass
- [ ] Test coverage ≥95% for new code

---

### Phase 8: Documentation & Examples
**Files:** `packages/core/README.md`, `docs/`, examples
**Estimated Time:** 60 minutes

#### Task 8.1: Update README.md
**Location:** packages/core/README.md

**Add D-Transform Section:**
```markdown
### D-Transform (Triality Rotation)

The D-transform rotates the modality parameter `d` with period 3:

```typescript
// D+k: (h₂, d, ℓ) ↦ (h₂, (d+k) mod 3, ℓ)

// Apply D-transform
const result = Atlas.applyDTransform(21, 1);
console.log(result.newClass); // 5
console.log(result.transformation);
// { h2: 0, d_old: 2, d_new: 0, l: 5 }

// Get triality orbit
const orbit = Atlas.getTrialityOrbit(21);
console.log(orbit.classes); // [5, 13, 21]
```

**Properties:**
- Period 3: `D+3 = identity`
- Preserves `h₂` and `ℓ`
- Commutes with R and T
- 32 triality orbits (96 classes / 3)

**Grammar:**
```
<transform> ::= [ R±q ] [ D±k ] [ T±m ] [ ~ ]
```

**Examples:**
```typescript
// Prefix transform
Atlas.evaluateBytes('D+1@ mark@c21'); // → c5

// Combined transforms
Atlas.evaluateBytes('R+2 D+1 T+3@ mark@c0');

// Triality orbits
Atlas.getAllTrialityOrbits(); // → 32 orbits
```
```

#### Task 8.2: Create D-Transform Example
**Location:** examples/d-transform.ts (new file)

```typescript
import { Atlas } from '@uor-foundation/sigmatics';

// Example 1: Basic D-transform
console.log('=== Basic D-Transform ===');
const result = Atlas.applyDTransform(21, 1);
console.log(`c21 → D+1 → c${result.newClass}`);
console.log(`  h₂: ${result.transformation.h2} (preserved)`);
console.log(`  d: ${result.transformation.d_old} → ${result.transformation.d_new}`);
console.log(`  ℓ: ${result.transformation.l} (preserved)`);

// Example 2: Triality orbits
console.log('\n=== Triality Orbits ===');
const orbit = Atlas.getTrialityOrbit(21);
console.log(`Orbit for c21: [${orbit.classes.join(', ')}]`);
console.log(`Base coordinates: h₂=${orbit.baseCoordinates.h2}, ℓ=${orbit.baseCoordinates.l}`);

// Example 3: All orbits
console.log('\n=== All 32 Triality Orbits ===');
const orbits = Atlas.getAllTrialityOrbits();
orbits.slice(0, 5).forEach((o, i) => {
  console.log(`Orbit ${i}: [${o.classes.join(', ')}]`);
});
console.log(`... (${orbits.length} total orbits)`);

// Example 4: Evaluation
console.log('\n=== Expression Evaluation ===');
const bytes = Atlas.evaluateBytes('D+1@ mark@c21');
console.log(`D+1@ mark@c21 → 0x${bytes.bytes[0].toString(16).toUpperCase()}`);

// Example 5: Combined transforms
console.log('\n=== Combined Transforms ===');
const combined = Atlas.evaluateBytes('R+2 D+1 T+3@ mark@c0');
console.log(`R+2 D+1 T+3@ mark@c0 → class ${Atlas.classIndex(combined.bytes[0])}`);
```

**Acceptance Criteria:**
- [ ] README updated with D-transform section
- [ ] Grammar documentation updated
- [ ] API examples added
- [ ] Example file created
- [ ] Example runs successfully

---

### Phase 9: Build & Validation
**Estimated Time:** 30 minutes

#### Task 9.1: Build Core Package
```bash
cd packages/core
npm run build
```

**Acceptance Criteria:**
- [ ] TypeScript compilation succeeds
- [ ] No type errors
- [ ] dist/ directory generated
- [ ] index.d.ts contains D-transform types

#### Task 9.2: Run Test Suite
```bash
npm test
```

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] No test failures
- [ ] Test output shows new D-transform tests

#### Task 9.3: Lint & Format
```bash
npm run lint
npm run format
```

**Acceptance Criteria:**
- [ ] No lint errors
- [ ] Code formatted consistently

#### Task 9.4: Build All Packages
```bash
cd ../..
npm run build:all
```

**Acceptance Criteria:**
- [ ] Core package builds
- [ ] Playground apps build
- [ ] No build errors

---

## Testing Strategy Summary

### Unit Tests (estimated 50+ tests)
1. **D-Transform Core**
   - Period 3 (D+3 = identity)
   - Sign handling (D-1 = D+2)
   - Normalization
   - Component preservation (h₂, ℓ)

2. **Triality Orbits**
   - Orbit generation
   - Orbit membership
   - Coverage (32 orbits, 96 classes)
   - Base coordinates

3. **Commutativity**
   - D commutes with R
   - D commutes with T
   - Transform composition

### Integration Tests (estimated 20+ tests)
1. **Lexer/Parser**
   - Token recognition
   - AST generation
   - Error handling

2. **Evaluator**
   - Literal backend
   - Operational backend
   - Transform combination
   - Prefix/postfix handling

3. **End-to-End**
   - Expression parsing
   - Byte evaluation
   - Word generation

---

## Migration Checklist

### Pre-Implementation
- [ ] Review specification document
- [ ] Understand current transform system
- [ ] Set up development environment
- [ ] Create feature branch

### Phase 1: Types (30 min)
- [ ] Update Transform interface
- [ ] Add TrialityOrbit type
- [ ] Add DTransformResult type
- [ ] Verify TypeScript compilation

### Phase 2: Lexer (20 min)
- [ ] Add TRIALITY token
- [ ] Update readIdentifier
- [ ] Test token recognition

### Phase 3: Parser (30 min)
- [ ] Update grammar docs
- [ ] Update parsePhrase
- [ ] Update parseTerm
- [ ] Update parseTransform
- [ ] Test AST generation

### Phase 4: Class System (90 min)
- [ ] Add applyTriality
- [ ] Update applyTransforms
- [ ] Add applyDTransformToClass
- [ ] Add getTrialityOrbit
- [ ] Add getAllTrialityOrbits
- [ ] Test core logic

### Phase 5: Evaluator (45 min)
- [ ] Update combineTransforms
- [ ] Update operational backend
- [ ] Test evaluation

### Phase 6: API (30 min)
- [ ] Add public methods
- [ ] Update imports
- [ ] Add JSDoc
- [ ] Test API

### Phase 7: Tests (120 min)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Run full test suite
- [ ] Verify coverage

### Phase 8: Documentation (60 min)
- [ ] Update README
- [ ] Create examples
- [ ] Update grammar docs

### Phase 9: Build (30 min)
- [ ] Build packages
- [ ] Run tests
- [ ] Lint/format
- [ ] Final validation

### Post-Implementation
- [ ] Code review
- [ ] Performance testing
- [ ] Update CHANGELOG
- [ ] Commit changes
- [ ] Push to branch
- [ ] Create pull request

---

## Success Metrics

### Functionality
- [ ] D-transform correctly rotates modality (mod 3)
- [ ] D+3 is identity for all 96 classes
- [ ] D commutes with R and T
- [ ] Triality orbits correctly generated (32 orbits)

### Testing
- [ ] All new tests passing (70+ new tests)
- [ ] All existing tests passing
- [ ] Test coverage ≥95%
- [ ] No regressions

### Code Quality
- [ ] TypeScript compilation clean
- [ ] No lint errors
- [ ] Consistent formatting
- [ ] Full JSDoc coverage

### Documentation
- [ ] README updated
- [ ] API documented
- [ ] Examples working
- [ ] Grammar specification updated

### Performance
- [ ] D-transform: <1ms per operation
- [ ] Triality orbit generation: <10ms for all 32
- [ ] No performance regression
- [ ] Build size increase: <5KB

---

## Risk Mitigation

### Risk: Breaking Changes
**Mitigation:**
- D-transform is purely additive
- All fields optional in Transform interface
- Backward compatibility maintained
- Existing expressions unchanged

### Risk: Parser Complexity
**Mitigation:**
- D follows same pattern as R and T
- Simple token recognition
- Clear grammar ordering
- Comprehensive tests

### Risk: Test Coverage Gaps
**Mitigation:**
- Test all 96 classes for invariants
- Test commutativity exhaustively
- Integration tests for all code paths
- Specification test vectors

### Risk: Performance Impact
**Mitigation:**
- D-transform is O(1) operation
- No additional loops or complexity
- Modulo arithmetic optimized
- Benchmark before/after

---

## Timeline Estimate

**Total Estimated Time:** 8 hours

- **Phase 1 (Types):** 30 minutes
- **Phase 2 (Lexer):** 20 minutes
- **Phase 3 (Parser):** 30 minutes
- **Phase 4 (Class System):** 90 minutes
- **Phase 5 (Evaluator):** 45 minutes
- **Phase 6 (API):** 30 minutes
- **Phase 7 (Tests):** 120 minutes
- **Phase 8 (Documentation):** 60 minutes
- **Phase 9 (Build):** 30 minutes

**Recommended Schedule:**
- **Day 1 (4 hours):** Phases 1-4 (core implementation)
- **Day 2 (4 hours):** Phases 5-9 (integration, testing, docs)

---

## File Change Summary

| File | Lines Changed | Type |
|------|---------------|------|
| types/types.ts | +15 | Modified |
| lexer/lexer.ts | +10 | Modified |
| parser/parser.ts | +20 | Modified |
| class-system/class.ts | +120 | Modified |
| evaluator/evaluator.ts | +40 | Modified |
| api/index.ts | +60 | Modified |
| test/index.ts | +250 | Modified |
| README.md | +50 | Modified |
| examples/d-transform.ts | +40 | New |
| **Total** | **~605 lines** | **8 files modified, 1 new** |

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Create feature branch** from main
3. **Implement Phase 1** (types) and validate
4. **Proceed sequentially** through phases
5. **Run tests after each phase** to catch issues early
6. **Commit frequently** with descriptive messages
7. **Final review** before PR

---

## References

- **Specification:** D-Transform Implementation Plan (provided)
- **Current Grammar:** parser.ts:4-11
- **Transform System:** class-system/class.ts:133-188
- **Type Definitions:** types/types.ts
- **Test Suite:** test/index.ts

---

**Status:** Ready for Implementation
**Approval Required:** Yes
**Blockers:** None
**Dependencies:** None (all changes self-contained)

---

## Questions for Review

1. Should D-transform support postfix syntax (`c21^D+1`)?
   - **Recommendation:** No, keep prefix-only for consistency with current design

2. Operational backend word format for D-transform?
   - **Recommendation:** `→δ[k]` and `←δ[k]` (using Greek delta)

3. Should we add D-transform to ClassSigil postfix fields?
   - **Recommendation:** Future enhancement, not in initial implementation

---

**End of Refactor Plan**
