// ============================================================================
// Question 3  (3 marks)  -  Numbers: Average()
// Topic: Numbers
//
// Requirements for Numbers: Average()
//
// Task
// Implement `double Average(const int* values, int count)`. It returns the mean
// of the first `count` elements of `values` as a double (not rounded down). If
// `count` is 0 or negative it returns 0.0.
//
// Note: there are three visible test cases and two hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q03 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
double Average(const int* values, int count);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
double Average(const int* values, int count) {
  // Your implementation here
  return -1.0;
}
#else
#include "../solutions/q03.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ03() {
  tf::Test("average of 2, 4, 6", [] {
    int a[] = {2, 4, 6};
    tf::ExpectNear(Average(a, 3), 4.0, "Average({2, 4, 6}, 3)", 1e-9);
  });

  tf::Test("a non-whole mean", [] {
    int a[] = {1, 2};
    tf::ExpectNear(Average(a, 2), 1.5, "Average({1, 2}, 2)", 1e-9);
  });

  tf::Test("a single element", [] {
    int a[] = {7};
    tf::ExpectNear(Average(a, 1), 7.0, "Average({7}, 1)", 1e-9);
  });

  tf::HiddenTest("negative numbers", [] {
    int a[] = {-3, -4, 1};
    tf::ExpectNear(Average(a, 3), -2.0, "Average({-3, -4, 1}, 3)", 1e-9);
  });

  tf::HiddenTest("empty gives 0 and only count elements are used", [] {
    int a[] = {5, 6, 100};
    tf::ExpectNear(Average(a, 0), 0.0, "Average(a, 0)", 1e-9);
    tf::ExpectNear(Average(a, 2), 5.5, "Average({5, 6, 100}, 2)", 1e-9);
  });
}

}  // namespace q03

REGISTER_QUESTION(3, "Numbers: Average()", q03::RunQ03);
