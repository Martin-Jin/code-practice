// ============================================================================
// Question 62  (4 marks)  -  Fix the bug: insertion sort
// Topic: Sorting algorithms
//
// Requirements for Fix the bug: insertion sort
//
// The function InsertionSort(vector<int>& a) below is meant to sort `a` into
// ascending order in place using insertion sort, but it compiles and
// terminates yet returns wrong results on many inputs. It contains two bugs.
//
// Task
// Correct InsertionSort so that it sorts every input. Keep it an insertion
// sort (save key = a[i], shift larger prefix elements one slot right, write
// key into the gap).
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q62 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// (nothing provided: fix the function below)

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
void InsertionSort(vector<int>& a) {
  for (int i = 1; i < (int)a.size(); ++i) {
    const int key = a[i];
    int j = i - 1;
    while (j > 0 && a[j] > key) {
      a[j + 1] = a[j];
      --j;
    }
    a[j + 1] = a[i];
  }
}
#else
#include "../solutions/q62.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static void Check(vector<int> a, const vector<int>& sorted) {
  InsertionSort(a);
  tf::ExpectEq(tf::VecStr(a), tf::VecStr(sorted), "array after sort");
}

void RunQ62() {
  tf::Test("note's example {45,12,81,6,30}",
           [] { Check({45, 12, 81, 6, 30}, {6, 12, 30, 45, 81}); });

  tf::Test("smallest element must reach index 0", [] { Check({2, 1}, {1, 2}); });

  tf::Test("key must be written back, not a[i]",
           [] { Check({1, 5, 6, 3}, {1, 3, 5, 6}); });

  tf::Test("already sorted", [] { Check({1, 2, 3, 4}, {1, 2, 3, 4}); });

  tf::HiddenTest("reverse sorted", [] { Check({5, 4, 3, 2, 1}, {1, 2, 3, 4, 5}); });

  tf::HiddenTest("empty and single element", [] {
    Check({}, {});
    Check({7}, {7});
  });

  tf::HiddenTest("duplicates", [] { Check({3, 1, 3, 1, 2}, {1, 1, 2, 3, 3}); });
}

}  // namespace q62

REGISTER_QUESTION(62, "Fix the bug: insertion sort", q62::RunQ62);
