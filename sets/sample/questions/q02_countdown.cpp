// ============================================================================
// Question 2  (3 marks)  -  Printing: Countdown()
// Topic: Printing
//
// Requirements for Printing: Countdown()
//
// The tests capture everything written to cout and compare it with the
// expected text. Trailing spaces and trailing blank lines are ignored.
//
// Task
// Implement `void Countdown(int from)`. It prints the numbers from `from` down
// to 1, one per line, and then the word "Go!" on its own line. If `from` is
// less than 1 it prints only "Go!".
//
// For example, Countdown(3) prints:
// 3
// 2
// 1
// Go!
//
// Note: there are three visible test cases and two hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q02 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
void Countdown(int from);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void Countdown(int from) {
  // Your implementation here
}
#else
#include "../solutions/q02.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ02() {
  tf::Test("countdown from 3", [] {
    tf::ExpectOutput("3\n2\n1\nGo!\n", [] { Countdown(3); });
  });

  tf::Test("countdown from 1", [] {
    tf::ExpectOutput("1\nGo!\n", [] { Countdown(1); });
  });

  tf::Test("countdown from 5", [] {
    tf::ExpectOutput("5\n4\n3\n2\n1\nGo!\n", [] { Countdown(5); });
  });

  tf::HiddenTest("zero prints only Go!", [] {
    tf::ExpectOutput("Go!\n", [] { Countdown(0); });
  });

  tf::HiddenTest("negative prints only Go!", [] {
    tf::ExpectOutput("Go!\n", [] { Countdown(-4); });
  });
}

}  // namespace q02

REGISTER_QUESTION(2, "Printing: Countdown()", q02::RunQ02);
