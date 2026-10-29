// ============================================================================
// Question 5  (4 marks)  -  Fix the bug: LargestValue()
// Topic: Debugging
//
// Requirements for Fix the bug: LargestValue()
//
// The function below should return the largest of the first `count` elements of
// `values`, or 0 if `count` is 0 or negative. It has two bugs.
//
// Task
// Fix `int LargestValue(const int* values, int count)` so that it passes all
// the tests. Edit the code in the answer box; do not change the signature.
//
// Note: there are three visible test cases and two hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q05 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int LargestValue(const int* values, int count);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int LargestValue(const int* values, int count) {
  int largest = 0;
  for (int i = 0; i < count - 1; ++i) {
    if (values[i] > largest) largest = values[i];
  }
  return largest;
}
#else
#include "../solutions/q05.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ05() {
  tf::Test("largest in the middle", [] {
    int a[] = {3, 9, 4};
    tf::ExpectEq(LargestValue(a, 3), 9, "LargestValue({3, 9, 4}, 3)");
  });

  tf::Test("largest is the last element", [] {
    int a[] = {1, 2, 8};
    tf::ExpectEq(LargestValue(a, 3), 8, "LargestValue({1, 2, 8}, 3)");
  });

  tf::Test("a single element", [] {
    int a[] = {5};
    tf::ExpectEq(LargestValue(a, 1), 5, "LargestValue({5}, 1)");
  });

  tf::HiddenTest("all negative", [] {
    int a[] = {-8, -3, -6};
    tf::ExpectEq(LargestValue(a, 3), -3, "LargestValue({-8, -3, -6}, 3)");
  });

  tf::HiddenTest("empty gives 0 and only count elements are read", [] {
    int a[] = {4, 6, 50};
    tf::ExpectEq(LargestValue(a, 0), 0, "LargestValue(a, 0)");
    tf::ExpectEq(LargestValue(a, 2), 6, "LargestValue({4, 6, 50}, 2)");
  });
}

}  // namespace q05

REGISTER_QUESTION(5, "Fix the bug: LargestValue()", q05::RunQ05);
