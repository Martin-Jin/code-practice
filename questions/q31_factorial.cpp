// ============================================================================
// Question 31  (3 marks)  -  Recursion: Factorial()
// Topic: Recursion
//
// Requirements for Recursion: Factorial()
//
// Task
// Write a recursive function `int Factorial(int n)` that returns n! for
// 0 <= n <= 12 (12! is the largest factorial that fits in a 32-bit int).
// By definition 0! = 1 and n! = n * (n-1)! for n >= 1.
// Your function must be recursive (it must call itself); loops are not allowed.
//
// Note: there are four visible test cases and two hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q31 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int Factorial(int n);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int Factorial(int n) {
  // Your implementation here
  return 0;
}
#else
#include "../solutions/q31.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ31() {
  tf::Test("Factorial(0) is 1", [] { tf::ExpectEq(Factorial(0), 1, "Factorial(0)"); });
  tf::Test("Factorial(1) is 1", [] { tf::ExpectEq(Factorial(1), 1, "Factorial(1)"); });
  tf::Test("Factorial(5) is 120", [] { tf::ExpectEq(Factorial(5), 120, "Factorial(5)"); });
  tf::Test("Factorial(7) is 5040", [] { tf::ExpectEq(Factorial(7), 5040, "Factorial(7)"); });

  tf::HiddenTest("Factorial(12) is 479001600", [] {
    tf::ExpectEq(Factorial(12), 479001600, "Factorial(12)");
  });

  tf::HiddenTest("every value from 0 to 12", [] {
    const int expected[] = {1,   1,    2,     6,      24,      120,      720,
                            5040, 40320, 362880, 3628800, 39916800, 479001600};
    for (int n = 0; n <= 12; ++n) {
      tf::ExpectEq(Factorial(n), expected[n], "Factorial(" + to_string(n) + ")");
    }
  });
}

}  // namespace q31

REGISTER_QUESTION(31, "Recursion: Factorial()", q31::RunQ31);
