// ============================================================================
// Question 1  (3 marks)  -  Arrays: Sum()
// Topic: Arrays
//
// Requirements for Arrays: Sum()
//
// You have been provided with the declaration of Sum(). Everything between the
// PROVIDED CODE and YOUR ANSWER markers is shown to the student as given code.
//
// Task
// Implement `int Sum(const int* values, int count)`. It returns the sum of the
// first `count` elements of `values`. If `count` is 0 or negative it returns 0.
//
// Note: there are three visible test cases and two hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q01 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int Sum(const int* values, int count);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int Sum(const int* values, int count) {
  // Your implementation here
  return -1;
}
#else
#include "../solutions/q01.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ01() {
  tf::Test("sum of three numbers", [] {
    int a[] = {1, 2, 3};
    tf::ExpectEq(Sum(a, 3), 6, "Sum({1, 2, 3}, 3)");
  });

  tf::Test("a single element", [] {
    int a[] = {42};
    tf::ExpectEq(Sum(a, 1), 42, "Sum({42}, 1)");
  });

  tf::Test("negative numbers", [] {
    int a[] = {-5, 2, -1};
    tf::ExpectEq(Sum(a, 3), -4, "Sum({-5, 2, -1}, 3)");
  });

  tf::HiddenTest("only the first count elements are added", [] {
    int a[] = {10, 20, 30, 40};
    tf::ExpectEq(Sum(a, 2), 30, "Sum({10, 20, 30, 40}, 2)");
  });

  tf::HiddenTest("count of zero or less gives 0", [] {
    int a[] = {7, 8};
    tf::ExpectEq(Sum(a, 0), 0, "Sum(a, 0)");
    tf::ExpectEq(Sum(a, -3), 0, "Sum(a, -3)");
  });
}

}  // namespace q01

REGISTER_QUESTION(1, "Arrays: Sum()", q01::RunQ01);
