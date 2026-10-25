// ============================================================================
// Question 46  (4 marks)  -  Knuth's Algorithm M: FindMax()
// Topic: Algorithms and search
//
// Requirements for Knuth's Algorithm M: FindMax()
//
// Algorithm M (Find the maximum). Given n elements a[1], a[2], ..., a[n],
// find m and j such that m = a[j] = max(a[1..n]), where j is the largest
// index that achieves the maximum.
//   M1. [Initialise.]  Set j <- n, k <- n - 1, m <- a[n].
//   M2. [All tested?]  If k = 0, the algorithm terminates.
//   M3. [Compare.]     If a[k] <= m, go to M5.
//   M4. [Change m.]    Set m <- a[k], j <- k. (m is the current maximum.)
//   M5. [Decrease k.]  Decrease k by 1, and return to M2.   [end]
//
// Task
// Translate Algorithm M into C++ (the vector is 0-indexed, so a[1] is a[0]):
//   int FindMax(const vector<int>& a, int& index, int& comparisons)
// It returns the maximum value and sets `index` to the 0-based index of the
// LAST occurrence of that maximum. `comparisons` is set to the number of times
// step M3 is executed. For an empty vector return -1, set index to -1 and
// comparisons to 0.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q46 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int FindMax(const vector<int>& a, int& index, int& comparisons);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int FindMax(const vector<int>& a, int& index, int& comparisons) {
  // Your implementation here
  index = -1;
  comparisons = 0;
  return -1;
}
#else
#include "../solutions/q46.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
static void Check(const vector<int>& a, int want_max, int want_index, int want_cmp) {
  int index = -99, cmp = -99;
  int m = FindMax(a, index, cmp);
  tf::ExpectEq(m, want_max, "max " + tf::VecStr(a));
  tf::ExpectEq(index, want_index, "index " + tf::VecStr(a));
  tf::ExpectEq(cmp, want_cmp, "comparisons " + tf::VecStr(a));
}

void RunQ46() {
  tf::Test("maximum in the middle", [] { Check({3, 9, 4, 1}, 9, 1, 3); });
  tf::Test("maximum at the first position", [] { Check({10, 2, 5}, 10, 0, 2); });
  tf::Test("maximum at the last position", [] { Check({1, 2, 3, 4, 5}, 5, 4, 4); });
  tf::Test("single element needs no comparisons", [] { Check({7}, 7, 0, 0); });

  tf::HiddenTest("empty vector", [] { Check({}, -1, -1, 0); });
  tf::HiddenTest("all negative values", [] { Check({-5, -2, -9}, -2, 1, 2); });
  tf::HiddenTest("ties report the last occurrence", [] {
    Check({4, 8, 1, 8, 3}, 8, 3, 4);
    Check({6, 6, 6}, 6, 2, 2);
  });
}

}  // namespace q46

REGISTER_QUESTION(46, "Knuth's Algorithm M: FindMax()", q46::RunQ46);
