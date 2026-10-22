// ============================================================================
// Question 69  (4 marks)  -  Counting inversions
// Topic: Sorting algorithms
//
// Requirements for CountInversions
//
// An inversion is a pair of positions i < j with a[i] > a[j]. The number of
// inversions measures how far an array is from sorted, and it equals the
// number of element shifts insertion sort performs on that array (which is why
// insertion sort is fast on nearly sorted data).
//
// Implement int CountInversions(const vector<int>& a). It returns the number
// of inversions in `a` without modifying it. Equal values are not inversions.
// An O(N^2) solution is fine.
//
// Examples: {45, 12, 81, 6, 30} has 6 inversions (45>12, 45>6, 45>30, 12>6,
// 81>6, 81>30). A sorted array has 0; a reverse-sorted array of N distinct
// values has N(N-1)/2.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q69 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// (nothing provided: write the whole function)

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
int CountInversions(const vector<int>& a) {
  // TODO: count pairs i < j with a[i] > a[j].
  return -1;
}
#else
#include "../solutions/q69.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ69() {
  tf::Test("note's example {45,12,81,6,30}", [] {
    tf::ExpectEq(CountInversions({45, 12, 81, 6, 30}), 6, "inversions");
  });

  tf::Test("sorted array has none",
           [] { tf::ExpectEq(CountInversions({1, 2, 3, 4, 5}), 0, "inversions"); });

  tf::Test("reverse sorted: N(N-1)/2",
           [] { tf::ExpectEq(CountInversions({6, 5, 4, 3, 2, 1}), 15, "inversions"); });

  tf::Test("two elements swapped",
           [] { tf::ExpectEq(CountInversions({2, 1}), 1, "inversions"); });

  tf::HiddenTest("empty and single element", [] {
    tf::ExpectEq(CountInversions({}), 0, "empty");
    tf::ExpectEq(CountInversions({3}), 0, "single");
  });

  tf::HiddenTest("duplicates are not inversions", [] {
    tf::ExpectEq(CountInversions({2, 2, 2}), 0, "all equal");
    tf::ExpectEq(CountInversions({3, 1, 2, 1}), 4, "{3,1,2,1}");
  });

  tf::HiddenTest("input is not modified", [] {
    vector<int> a = {3, 2, 1};
    tf::ExpectEq(CountInversions(a), 3, "inversions");
    tf::ExpectEq(tf::VecStr(a), tf::VecStr(vector<int>{3, 2, 1}), "input array");
  });
}

}  // namespace q69

REGISTER_QUESTION(69, "Counting inversions", q69::RunQ69);
