// ============================================================================
// Question 31  (5 marks)  -  Recursion: Tower of Hanoi
// Topic: Recursion
// Restrict: recursive
//
// Requirements for Recursion: Tower of Hanoi
//
// Task
// n disks of different sizes (disk 1 is the smallest, disk n the largest) sit
// on peg `from`, largest at the bottom. Move them all to peg `to`, using peg
// `via` as a spare, obeying two rules: move one disk at a time, and never put a
// larger disk on top of a smaller one.
//
// Write a recursive function
//     void Hanoi(int n, char from, char to, char via)
// that prints every move, one per line, in the order they must be made:
//     Move disk 2 from A to C
// Printing nothing for n <= 0. Your function must be recursive; the whole
// solution is only a few lines.
//
// Note: there are four visible test cases and two hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q31 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
void Hanoi(int n, char from, char to, char via);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void Hanoi(int n, char from, char to, char via) {
  // Your implementation here
}
#else
#include "../solutions/q31.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
static int CountLines(const string& text) {
  int lines = 0;
  for (char c : text) {
    if (c == '\n') ++lines;
  }
  return lines;
}

void RunQ31() {
  tf::Test("one disk", [] {
    tf::ExpectOutput("Move disk 1 from A to C\n", [] { Hanoi(1, 'A', 'C', 'B'); });
  });

  tf::Test("two disks", [] {
    tf::ExpectOutput(
        "Move disk 1 from A to B\n"
        "Move disk 2 from A to C\n"
        "Move disk 1 from B to C\n",
        [] { Hanoi(2, 'A', 'C', 'B'); });
  });

  tf::Test("three disks", [] {
    tf::ExpectOutput(
        "Move disk 1 from A to C\n"
        "Move disk 2 from A to B\n"
        "Move disk 1 from C to B\n"
        "Move disk 3 from A to C\n"
        "Move disk 1 from B to A\n"
        "Move disk 2 from B to C\n"
        "Move disk 1 from A to C\n",
        [] { Hanoi(3, 'A', 'C', 'B'); });
  });

  tf::Test("zero disks prints nothing", [] {
    tf::ExpectOutput("", [] { Hanoi(0, 'A', 'C', 'B'); });
  });

  tf::HiddenTest("different peg labels", [] {
    tf::ExpectOutput(
        "Move disk 1 from X to Y\n"
        "Move disk 2 from X to Z\n"
        "Move disk 1 from Y to Z\n",
        [] { Hanoi(2, 'X', 'Z', 'Y'); });
  });

  tf::HiddenTest("n disks need 2^n - 1 moves", [] {
    for (int n = 1; n <= 6; ++n) {
      string out = tf::Capture([n] { Hanoi(n, 'A', 'C', 'B'); });
      tf::ExpectEq(CountLines(out), (1 << n) - 1, "number of moves for n=" + to_string(n));
    }
  });
}

}  // namespace q31

REGISTER_QUESTION(31, "Recursion: Tower of Hanoi", q31::RunQ31);
