// ============================================================================
// Question 6  (4 marks)  -  Recursion: Power()
// Topic: Recursion
// Restrict: no-loops, recursive
//
// Requirements for Recursion: Power()
//
// Task
// Implement `int Power(int base, int exponent)` recursively. It returns base
// raised to the power exponent, where exponent is 0 or more. Any base to the
// power 0 is 1. You may not use a loop, and the function must call itself.
//
// Note: there are three visible test cases and two hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q06 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int Power(int base, int exponent);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int Power(int base, int exponent) {
  // Your implementation here
  return -1;
}
#else
#include "../solutions/q06.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ06() {
  tf::Test("2 to the power 3", [] {
    tf::ExpectEq(Power(2, 3), 8, "Power(2, 3)");
  });

  tf::Test("5 to the power 1", [] {
    tf::ExpectEq(Power(5, 1), 5, "Power(5, 1)");
  });

  tf::Test("3 to the power 4", [] {
    tf::ExpectEq(Power(3, 4), 81, "Power(3, 4)");
  });

  tf::HiddenTest("exponent 0 gives 1", [] {
    tf::ExpectEq(Power(7, 0), 1, "Power(7, 0)");
    tf::ExpectEq(Power(0, 0), 1, "Power(0, 0)");
  });

  tf::HiddenTest("negative base and base 0", [] {
    tf::ExpectEq(Power(-2, 3), -8, "Power(-2, 3)");
    tf::ExpectEq(Power(-2, 4), 16, "Power(-2, 4)");
    tf::ExpectEq(Power(0, 5), 0, "Power(0, 5)");
  });
}

}  // namespace q06

REGISTER_QUESTION(6, "Recursion: Power()", q06::RunQ06);
