// ============================================================================
// Question 65  (5 marks)  -  Quicksort partition (Lomuto)
// Topic: Sorting algorithms
//
// Requirements for PartitionSpan
//
// Implement int PartitionSpan(vector<int>& a, int L, int R) for the span
// a[L..R] (inclusive, L <= R), using the last element as the pivot:
//   1. pivot = a[R]; boundary i = L.
//   2. Sweep j from L to R-1. Whenever a[j] <= pivot, swap a[i] and a[j]
//      and then ++i.
//   3. Swap a[i] and a[R] so the pivot lands in its final position.
//   4. Return i (the pivot's final index).
//
// Afterwards everything left of the returned index is <= pivot and everything
// right of it is > pivot. Elements outside L..R must not change.
//
// Example: {45, 12, 81, 6, 30} with L=0, R=4 becomes {12, 6, 30, 45, 81} and
// the function returns 2.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q65 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// (nothing provided: write the whole function)

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
int PartitionSpan(vector<int>& a, int L, int R) {
  // TODO: partition a[L..R] around the pivot a[R] and return its final index.
  return L;
}
#else
#include "../solutions/q65.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static void Check(vector<int> a, int L, int R, const vector<int>& expected, int index) {
  int p = PartitionSpan(a, L, R);
  tf::ExpectEq(tf::VecStr(a), tf::VecStr(expected), "array after partition");
  tf::ExpectEq(p, index, "returned pivot index");
}

void RunQ65() {
  tf::Test("note's first partition {45,12,81,6,30}",
           [] { Check({45, 12, 81, 6, 30}, 0, 4, {12, 6, 30, 45, 81}, 2); });

  tf::Test("already sorted: pivot stays last",
           [] { Check({1, 2, 3, 4, 5}, 0, 4, {1, 2, 3, 4, 5}, 4); });

  tf::Test("all equal: every element <= pivot",
           [] { Check({7, 7, 7, 7}, 0, 3, {7, 7, 7, 7}, 3); });

  tf::Test("two elements", [] { Check({2, 1}, 0, 1, {1, 2}, 0); });

  tf::HiddenTest("sub-span only: outside elements untouched",
                 [] { Check({9, 8, 3, 1, 2, 9, 9}, 2, 4, {9, 8, 1, 2, 3, 9, 9}, 3); });

  tf::HiddenTest("pivot is the smallest: lands at L",
                 [] { Check({5, 4, 3, 1}, 0, 3, {1, 4, 3, 5}, 0); });

  tf::HiddenTest("single element span", [] { Check({4, 2, 6}, 1, 1, {4, 2, 6}, 1); });
}

}  // namespace q65

REGISTER_QUESTION(65, "Quicksort partition (Lomuto)", q65::RunQ65);
