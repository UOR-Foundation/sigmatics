/**
 * Sigmatics Geometric Algebra (SGA)
 *
 * This module provides the complete algebraic foundation for Sigmatics:
 *
 *   SGA = Cl₀,₇ ⊗ ℝ[ℤ₄] ⊗ ℝ[ℤ₃]
 *
 * The SGA serves as the formal foundation beneath the 96-class permutation
 * system, enabling:
 *
 * - Verification of transform correctness via commutative diagrams
 * - Extension to higher-grade elements (bivectors, trivectors)
 * - Geometric semantics via the octonion channel
 * - Complete algebraic automorphism implementations of R/D/T/M
 *
 * @module sga
 */

// Types
export type { SgaElement, Cl07Element, Z4Element, Z3Element, Rank1Basis, Blade } from './types';

export { EPSILON } from './types';

// Clifford Algebra
export {
  createCliffordElement,
  cliffordIdentity,
  cliffordZero,
  basisVector,
  scalar,
  scalarPart,
  geometricProduct,
  cliffordAdd,
  cliffordSubtract,
  cliffordScale,
  cliffordNegate,
  gradeProject,
  gradeInvolution,
  reversion,
  cliffordConjugation,
  cliffordEqual,
  innerProduct as cliffordInnerProduct,
  vectorPart,
  countBasisVectors,
} from './clifford';

// Group Algebras
export {
  // ℝ[ℤ₄]
  z4Identity,
  z4Zero,
  z4Generator,
  z4Power,
  z4Multiply,
  z4Add,
  z4Subtract,
  z4Scale,
  z4Invert,
  extractZ4Power,
  z4Equal,
  // ℝ[ℤ₃]
  z3Identity,
  z3Zero,
  z3Generator,
  z3Power,
  z3Multiply,
  z3Add,
  z3Subtract,
  z3Scale,
  z3Invert,
  extractZ3Power,
  z3Equal,
} from './group-algebras';

// SGA Elements
export {
  createSgaElement,
  sgaIdentity,
  sgaZero,
  createRank1Basis,
  createRank1BasisFromCoords,
  sgaMultiply,
  sgaAdd,
  sgaScale,
  sgaEqual,
  sgaGradeInvolution,
  sgaReversion,
  sgaCliffordConjugation,
  sgaPower,
  sgaIsZero,
  sgaIsIdentity,
  sgaToString,
} from './sga-element';

// Transforms
export {
  transformR,
  transformRPower,
  transformD,
  transformDPower,
  transformT,
  transformTPower,
  transformM,
  verifyR4Identity,
  verifyD3Identity,
  verifyT8Identity,
  verifyM2Identity,
} from './transforms';

// Fano Plane
export {
  FANO_LINES,
  crossProductTable,
  crossProduct,
  verifyFanoPlane,
  getLinesContaining,
  isFanoLine,
} from './fano';

// Octonion Channel
export {
  innerProduct as octonionInnerProduct,
  vectorCrossProduct,
  cayleyProduct,
  octonionConjugate,
  octonionNormSquared,
  octonionNorm,
  verifyAlternativity,
  verifyNormMultiplicativity,
  randomOctonion,
} from './octonion';

// Leech Lattice
export type { LeechVector, LeechPoint, AtlasToLeechMap } from './leech';
export {
  atlasClassToLeech,
  leechToAtlasClass,
  leechNorm,
  leechInnerProduct,
  leechAdd,
  leechSubtract,
  leechScale,
  constructAtlasToLeechMap,
  isInLeech,
  leechMinimalNorm,
  LEECH_DIMENSION,
  LEECH_KISSING_NUMBER,
  LEECH_MINIMAL_NORM,
  GRIESS_DIMENSION,
  GRIESS_CORRECTION,
} from './leech';

// Conway Group
export type { ConwayMatrix, ConwayOperation } from './conway';
export {
  conwayIdentity,
  conwayApply,
  conwayCompose,
  conwayDeterminant,
  atlasR_toConway,
  atlasD_toConway,
  atlasT_toConway,
  atlasM_toConway,
  isConwayElement,
  generateAtlasConwayGenerators,
  computeAtlasConwaySubgroup,
  CONWAY_GROUP_ORDER,
  CONWAY_GROUP_FACTORIZATION,
} from './conway';

// E₈ Root System
export type { E8Root, E8RootInfo, E8Point } from './e8';
export {
  e8Norm,
  e8InnerProduct,
  e8Add,
  e8Scale,
  generateE8Roots,
  verifyE8RootSystem,
  isE8Root,
  generateE8SimpleRoots,
  computeE8CartanMatrix,
  weylReflection,
  isInE8Lattice,
  E8_DIMENSION,
  E8_ROOT_COUNT,
  E8_ROOT_NORM,
  E8_WEYL_GROUP_ORDER,
} from './e8';

// E₈³ (E₈ ⊕ E₈ ⊕ E₈)
export type { E8TripleVector, E8TripleStructured } from './e8-triple';
export {
  createE8Triple,
  decomposeE8Triple,
  e8TripleNorm,
  isE8TripleRoot,
  generateE8TripleRoots,
  applyTriality,
  e8TripleToLeech,
  verifyLeechRootlessProperty,
  atlasClassToE8Triple,
  verifyAtlasE8LeechChain,
  E8_TRIPLE_DIMENSION,
  E8_TRIPLE_ROOT_COUNT,
  E8_TRIPLE_BLOCKS,
} from './e8-triple';
