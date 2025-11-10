Implement and complete the refactor of the repository. Do not keep dead code. test, lint, and format.

Sigmatics 0.4.0 — Whole-Repo Transition Plan to the Declarative Model
Below is the end-to-end plan to re-architect the repository so that Sigmatics Core + stdlib becomes one fused, declarative model. We (1) define the Sigmatics Model Spec, (2) implement a model server/registry that compiles + serves models, and (3) migrate every operation to be declared as a model and executed via the compiler/backends.

A) Target Architecture (what we’re moving to)
Atlas API
└─ Model Server / Registry
├─ Schemas (JSON-Schema for models)
├─ Compiler
│ ├─ IR (atoms, ∘, ⊗, transforms, selectors)
│ ├─ Rewrites (push/normalize/fold)
│ ├─ Fusion (complexity class, compiled vs runtime params)
│ └─ Lowering (backend plan)
├─ Backends
│ ├─ Class backend (permutation / rank-1 fast path)
│ └─ SGA backend (grade-aware correctness)
└─ Cache (compiled model artifacts)
Key invariants we maintain:

SGA = Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃] semantics are preserved; SGA multiply = GP ⊗ Z₄ ⊗ Z₃
Transforms R/D/T/M act as algebra automorphisms with R⁴=D³=T⁸=M² and expected commutations/conjugations (preserve ≡₉₆)
Group-algebra kernels (ℝ[ℤ₄], ℝ[ℤ₃]) remain the primitive building blocks for transform powers and fast pure-power paths
Formal spec’s class system, transforms and operational semantics are the law we compile from (class index, R/T/M actions, typed composition) .
B) Repository Layout (post-refactor)
packages/core/
src/
model/ # Model layer
schemas/ # JSON-Schema (stdlib models)
registry.ts # Load/validate schemas, resolve versions
types.ts # SigModel, CompiledModel, Params (compiled/runtime), ComplexityClass
compiler/ # Compiler pipeline
ir.ts # Tiny IR (atoms, ∘, ⊗, transforms R/D/T/M, project(k))
rewrites.ts # Push transforms to leaves; fold pure powers; canonicalize (per spec §6)
fuser.ts # Complexity-guided fusion; bake compiled params; kernel selection
lowering/
class-backend.ts # Class/permutation plan (rank-1 fast path)
sga-backend.ts # SGA plan (grade-aware correctness)
stdlib/ # All operations are declared models
ring/ # add96, sub96, mul96
transforms/ # R, D, T, M
grade/ # project(k) + utilities
bridge/ # lift(i), project(element) as models (rank-1 only by definition)
sga/ # Existing SGA primitives (kept; used by sga-backend)
sga-element.ts # (now thin wrappers or invoked by backend plans) :contentReference[oaicite:9]{index=9}
transforms.ts # (internal helpers; still match automorphism laws) :contentReference[oaicite:10]{index=10}
group-algebras.ts # (unchanged kernels) :contentReference[oaicite:11]{index=11}
server/ # Model server (in-process)
registry-server.ts # getModel(name, version) → CompiledModel
cache.ts # compiled plan cache (keyed by schema+compiled params)
test/ # Property tests; differential tests (class vs SGA backend)
C) Sigmatics Model Spec
Everything is a Model:

Schema (JSON-Schema): shape + constraints of the operation

Parameters:

compiled: frozen at compile time → maximizes fusion
runtime: minimal inputs at call time
ComplexityClass: C0…C3 (fewer runtime degrees ⇒ more fusion)

IR primitives (match formal spec & current ops):

Atoms: op@σ (σ=(h₂,d,ℓ)), lift(i), project(k)
Combinators: ∘ (sequential), ⊗ (parallel) with associativity/commutativity/unit laws
Transforms: R, D, T_k, M per class-permutation actions
Rewrite rules (deterministic):

Push transforms to leaves; normalize terms (Transform Calculus)
Fold pure powers in ℝ[ℤ₄]/ℝ[ℤ₃] (r^i·r^j → r^(i+j), τ similar) using kernels already backed by z4Power/z3Power/z4Multiply/z3Multiply
Lowering policy:

Prefer Class backend for rank-1 / class-pure paths (fast permutation); use SGA backend when grade semantics or project(k) require Clifford math (GP, projection) .
D) Model Server / Registry (in-process)
Responsibilities

Resolve model by name/version; validate schema; compute ComplexityClass from compiled params; compile to IR; apply rewrites + fusion; select backend plan; cache compiled plan keyed by (model, version, compiledParams).
APIs

// compile-time
const cm = ModelRegistry.compile("add96", { overflowMode: "track" }); // compiled params
// run-time
const out = cm.run({ a: 42, b: 99 }); // runtime params
Behavior

All stdlib ops (ring, transforms, grade, bridge) live as models here.
Atlas API becomes a thin facade that calls the registry for ops.
E) Phased Implementation (repo-wide)
Phase 1 — Define the Model Spec & Scaffolding
Add model/schemas/ + registry.ts + types.ts.
Implement JSON-Schema validation + versioning convention (e.g., "sigmatics/add96@1").
Define ComplexityClass policy (C0–C3).
Phase 2 — Compiler Core
ir.ts: atoms, ∘, ⊗, transforms, project(k), lift(i).
rewrites.ts: push-down transforms; fold pure powers; canonicalize (spec §6) .
fuser.ts: bake compiled params; choose class vs SGA backend per subterm.
Phase 3 — Backends
class-backend.ts:

Integer arithmetic for add96/sub96/mul96 (mod-96 ring); overflow token if requested.
R/D via ℝ[ℤ₄]/ℝ[ℤ₃] powers; T as ℓ-permutation over rank-1 (matches current transforms.ts) .
sga-backend.ts:

Invoke SGA primitives for grade-aware ops: sgaMultiply, clifford grade projection; reuse z4*/z3* kernels for powers/multiply/add .
Phase 4 — Stdlib as Models (declare, don’t hard-code)
Ring: add96, sub96, mul96 (compiled overflow policy; runtime: inputs).
Transforms: R, D, T, M (compiled powers); lower exactly as current automorphisms (R left-multiplies r, D right-multiplies τ, T permutes ℓ, M inverts τ) .
Grade: project(k) → SGA backend’s grade projection; class backend no-op for rank-1 scalar/vector cases.
Bridge: lift(i) (rank-1 basis E\_{h,d,ℓ}), project(element) (rank-1 only) as models (reusing existing logic) .
Phase 5 — Wire Atlas API to Model Server
Keep current Atlas surface but route stdlib calls through the registry.
SGA exports remain available; internally they can delegate to compiled plans where equivalence is proven (same tensor-product law and kernels) .
Phase 6 — Migrate Every Operation “feature-by-feature”
Replace direct calls in higher layers with model invocations:

Transforms (transformR/transformD/transformT/transformM) → call their model counterparts (identical semantics/laws) .
Ring/byte ops → add96/sub96/mul96 models.
Grade utilities → project(k) model.
Lift/project → bridge models.
Keep SGA primitives intact for the SGA backend and for callers that require direct algebra.

Phase 7 — Tests & Invariants
Identity laws: R⁴, D³, T⁸, M²; pairwise commutations; mirror conjugations (now proven via compiled plans) .
Differential tests: class backend vs SGA backend for overlapping domains (rank-1).
Spec alignment: class index mapping and typed composition rules per formal spec §0–§4 .
Phase 8 — Tooling & CI
Cache compiled models; content-hash schemas + compiled params.
Benchmarks around add96/mul96 + transforms (class backend) and grade projection (SGA backend).
Lint/format and enforce schema validation in CI.
Phase 9 — Cleanups & Docs
Document: model schemas; compiled vs runtime params; complexity classes; compiler pipeline; backends; guarantees.
Inline module docs in stdlib directories map directly to formal spec clauses (composition, transforms, denotation) .
F) What “every operation is a model” means in practice
No bespoke algorithms in feature code. Ops are declared via JSON-Schema; the compiler rewrites/fuses; backends execute kernels (permutation fast path or SGA where grades are needed).
SGA is a model too (defined in the registry): when called directly, the registry compiles a plan and picks the correct backend; functional parity with current sga-element.ts multiply/add/scale is preserved (GP ⊗ Z₄ ⊗ Z₃) .
G) Guardrails
Deterministic rewrites (no e-graph blowups): fixed, terminating rule set matching spec’s transform calculus .
Prefer class backend unless IR requires grade semantics (e.g., project(k)); this keeps hot-path performance identical to current permutation behavior.
All group-algebra and transform identities remain validated by existing kernels and tests .
Sigmatics Model Spec (v0.4.0)

1. Scope & Sources (Normative)
   This specification defines the Sigmatics Model abstraction, its JSON-Schema contract, the intermediate representation (IR), the rewrite/normalization laws, fusion/complexity classes, lowering/backends, and the stdlib of models (ring ops, transforms, grade utilities, bridge). It preserves the formal Atlas semantics: class index, typed composition, and transform calculus; and the SGA foundation Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃] for correctness and higher-grade interpretation .

Ground truths this spec relies on (unchanged):

Authoritative class index mapping C : B⁸ → {0..95} and equality ≡₉₆ .
Composition: sequential ∘, parallel ⊗ with the usual associativity/units/commutativity (typed) .
Transforms R, T_k, M act by class permutations, preserve ≡₉₆, and satisfy the group laws (orders, commutations, conjugations) .
Dual denotations (literal bytes / operational words) and soundness conditions remain intact . 2. Model Abstraction
Everything is a Model. A model declares shape and constraints and is compiled to an executable plan.

2.1 Identity
A model is identified by:

name (string, e.g., "add96", "R", "SGA.project"),
version (semver, e.g., "1.0.0"),
namespace (e.g., "stdlib.ring", "stdlib.transforms", "stdlib.grade", "stdlib.bridge", "sga").
2.2 Parameters
compiled parameters: constants chosen at compile time (enable fusion; no runtime degrees).
runtime parameters: values supplied at invocation.
2.3 ComplexityClass
A discrete class indicating fusibility:

C0: fully compiled (no runtime degrees);
C1: few runtime degrees;
C2: bounded mixed-grade/shape;
C3: general case.
The compiler selects the lowest class consistent with the model’s compiled & runtime parameters.

3. Model JSON-Schema
   Each model M must provide a JSON-Schema that validates its configuration and call shape.

3.1 Descriptor Schema (normative)
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Sigmatics Model Descriptor",
  "type": "object",
  "required": ["name", "version", "namespace", "compiled", "runtime"],
  "properties": {
    "name": { "type": "string" },
    "version": { "type": "string", "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$" },
"namespace": { "type": "string" },

    "compiled": { "type": "object", "additionalProperties": true },
    "runtime":  { "type": "object", "additionalProperties": true },

    "constraints": {
      "type": "object",
      "properties": {
        "types": { "type": "array", "items": { "type": "string" } },
        "invariants": { "type": "array", "items": { "type": "string" } }
      },
      "additionalProperties": false
    },

    "complexityHint": { "type": "string", "enum": ["C0","C1","C2","C3"] },

    "loweringHints": {
      "type": "object",
      "properties": { "prefer": { "enum": ["class", "sga", "auto"] } },
      "additionalProperties": false
    }

}
}
Notes (binding to formal semantics):

When models reference class terms or sigils, the canonical σ=(h₂,d,ℓ) and transform actions must follow the formal specification (typed composition; transform distribution) . 4. Intermediate Representation (IR)
4.1 IR Atoms
Generator op: g@σ, where g ∈ {mark, copy, swap, merge, split, quote, evaluate} and σ=(h₂,d,ℓ) .
Class literal: c<i> (i in 0..95) and helpers lift(i), project(x) (bridge) consistent with rank-1 basis E*{h,d,ℓ} = r^h ⊗ e*ℓ ⊗ τ^d .
Selectors: project(k) for grade projection (Clifford) when the SGA backend is selected.
4.2 IR Composition
Sequential ∘ and parallel ⊗ with associativity/units/commutativity as in the formal algebra of combination (typed) .
4.3 IR Transforms
R, D, T_k, M tagged on any subterm; their actions are permutations (class semantics) and automorphisms (SGA semantics), with group relations R⁴=D³=T⁸=M², pairwise commutations, mirror conjugations .

4.4 IR Grammar (EBNF)
<sigil> ::= "c" <00..95> ["^" ("+"|"-") <k:int>] ["~"] ["@" <λ:int>]
<op> ::= ("mark"|"copy"|"swap"|"merge"|"split"|"quote"|"evaluate") "@" <sigil>
<term> ::= <op> | "(" <term> ")"
<seq> ::= <term> { "." <term> } // ∘
<par> ::= <seq> { "||" <seq> } // ⊗
<transform> ::= [ "R" ("+"|"-") <q:int> ] [ "T" ("+"|"-") <k:int> ] [ "~" ]
<phrase> ::= [ <transform> "@" ] <par>
(Adapted from the executable surface grammar) .

5. Rewrite & Normalization (Deterministic)
   A terminating, deterministic rewrite system yields a canonical form:

Push transforms to leaves: R, T_k, M distribute over ∘ and ⊗ (equivariant actions) .
Fold pure powers in ℝ[ℤ₄]/ℝ[ℤ₃]: r^i·r^j = r^{i+j mod 4}, τ^i·τ^j = τ^{i+j mod 3}; realized concretely as z4Multiply/z3Multiply or z4Power/z3Power when pure powers are detected .
Class invariants: transforms act by class permutations and preserve ≡₉₆ .
Canonical presentation: after pushing transforms and folding, atomic ops carry updated σ=(h₂,d,ℓ); formatting may pretty-print that canonical form (implementation note) . 6. Fusion & Complexity Classes
The compiler bakes compiled parameters and selects a ComplexityClass (C0..C3), enabling:

C0/C1: prefer class backend (rank-1 fast path; permutation semantics).
C2/C3: use SGA backend when grade operations or mixed-grade terms appear (Clifford grade projection, geometric product) .
Bridge contracts (unchanged): lift(i) produces a rank-1 basis E\_{h,d,ℓ}, and project(x) returns a class index iff x is rank-1; else null (or throws for projectStrict) .

7. Lowering & Backends
   7.1 Class Backend (Permutation)
   Ring ops: integer arithmetic modulo 96 for class indices.

Transforms:

R: left multiply by r (increment h₂) using ℝ[ℤ₄] power laws,
D: right multiply by τ (increment d) using ℝ[ℤ₃] power laws,
T_k: rotate ℓ on the 8-cycle (scalar ↔ e₁…e₇ ↔ scalar), as implemented by the T permutation on rank-1 elements,
M: mirror/invert modality (τ ↦ τ⁻¹) and reflect scope consistently. (See transforms module and group-algebra kernels) .
7.2 SGA Backend (Algebraic Foundation)
Evaluate models in SGA = Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃]:

Multiply/add/scale by tensoring the component-wise operations (geometricProduct, z4Multiply, z3Multiply, etc.) .
Grade involutions, reversion, conjugations on the Clifford component, untouched Z₄/Z₃ components .
Construct rank-1 basis and powers via createRank1Basis, z4Power, z3Power . 8. Stdlib Models (Normative Definitions)
Each stdlib op is declared as a model (schema name, compiled/runtime params) and lowered via the compiler.

8.1 Ring
add96

compiled: { overflowMode: "drop" | "track" }
runtime: { a: int(0..95), b: int(0..95) }
semantics: (a+b) mod 96, optional overflow token if (a+b) ≥ 96.
lowering: class backend (integer ops).
sub96, mul96: analogous (mul includes overflow token for (a·b)/96 if track).

8.2 Transforms
R

compiled: { k: int } (reduced mod 4); runtime: { x }.
semantics: R^k(x), quarter-turn rotation; order R⁴ = 1 .
lowering: z4Power(k) as left factor or direct class increment of h₂ .
D

compiled: { k: int } (reduced mod 3); runtime: { x }.
semantics: D^k(x); order D³ = 1 .
lowering: z3Power(k) on the right or direct class increment of d.
T

compiled: { k: int } (reduced mod 8); runtime: { x }.
semantics: rotate context ℓ on 8-cycle; order T⁸ = 1 .
lowering: ℓ-permutation on rank-1 (scalar and e₁…e₇) .
M

compiled: {}; runtime: { x }.
semantics: M(x); mirror relations MRM=R⁻¹, MDM=D⁻¹, MTM=T⁻¹ .
lowering: τ inversion for modality (τ → τ⁻¹) plus consistent scope reflection.
8.3 Grade Utilities
project(k)

compiled: { k: int }; runtime: { x }.
semantics: select the grade-k part of the Clifford component (identity on Z₄/Z₃).
lowering: SGA backend (Clifford grade projection).
8.4 Bridge
lift

compiled: {}; runtime: { classIndex: int(0..95) }.
semantics: E*{h,d,ℓ} = r^h ⊗ e*ℓ ⊗ τ^d decoded from class index .
project / projectStrict / isRank1

semantics: only rank-1 SGA elements map back to classes (scalar or single basis vector, pure powers in ℝ[ℤ₄], ℝ[ℤ₃]) . 9. Execution Semantics
9.1 Compile-Time
compile(modelDescriptor) returns a CompiledModel:

Validate JSON-Schema;
Build IR;
Apply rewrites (push transforms; fold pure powers) ;
Determine ComplexityClass and select backend plan;
Cache compiled artifact keyed by (name, version, compiledParams).
9.2 Run-Time
CompiledModel.run(runtimeParams) executes the backend plan:

Class backend: integer ops on classes; ℝ[ℤ₄]/ℝ[ℤ₃] powers for R/D; ℓ-permutation for T (rank-1) .
SGA backend: tensor product semantics for add/mul/scale; grade ops on Clifford; powers via z4Power/z3Power . 10. Soundness, Determinism, Safety
Soundness: class transforms are permutations that preserve ≡₉₆; well-typed composite terms preserve budgets; both byte and word interpreters are deterministic (unchanged) .
Transform identities & commutations: R⁴=D³=T⁸=M²; RD=DR, RT=TR, DT=TD; mirror conjugations — must continue to hold in compiled plans (validated by existing transform tests) .
Bridge diagrams: project(g_alg(lift(c))) === g_perm(c) remain valid (release-noted invariant) . 11. Versioning & Registry
Model Registry maps (name, version) → schema + compiler recipe.

Semver updates:

Patch: performance/bug-fix (no semantic change),
Minor: new compiled params or backend variants (compatible),
Major: semantic changes to model behavior.
Registry caches compiled plans (content-hash of schema + compiled params).

12. Conformance & Tests
    Algebraic laws: orders, commutations, conjugations for all 96 classes (as in v0.3.0: 1,344 diagram checks) must pass against compiled plans .
    Differential tests: for overlapping domains (rank-1), class backend and SGA backend results must agree.
    Bridge round-trip: project(lift(i)) === i for all i∈{0..95}.
    Performance: retain permutation fast-path behavior and lift/project latency characteristics (as documented) .
13. Appendix A — SGA Component Semantics (Reference)
    SGA = Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃], product is tensoring the component products; rank-1 basis E\_{h,d,ℓ}; SGA operations extend Clifford ops and group-algebra ops component-wise .
    ℝ[ℤ₄], ℝ[ℤ₃] implement identity/zero, power, add/scale/subtract, multiply (convolution), invert with pure-power fast paths (and linear-system fallback) .
14. Appendix B — Surface Grammar (for Parsers/Pretty-Printers)
    The user-facing expression grammar remains as in the formal spec’s Executable Surface Grammar; parsers/pretty-printers MUST produce canonicalized transform positions consistent with the rewrite system (transforms pushed to leaves) .

End of Sigmatics Model Spec (v0.4.0)
Sigmatics 0.4.0 — Acceptance Criteria & Definition of Done

1. Functional Acceptance Criteria
   A. Declarative model architecture in place
   A Model Server/Registry exists and is the only entry point for stdlib operations (ring, transforms, grade, bridge). All operations are declared via JSON-Schema, compiled to IR, rewritten, fused by complexity class, and lowered to a backend plan. No direct feature code calls SGA or permutation kernels without going through the model server/registry. (Three-layer baseline and invariants preserved: permutation fast path; SGA is algebraic ground truth)

Stdlib is complete as models: add96, sub96, mul96, R, D, T, M, project(k), and lift/project are all served via the registry and compiled to a backend plan. (Transform automorphisms, their orders and actions are unchanged)

Lowering policy is enforced: class backend for rank-1/class-pure paths; SGA backend when grade semantics are required (e.g., project(k) > grade-1). (SGA product is tensoring the component products)

B. Algebraic correctness & invariants
Orders & identities pass for all 96 classes: R⁴, D³, T⁸, M²; commutations and mirror conjugations continue to pass exactly as before. (1,344 diagram tests baseline)

Bridge commutation law preserved: for all transforms g ∈ {R,D,T,M} and all classes c, project(g_alg(lift(c))) === g_perm(c) (verified in the new compiled flow).

Group-algebra laws retained in lowering: pure-power folding and modular arithmetic in ℝ[ℤ₄]/ℝ[ℤ₃] remain correct.

C. No legacy paths / no fallbacks to non-Sigmatics fused ops
All feature-level code paths must go through the model server/registry and its compiler; there are no legacy evaluators or ad-hoc algorithmic shortcuts left in feature modules.
SGA primitives remain as backend implementation only (invoked by the SGA backend), not as a direct feature surface. (SGA tensor product law remains the same)
D. Performance parity (or better) for hot paths
Permutation fast path (class backend) is still the default for class-pure operations; there is no regression relative to 0.3.0; lift/project < 1 ms remains true. 2) Testing Expectations
A. Unit & property tests
Compiler unit tests for: schema validation, IR construction, rewrite normalization (push transforms to leaves; fold pure powers), fusion (complexity selection), and backend selection.

Stdlib model tests for each op:

add96/sub96/mul96: exhaustive tests for inputs 0..95 (mod 96, overflow where applicable).
Transforms R/D/T/M: per-order identities and action correctness on all 96 classes.
project(k): correct grade projection vs. direct SGA call for representative multivectors.
B. Algebraic/diagram tests
Re-run the full identity & diagram suite and keep counts at least equal to v0.3.0: 1,344 diagram tests plus per-order/commutation/conjugation suites; all must pass.
C. Differential tests (backend agreement)
For the overlapping domain (rank-1/class-pure), class backend vs. SGA backend results must agree to within numeric tolerance where relevant (Clifford floating-point EPSILON checks already in code).
D. Bridge round-trip
For all i ∈ {0..95}, project(lift(i)) === i under the compiled flow. (Regression guard).
E. Coverage thresholds
Minimum coverage (statements/branches/functions/lines): 90% across model/, compiler/, stdlib/, and backends/.
All tests green on CI with tsc --noEmit type checks and the full test matrix. 3) Linting & Formatting Expectations (for the pushed commit)
TypeScript strictness: code compiles with tsc --noEmit and no any in public surfaces of model/, compiler/, stdlib/, and backends/.

ESLint: repository ESLint config passes with 0 errors and 0 warnings across changed/added files (including rule sets for imports, unused vars/exports, and complexity).

Unused code (exports, functions, dead branches) is removed or flagged as an error (no ts-prune/unused exports left).
Prettier: formatting must match repo Prettier settings (consistent quotes, semicolons, width, import sort).

Commit must include updated or new type defs for the public APIs changed (e.g., CompiledModel, ModelRegistry), and all files adhere to lint/format hooks.

4. Code Hygiene & Removal of Dead Code
   Dead code eliminated:

No unreachable branches, no unused exports, no stale adapters.
Legacy evaluators and feature-level bypasses to SGA or permutation code removed; the only permissible direct usage of those primitives is inside backends.
No deprecated flags or runtime fallbacks to pre-compiler paths. If a capability is needed, it must be expressed as a model and compiled.

5. Documentation & Developer Experience
   Spec & Dev Docs updated:

Model Spec (JSON-Schema contract, compiled/runtime params, complexity classes).
Compiler pipeline (IR, rewrites, fusion, lowering).
Backends (class vs. SGA) and selection rules.
Stdlib catalogue: exact parameters and semantics of each model (ring ops, transforms, grade, bridge), referencing transform orders and actions.
Examples: minimal code samples showing compile() and run() through the registry for each stdlib op.

6. Definition of Done (DoD)
   A commit is Done when all of the following are true:

Architecture

Model server/registry, compiler (IR/rewrites/fuser), and both backends (class, SGA) are present and wired; stdlib ops are only invokable via the registry.
Functionality

All stdlib operations listed above work via compiled plans; backend selection obeys complexity rules; SGA is only reached through the SGA backend.
Correctness

All algebraic identities and 1,344 commutative diagram tests pass; bridge commutation law still holds; rank-1 differential tests agree between backends.
Performance

No regression on permutation fast paths; lift/project latency unchanged from 0.3.0 baselines.
Quality bar

Type-check clean (tsc --noEmit), ESLint clean (0 warnings), Prettier formatted.
Tests green with ≥90% coverage on all new/changed packages.
Hygiene

Dead code removed; no legacy or fallback paths to non-Sigmatics fused operations remain outside the backend layer.
Docs

Model Spec and developer docs updated and co-located with code; examples compile and run.
When every item above is satisfied in the committed state pushed to the remote, the refactor for Sigmatics 0.4.0 is accepted as complete.
