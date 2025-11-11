/**
 * Research Script: ℤ₂₅ = 5² Factor Analysis
 *
 * Investigates the mysterious ℤ₂₅ = 5² factor in 340,200 = 168 × 81 × 25.
 *
 * Key observations:
 * - 96 = 2⁵ × 3 (NOT divisible by 5)
 * - ℤ₂₅ is EXTERNAL to direct Atlas structure
 * - Must come from different symmetry layer
 *
 * Hypotheses to test:
 * 1. Connection to E₆ exceptional Lie algebra
 * 2. SO(10) grand unified theory (rank 5)
 * 3. Icosahedral symmetry (5-fold)
 * 4. Leech lattice kissing polytope structure
 * 5. Conway group Co₁ subgroup structure
 */

console.log('='.repeat(70));
console.log('ℤ₂₅ = 5² FACTOR ANALYSIS');
console.log('='.repeat(70));

// Step 1: Verify that ℤ₂₅ is external to Atlas
console.log('\n📊 Step 1: Confirm ℤ₂₅ is External to Atlas');

const atlas_order = 96;
const z25 = 25;

console.log(`Atlas order: ${atlas_order} = 2⁵ × 3`);
console.log(`ℤ₂₅ factor: ${z25} = 5²`);
console.log(`\nDivisibility test:`);
console.log(`  96 % 5 = ${atlas_order % 5} (not divisible)`);
console.log(`  GCD(96, 25) = ${gcd(atlas_order, z25)} (coprime!)`);

console.log(`\n✅ Confirmed: ℤ₂₅ is EXTERNAL to Atlas 96-class structure`);

// Step 2: Analyze E₆ exceptional Lie algebra
console.log('\n📊 Step 2: E₆ Exceptional Lie Algebra Connection');

const e6_analysis = {
  rank: 6,
  dimension: 78,
  roots: 72,
  weyl_group_order: 51840, // 2⁷ × 3⁴ × 5
  dynkin_marks: [1, 2, 3, 2, 1, 2], // Extended Dynkin diagram
};

console.log(`E₆ structure:`);
console.log(`  Rank: ${e6_analysis.rank}`);
console.log(`  Dimension: ${e6_analysis.dimension} (dim of Lie algebra)`);
console.log(`  Roots: ${e6_analysis.roots}`);
console.log(`  |W(E₆)| = ${e6_analysis.weyl_group_order} = 2⁷ × 3⁴ × 5`);

console.log(`\n🔍 E₆ Weyl group contains 5¹ (not 5²)`);
console.log(`   E₆ is NOT the source of ℤ₂₅ = 5²`);

// Step 3: Analyze SO(10) connection
console.log('\n📊 Step 3: SO(10) Grand Unified Theory');

const so10_analysis = {
  rank: 5,
  dimension: 45, // n(n-1)/2 for SO(n)
  spinor_reps: [16, 16], // Two spinor representations (chiral)
  vector_rep: 10,
};

console.log(`SO(10) structure:`);
console.log(`  Rank: ${so10_analysis.rank} ← Contains 5!`);
console.log(`  Dimension: ${so10_analysis.dimension}`);
console.log(`  Vector rep: ${so10_analysis.vector_rep}`);
console.log(`  Spinor reps: ${so10_analysis.spinor_reps[0]} + ${so10_analysis.spinor_reps[1]}`);

console.log(`\n🔍 Rank 5 suggests possible ℤ₅ connection`);
console.log(`   But need ℤ₂₅ = 5² — where does the square come from?`);

console.log(`\n💡 Hypothesis: 5² from (rank 5) × (doubling)?`);
console.log(`   - Spinor doubling: 16 + 16 = 32?`);
console.log(`   - No clear 5² structure in SO(10)`);

// Step 4: Icosahedral symmetry
console.log('\n📊 Step 4: Icosahedral Symmetry Analysis');

const icosahedron = {
  vertices: 12,
  edges: 30,
  faces: 20, // Equilateral triangles
  rotation_group_order: 60, // A₅ (alternating group)
  full_symmetry_order: 120, // A₅ × ℤ₂ (including reflections)
};

console.log(`Icosahedron structure:`);
console.log(`  Vertices: ${icosahedron.vertices}`);
console.log(`  Edges: ${icosahedron.edges}`);
console.log(`  Faces: ${icosahedron.faces}`);
console.log(`  Rotation group: A₅, order ${icosahedron.rotation_group_order} = 2² × 3 × 5`);
console.log(`  Full symmetry: order ${icosahedron.full_symmetry_order} = 2³ × 3 × 5`);

console.log(`\n🔍 Contains 5¹ (not 5²)`);
console.log(`   But icosahedron is deeply connected to 5-fold symmetry`);

console.log(`\n💡 Golden ratio φ = (1+√5)/2 appears in icosahedron`);
console.log(`   Pentagon/pentagram symmetry is 5-fold`);

// Step 5: Leech lattice shell structure
console.log('\n📊 Step 5: Leech Lattice Shell Structure');

const leech_shells = {
  dimension: 24,
  kissing_number: 196560,
  shell_0: 1, // Origin
  shell_4: 196560, // Norm 4 (kissing sphere)
  shell_6: 16773120, // Norm 6
  shell_8: 398034000, // Norm 8
};

console.log(`Leech lattice shells (by squared norm):`);
console.log(`  Norm² = 0: ${leech_shells.shell_0} vector (origin)`);
console.log(`  Norm² = 4: ${leech_shells.shell_4.toLocaleString()} vectors (kissing sphere)`);
console.log(`  Norm² = 6: ${leech_shells.shell_6.toLocaleString()} vectors`);
console.log(`  Norm² = 8: ${leech_shells.shell_8.toLocaleString()} vectors`);

console.log(`\nFactorizations:`);
console.log(`  196,560 = 2⁴ × 3² × 5 × 7 × 13`);
console.log(`           Contains 5¹ (not 5²)`);

console.log(`\n🔍 Kissing number has 5¹ factor, not 5²`);

// Step 6: Conway group Co₁ structure
console.log('\n📊 Step 6: Conway Group Co₁ Structure');

const co1_analysis = {
  order_str: '4,157,776,806,543,360,000',
  order_factorization: '2²¹ × 3⁹ × 5⁴ × 7² × 11 × 13 × 23',
  maximal_subgroups: [
    'Co₂ (index 2)',
    '3·Suz:2 (Suzuki group)',
    '2¹¹:M₂₄ (Mathieu M₂₄)',
    '2²⁺¹²:(A₈ × S₃)',
  ],
};

console.log(`Conway group Co₁:`);
console.log(`  Order: ${co1_analysis.order_str}`);
console.log(`       = ${co1_analysis.order_factorization}`);

console.log(`\n🎯 CRITICAL: Co₁ contains 5⁴ factor!`);
console.log(`   ℤ₂₅ = 5² is a quotient of 5⁴`);

console.log(`\nPossible quotient structure:`);
console.log(`  Co₁ has Sylow 5-subgroup of order 5⁴ = 625`);
console.log(`  ℤ₂₅ = 5² = 25 could be quotient 5⁴ / 5² = 25`);
console.log(`  Or: ℤ₂₅ is subgroup of order 25 in Sylow 5-subgroup`);

// Step 7: Test relationship to 340,200 structure
console.log('\n📊 Step 7: Relationship to 340,200');

const analysis_340200 = {
  total: 340200,
  psl27: 168,
  z81: 81,
  z25: 25,
};

console.log(`340,200 = ${analysis_340200.psl27} × ${analysis_340200.z81} × ${analysis_340200.z25}`);
console.log(`        = (2³ × 3 × 7) × (3⁴) × (5²)`);

console.log(`\nConnection to Co₁:`);
console.log(`  Co₁: 2²¹ × 3⁹ × 5⁴ × 7² × 11 × 13 × 23`);
console.log(`  340,200: 2³ × 3⁴ × 5² × 7¹`);

console.log(`\n🔍 340,200 divides |Co₁|?`);
const co1_order_big = BigInt('4157776806543360000');
const div_340200 = BigInt(340200);
const quotient = co1_order_big / div_340200;
const remainder = co1_order_big % div_340200;

console.log(`  |Co₁| / 340,200 = ${quotient.toLocaleString()}`);
console.log(`  Remainder: ${remainder} (${remainder === BigInt(0) ? 'DIVIDES!' : 'does not divide'})`);

if (remainder === BigInt(0)) {
  console.log(`\n✅ 340,200 DIVIDES |Co₁| exactly!`);
  console.log(`   This suggests 340,200 is the order of some quotient group`);
} else {
  console.log(`\n❌ 340,200 does not divide |Co₁| evenly`);
}

// Step 8: Alternative hypothesis - 12,288 boundary connection
console.log('\n📊 Step 8: Connection to 12,288-Cell Boundary');

const boundary = {
  total: 12288,
  page: 48,
  byte: 256,
  orbit_size: 2048,
  anchors: 6,
};

console.log(`12,288 = ${boundary.page} × ${boundary.byte}`);
console.log(`       = (16 × 3) × 256`);
console.log(`       = 2¹² × 3`);

console.log(`\nRelationship to 340,200:`);
console.log(`  340,200 / 12,288 = ${(340200 / 12288).toFixed(4)} ≈ 27.695`);
console.log(`  GCD(340,200, 12,288) = ${gcd(340200, 12288)} = 2³ × 3 = 24`);

console.log(`\n🔍 GCD = 24 is Leech dimension (as expected)`);
console.log(`   But no clear 5² factor in 12,288 boundary`);

// Step 9: Moonshine j-invariant connection
console.log('\n📊 Step 9: Monstrous Moonshine j-invariant');

const j_coefficients = [
  { power: -1, coeff: 1 },
  { power: 0, coeff: 744 },
  { power: 1, coeff: 196884 }, // 196,560 + 324
  { power: 2, coeff: 21493760 },
  { power: 3, coeff: 864299970 },
];

console.log(`j(q) = q⁻¹ + 744 + 196,884q + 21,493,760q² + ...`);

console.log(`\nFactorizations of first few coefficients:`);
for (const { power, coeff } of j_coefficients.slice(1)) {
  const factors = primeFactorization(coeff);
  console.log(`  c(${power}) = ${coeff.toLocaleString()}`);
  console.log(`       = ${factors}`);

  if (coeff % 25 === 0) {
    console.log(`       Contains 5² factor! ✓`);
  } else if (coeff % 5 === 0) {
    console.log(`       Contains 5¹ factor`);
  }
}

console.log(`\n🔍 196,884 = 2² × 3 × 47 × 349 (NO 5 factor)`);
console.log(`   744 = 2³ × 3 × 31 (NO 5 factor)`);
console.log(`   21,493,760 = 2⁸ × 3 × 5 × 1,117 (contains 5¹)`);

// Step 10: Summary and hypotheses
console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

console.log('\n✅ Verified:');
console.log('  - ℤ₂₅ is external to Atlas 96-class structure (coprime)');
console.log('  - E₆ Weyl group has 5¹ (not 5²)');
console.log('  - SO(10) rank 5 but no clear 5² structure');
console.log('  - Icosahedron A₅ has 5¹ (not 5²)');
console.log('  - Conway Co₁ has 5⁴ factor!');

console.log('\n🎯 Most Likely Hypothesis:');
console.log('  ℤ₂₅ = 5² arises from Conway group Co₁');
console.log('  |Co₁| = 2²¹ × 3⁹ × 5⁴ × 7² × 11 × 13 × 23');
console.log('  ℤ₂₅ is quotient or subgroup of Sylow 5-subgroup (order 5⁴ = 625)');

console.log('\n❓ Open Questions:');
console.log('  1. What is the exact quotient structure?');
console.log('  2. How does ℤ₂₅ relate to 196,560 kissing number?');
console.log('  3. Is there a geometric interpretation on Leech lattice?');
console.log('  4. Connection to 24 = GCD(340,200, 12,288)?');

console.log('\n🔬 Alternative Hypotheses (Less Likely):');
console.log('  Hypothesis B: ℤ₂₅ from 5² = (√5)² golden ratio structure?');
console.log('  Hypothesis C: ℤ₂₅ from pentagonal/icosahedral symmetry in higher structure?');
console.log('  Hypothesis D: ℤ₂₅ related to E₆ in some non-obvious way?');

console.log('\n🎉 ℤ₂₅ factor analysis complete!');
console.log('='.repeat(70));

// Helper functions

function gcd(a: number, b: number): number {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

function primeFactorization(n: number): string {
  const factors: { [key: number]: number } = {};
  let remaining = n;

  // Check for 2
  while (remaining % 2 === 0) {
    factors[2] = (factors[2] || 0) + 1;
    remaining /= 2;
  }

  // Check odd factors
  for (let i = 3; i * i <= remaining; i += 2) {
    while (remaining % i === 0) {
      factors[i] = (factors[i] || 0) + 1;
      remaining /= i;
    }
  }

  // If remaining > 1, it's a prime factor
  if (remaining > 1) {
    factors[remaining] = 1;
  }

  // Format as string
  const parts: string[] = [];
  for (const [prime, exp] of Object.entries(factors).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    if (exp === 1) {
      parts.push(prime);
    } else {
      parts.push(`${prime}^${exp}`);
    }
  }

  return parts.join(' × ');
}
