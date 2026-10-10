// ============================================================================
// Question 32  (3 marks)  -  Recursion: Fibonacci()
// Topic: Recursion
//
// Requirements for Recursion: Fibonacci()
//
// Task
// Write a recursive function `int Fibonacci(int n)` that returns the n-th
// Fibonacci number, where Fibonacci(0) = 0, Fibonacci(1) = 1 and
// Fibonacci(n) = Fibonacci(n-1) + Fibonacci(n-2) for n >= 2.
// Your function must be recursive; loops are not allowed. Tests use n <= 20.
//
// Note: there are four visible test cases and two hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q32 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int Fibonacci(int n);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int Fibonacci(int n) {
  // Your implementation here
  return -1;
}
#else
#include "../solutions/q32.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ32() {
  tf::Test("Fibonacci(0) is 0", [] { tf::ExpectEq(Fibonacci(0), 0, "Fibonacci(0)"); });
  tf::Test("Fibonacci(1) is 1", [] { tf::ExpectEq(Fibonacci(1), 1, "Fibonacci(1)"); });
  tf::Test("Fibonacci(2) is 1", [] { tf::ExpectEq(Fibonacci(2), 1, "Fibonacci(2)"); });
  tf::Test("Fibonacci(10) is 55", [] { tf::ExpectEq(Fibonacci(10), 55, "Fibonacci(10)"); });

  tf::HiddenTest("Fibonacci(20) is 6765", [] {
    tf::ExpectEq(Fibonacci(20), 6765, "Fibonacci(20)");
  });

  tf::HiddenTest("every value from 0 to 20", [] {
    const int expected[] = {0,  1,  1,   2,   3,   5,   8,   13,   21,   34,  55,
                            89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765};
    for (int n = 0; n <= 20; ++n) {
      tf::ExpectEq(Fibonacci(n), expected[n], "Fibonacci(" + to_string(n) + ")");
    }
  });
}

}  // namespace q32

REGISTER_QUESTION(32, "Recursion: Fibonacci()", q32::RunQ32);
