// ============================================================================
// Question 64  (4 marks)  -  Recursive merge sort
// Topic: Sorting algorithms
//
// Requirements for Merge sort
//
// Implement void MergeSort(vector<int>& a, int L, int R). It sorts the span
// a[L..R] (inclusive) into ascending order. It MUST be recursive:
//   1. If L >= R, return (a span of 0 or 1 elements is already sorted).
//   2. Set m = L + (R - L) / 2.
//   3. MergeSort(a, L, m) and MergeSort(a, m+1, R).
//   4. Merge(a, L, m, R), which must come AFTER the two recursive calls
//      (a merge needs both inputs already sorted).
//
// A correct Merge(vector<int>&, int L, int m, int R) is provided. It merges the
// sorted runs a[L..m] and a[m+1..R] and counts how many times it is called.
// Do not write your own merge.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q64 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int merge_calls = 0;

void Merge(vector<int>& a, int L, int m, int R) {
  ++merge_calls;
  vector<int> left(a.begin() + L, a.begin() + m + 1);
  vector<int> right(a.begin() + m + 1, a.begin() + R + 1);
  int i = 0, j = 0, k = L;
  while (i < (int)left.size() && j < (int)right.size()) {
    if (left[i] <= right[j]) {
      a[k++] = left[i++];
    } else {
      a[k++] = right[j++];
    }
  }
  while (i < (int)left.size()) a[k++] = left[i++];
  while (j < (int)right.size()) a[k++] = right[j++];
}

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
void MergeSort(vector<int>& a, int L, int R) {
  // TODO: recursive merge sort of a[L..R].
}
#else
#include "../solutions/q64.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static void Check(vector<int> a, const vector<int>& sorted, int merges) {
  merge_calls = 0;
  MergeSort(a, 0, (int)a.size() - 1);
  tf::ExpectEq(tf::VecStr(a), tf::VecStr(sorted), "array after sort");
  tf::ExpectEq(merge_calls, merges, "calls to Merge");
}

void RunQ64() {
  tf::Test("note's trace {45,12,81,6}: 3 merges",
           [] { Check({45, 12, 81, 6}, {6, 12, 45, 81}, 3); });

  tf::Test("five elements: 4 merges",
           [] { Check({45, 12, 81, 6, 30}, {6, 12, 30, 45, 81}, 4); });

  tf::Test("single element: no merges", [] { Check({5}, {5}, 0); });

  tf::Test("reverse sorted", [] { Check({6, 5, 4, 3, 2, 1}, {1, 2, 3, 4, 5, 6}, 5); });

  tf::HiddenTest("empty vector: no merges", [] { Check({}, {}, 0); });

  tf::HiddenTest("duplicates", [] { Check({3, 1, 3, 1, 2, 2}, {1, 1, 2, 2, 3, 3}, 5); });

  tf::HiddenTest("sub-span only: outside elements untouched", [] {
    vector<int> a = {9, 4, 3, 2, 1, 9};
    merge_calls = 0;
    MergeSort(a, 1, 4);
    tf::ExpectEq(tf::VecStr(a), tf::VecStr(vector<int>{9, 1, 2, 3, 4, 9}), "array");
    tf::ExpectEq(merge_calls, 3, "calls to Merge");
  });
}

}  // namespace q64

REGISTER_QUESTION(64, "Recursive merge sort", q64::RunQ64);
