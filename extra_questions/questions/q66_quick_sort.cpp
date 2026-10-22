// ============================================================================
// Question 66  (4 marks)  -  Recursive quicksort
// Topic: Sorting algorithms
//
// Requirements for Quicksort
//
// Implement void QuickSort(vector<int>& a, int L, int R). It sorts the span
// a[L..R] (inclusive) into ascending order. It MUST be recursive:
//   1. If L >= R, return.
//   2. p = Partition(a, L, R)  (the pivot is now in its final position).
//   3. QuickSort(a, L, p-1) and QuickSort(a, p+1, R).
//
// A correct Partition(vector<int>&, int L, int R) is provided (last element
// as pivot). It returns the pivot's final index and counts how many times it
// is called. Do not write your own partition, and call it only when L < R.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q66 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int partition_calls = 0;

int Partition(vector<int>& a, int L, int R) {
  ++partition_calls;
  const int pivot = a[R];
  int i = L;
  for (int j = L; j < R; ++j) {
    if (a[j] <= pivot) {
      swap(a[i], a[j]);
      ++i;
    }
  }
  swap(a[i], a[R]);
  return i;
}

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
void QuickSort(vector<int>& a, int L, int R) {
  // TODO: recursive quicksort of a[L..R].
}
#else
#include "../solutions/q66.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static void Check(vector<int> a, const vector<int>& sorted, int partitions) {
  partition_calls = 0;
  QuickSort(a, 0, (int)a.size() - 1);
  tf::ExpectEq(tf::VecStr(a), tf::VecStr(sorted), "array after sort");
  tf::ExpectEq(partition_calls, partitions, "calls to Partition");
}

void RunQ66() {
  tf::Test("note's trace {45,12,81,6,30}: 3 partitions",
           [] { Check({45, 12, 81, 6, 30}, {6, 12, 30, 45, 81}, 3); });

  tf::Test("sorted input of 5: 4 partitions (worst case)",
           [] { Check({1, 2, 3, 4, 5}, {1, 2, 3, 4, 5}, 4); });

  tf::Test("single element: no partition", [] { Check({8}, {8}, 0); });

  tf::Test("reverse sorted", [] { Check({5, 4, 3, 2, 1}, {1, 2, 3, 4, 5}, 4); });

  tf::HiddenTest("empty vector: no partition", [] { Check({}, {}, 0); });

  tf::HiddenTest("duplicates", [] {
    vector<int> a = {3, 1, 3, 1, 2, 2};
    QuickSort(a, 0, 5);
    tf::ExpectEq(tf::VecStr(a), tf::VecStr(vector<int>{1, 1, 2, 2, 3, 3}), "array");
  });

  tf::HiddenTest("sub-span only: outside elements untouched", [] {
    vector<int> a = {9, 4, 3, 2, 1, 9};
    QuickSort(a, 1, 4);
    tf::ExpectEq(tf::VecStr(a), tf::VecStr(vector<int>{9, 1, 2, 3, 4, 9}), "array");
  });
}

}  // namespace q66

REGISTER_QUESTION(66, "Recursive quicksort", q66::RunQ66);
