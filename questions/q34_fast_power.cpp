// ============================================================================
// Question 34  (4 marks)  -  Recursion: Power() by fast exponentiation
// Topic: Recursion
//
// Requirements for Recursion: Power()
//
// Task
// Write a recursive function `long long Power(long long base, int exp)` that
// returns base raised to the power exp, for exp >= 0 (anything to the power 0
// is 1).
// Use fast exponentiation (repeated squaring) so that only about log2(exp)
// recursive calls are made:
//   - exp == 0          -> 1
//   - exp is even       -> half = Power(base, exp / 2); result = half * half
//   - exp is odd        -> base * Power(base, exp - 1)
// Your function must be recursive; loops are not allowed.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q34 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
long long Power(long long base, int exp);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
long long Power(long long base, int exp) {
  // Your implementation here
  return 0;
}
#else
#include "../solutions/q34.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ34() {
  tf::Test("exponent zero", [] {
    tf::ExpectEq(Power(5, 0), 1LL, "Power(5, 0)");
    tf::ExpectEq(Power(0, 0), 1LL, "Power(0, 0)");
  });
  tf::Test("exponent one", [] { tf::ExpectEq(Power(7, 1), 7LL, "Power(7, 1)"); });
  tf::Test("even exponent", [] { tf::ExpectEq(Power(3, 4), 81LL, "Power(3, 4)"); });
  tf::Test("odd exponent", [] { tf::ExpectEq(Power(2, 10), 1024LL, "Power(2, 10)"); });

  tf::HiddenTest("large results", [] {
    tf::ExpectEq(Power(2, 62), 4611686018427387904LL, "Power(2, 62)");
    tf::ExpectEq(Power(3, 20), 3486784401LL, "Power(3, 20)");
    tf::ExpectEq(Power(10, 18), 1000000000000000000LL, "Power(10, 18)");
  });

  tf::HiddenTest("negative base", [] {
    tf::ExpectEq(Power(-2, 3), -8LL, "Power(-2, 3)");
    tf::ExpectEq(Power(-2, 4), 16LL, "Power(-2, 4)");
  });

  tf::HiddenTest("zero and one bases", [] {
    tf::ExpectEq(Power(0, 5), 0LL, "Power(0, 5)");
    tf::ExpectEq(Power(1, 1000000), 1LL, "Power(1, 1000000)");
    tf::ExpectEq(Power(-1, 999999), -1LL, "Power(-1, 999999)");
  });
}

}  // namespace q34

REGISTER_QUESTION(34, "Recursion: Power() by fast exponentiation", q34::RunQ34);
