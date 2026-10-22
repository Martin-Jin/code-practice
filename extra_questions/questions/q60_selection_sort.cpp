// ============================================================================
// Question 60  (5 marks)  -  Selection sort with comparison count
// Topic: Sorting algorithms
//
// Requirements for Selection sort
//
// Implement int SelectionSort(vector<int>& a). It sorts `a` into ascending
// order in place using selection sort:
//   1. For i = 0 to N-2, set minIdx = i.
//   2. Scan j = i+1 to N-1; if a[j] < a[minIdx], set minIdx = j.
//   3. After the scan, swap a[i] and a[minIdx].
//
// The function returns the number of key comparisons (a[j] < a[minIdx]) it
// made. Selection sort is not adaptive, so the count is N(N-1)/2 whatever the
// input order (0 when N <= 1).
//
// You MUST swap using the provided Swap(int&, int&), which counts swaps. Call
// it exactly once per pass (even when minIdx == i), giving N-1 swaps in total.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q60 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int swap_count = 0;

void Swap(int& x, int& y) {
  ++swap_count;
  int t = x;
  x = y;
  y = t;
}

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
int SelectionSort(vector<int>& a) {
  // TODO: sort a with selection sort and return the number of comparisons.
  return 0;
}
#else
#include "../solutions/q60.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static void Check(vector<int> a, const vector<int>& sorted, int comparisons,
                  int swaps) {
  swap_count = 0;
  int c = SelectionSort(a);
  tf::ExpectEq(tf::VecStr(a), tf::VecStr(sorted), "array after sort");
  tf::ExpectEq(c, comparisons, "comparisons");
  tf::ExpectEq(swap_count, swaps, "swaps via Swap()");
}

void RunQ60() {
  tf::Test("note's example {45,12,81,6,30}",
           [] { Check({45, 12, 81, 6, 30}, {6, 12, 30, 45, 81}, 10, 4); });

  tf::Test("already sorted costs the same",
           [] { Check({1, 2, 3, 4, 5}, {1, 2, 3, 4, 5}, 10, 4); });

  tf::Test("reverse sorted", [] { Check({5, 4, 3, 2, 1}, {1, 2, 3, 4, 5}, 10, 4); });

  tf::Test("duplicates", [] { Check({3, 1, 3, 1}, {1, 1, 3, 3}, 6, 3); });

  tf::HiddenTest("empty and single element", [] {
    Check({}, {}, 0, 0);
    Check({9}, {9}, 0, 0);
  });

  tf::HiddenTest("two elements", [] { Check({2, 1}, {1, 2}, 1, 1); });

  tf::HiddenTest("ten elements: 45 comparisons", [] {
    Check({9, 3, 7, 1, 10, 4, 8, 2, 6, 5}, {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}, 45, 9);
  });
}

}  // namespace q60

REGISTER_QUESTION(60, "Selection sort with comparison count", q60::RunQ60);
