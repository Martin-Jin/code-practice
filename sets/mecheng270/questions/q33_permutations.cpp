// ============================================================================
// Question 33  (5 marks)  -  Recursion: PrintPermutations()
// Topic: Recursion
// Restrict: recursive
//
// Requirements for Recursion: PrintPermutations()
//
// Task
// Write a recursive function
//     void PrintPermutations(const string& prefix, const string& rest)
// that prints every arrangement of the letters in `rest`, each appended to
// `prefix`, one per line. Call it as PrintPermutations("", "abc") to print all
// six orderings of "abc".
//
// The letters of `rest` are distinct. Print the permutations in this order: try
// each letter of `rest` as the next letter, from left to right, and recurse on
// what is left. For "abc" that gives
//     abc
//     acb
//     bac
//     bca
//     cab
//     cba
// A loop over the letters of `rest` is allowed, but the function must also call
// itself. Do not call std::next_permutation or sort anything.
//
// Note: there are four visible test cases and two hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q33 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
void PrintPermutations(const string& prefix, const string& rest);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void PrintPermutations(const string& prefix, const string& rest) {
  // Your implementation here
}
#else
#include "../solutions/q33.inc"
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

void RunQ33() {
  tf::Test("one letter", [] {
    tf::ExpectOutput("a\n", [] { PrintPermutations("", "a"); });
  });

  tf::Test("two letters", [] {
    tf::ExpectOutput("ab\nba\n", [] { PrintPermutations("", "ab"); });
  });

  tf::Test("three letters", [] {
    tf::ExpectOutput("abc\nacb\nbac\nbca\ncab\ncba\n", [] { PrintPermutations("", "abc"); });
  });

  tf::Test("a non-empty prefix is kept in front", [] {
    tf::ExpectOutput("xab\nxba\n", [] { PrintPermutations("x", "ab"); });
  });

  tf::HiddenTest("four letters in order", [] {
    tf::ExpectOutput(
        "wxyz\nwxzy\nwyxz\nwyzx\nwzxy\nwzyx\n"
        "xwyz\nxwzy\nxywz\nxyzw\nxzwy\nxzyw\n"
        "ywxz\nywzx\nyxwz\nyxzw\nyzwx\nyzxw\n"
        "zwxy\nzwyx\nzxwy\nzxyw\nzywx\nzyxw\n",
        [] { PrintPermutations("", "wxyz"); });
  });

  tf::HiddenTest("n letters give n! lines", [] {
    const string letters = "abcdefg";
    int factorial = 1;
    for (int n = 1; n <= 6; ++n) {
      factorial *= n;
      string out = tf::Capture([&] { PrintPermutations("", letters.substr(0, n)); });
      tf::ExpectEq(CountLines(out), factorial, "number of lines for n=" + to_string(n));
    }
  });
}

}  // namespace q33

REGISTER_QUESTION(33, "Recursion: PrintPermutations()", q33::RunQ33);
