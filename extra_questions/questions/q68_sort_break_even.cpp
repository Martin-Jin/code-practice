// ============================================================================
// Question 68  (3 marks)  -  Sorting versus repeated linear search
// Topic: Sorting algorithms
//
// Requirements for MinLookupsToSortFirst
//
// Searching N keys with a linear scan costs at most N comparisons per lookup.
// Alternatively, sort once with merge sort (at most N*log2(N) comparisons)
// and then use binary search (at most 1 + log2(N) comparisons per lookup).
//
// Implement int MinLookupsToSortFirst(int N), where N is a power of two with
// N >= 2. It returns the smallest integer k (number of lookups) for which
//
//     N*k  >  N*log2(N) + k*(1 + log2(N))
//
// i.e. the first k where sorting first costs fewer comparisons in the worst
// case. If no k ever satisfies this, return -1.
//
// Example: N = 1024 gives 1024k > 10240 + 11k, so k > 10.1 and the answer is
// 11.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q68 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// (nothing provided: write the whole function)

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
int MinLookupsToSortFirst(int N) {
  // TODO: smallest k with N*k > N*log2(N) + k*(1 + log2(N)), or -1.
  return 0;
}
#else
#include "../solutions/q68.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ68() {
  tf::Test("N = 1024 (note's example)",
           [] { tf::ExpectEq(MinLookupsToSortFirst(1024), 11, "k for N=1024"); });

  tf::Test("N = 16", [] { tf::ExpectEq(MinLookupsToSortFirst(16), 6, "k for N=16"); });

  tf::Test("N = 8", [] { tf::ExpectEq(MinLookupsToSortFirst(8), 7, "k for N=8"); });

  tf::Test("N = 4", [] { tf::ExpectEq(MinLookupsToSortFirst(4), 9, "k for N=4"); });

  tf::HiddenTest("N = 2: sorting never pays off",
                 [] { tf::ExpectEq(MinLookupsToSortFirst(2), -1, "k for N=2"); });

  tf::HiddenTest("N = 32 and 64", [] {
    tf::ExpectEq(MinLookupsToSortFirst(32), 7, "k for N=32");
    tf::ExpectEq(MinLookupsToSortFirst(64), 7, "k for N=64");
  });

  tf::HiddenTest("large N = 2^20 (beware int overflow)",
                 [] { tf::ExpectEq(MinLookupsToSortFirst(1 << 20), 21, "k for N=2^20"); });
}

}  // namespace q68

REGISTER_QUESTION(68, "Sorting versus repeated linear search", q68::RunQ68);
