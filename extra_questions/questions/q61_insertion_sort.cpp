// ============================================================================
// Question 61  (5 marks)  -  Insertion sort with comparison count
// Topic: Sorting algorithms
//
// Requirements for Insertion sort
//
// Implement int InsertionSort(vector<int>& a). It sorts `a` into ascending
// order in place using insertion sort:
//   1. For i = 1 to N-1, save key = a[i] and set j = i - 1.
//   2. While j >= 0 and a[j] > key: copy a[j] to a[j+1], then --j.
//   3. Write key into a[j+1].
//
// The function returns the number of times the comparison a[j] > key was
// evaluated (check j >= 0 first; a test that is skipped because j < 0 is not
// a comparison). For {45, 12, 81, 6, 30} this is 8. Sorted input costs N-1
// comparisons; reverse-sorted input costs N(N-1)/2.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q61 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// (nothing provided: write the whole function)

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
int InsertionSort(vector<int>& a) {
  // TODO: sort a with insertion sort and return the number of comparisons.
  return 0;
}
#else
#include "../solutions/q61.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static void Check(vector<int> a, const vector<int>& sorted, int comparisons) {
  int c = InsertionSort(a);
  tf::ExpectEq(tf::VecStr(a), tf::VecStr(sorted), "array after sort");
  tf::ExpectEq(c, comparisons, "comparisons");
}

void RunQ61() {
  tf::Test("note's example {45,12,81,6,30}",
           [] { Check({45, 12, 81, 6, 30}, {6, 12, 30, 45, 81}, 8); });

  tf::Test("already sorted: N-1 comparisons",
           [] { Check({1, 2, 3, 4, 5, 6}, {1, 2, 3, 4, 5, 6}, 5); });

  tf::Test("reverse sorted: N(N-1)/2 comparisons",
           [] { Check({6, 5, 4, 3, 2, 1}, {1, 2, 3, 4, 5, 6}, 15); });

  tf::Test("two elements", [] { Check({2, 1}, {1, 2}, 1); });

  tf::HiddenTest("empty and single element", [] {
    Check({}, {}, 0);
    Check({4}, {4}, 0);
  });

  tf::HiddenTest("duplicates use a strict > (no shift on equal)",
                 [] { Check({2, 2, 2, 2}, {2, 2, 2, 2}, 3); });

  tf::HiddenTest("mixed with duplicates", [] {
    // Per pass: 1 + 2 + 3 = 6 comparisons.
    Check({3, 1, 2, 1}, {1, 1, 2, 3}, 6);
  });
}

}  // namespace q61

REGISTER_QUESTION(61, "Insertion sort with comparison count", q61::RunQ61);
