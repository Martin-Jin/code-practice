// ============================================================================
// Question 44  (4 marks)  -  Sentinel linear search: SentinelSearch()
// Topic: Algorithms & search
//
// Requirements for Sentinel linear search: SentinelSearch()
//
// Algorithm LS (Sentinel linear search). Given A of N elements and key x, find
// the least i with A_i = x, or return -1.
//   LS1. [Append]     A_N <- x
//   LS2. [Initialise] i <- 0
//   LS3. [Compare]    If A_i = x, goto LS5
//   LS4. [Advance]    i <- i + 1, goto LS3
//   LS5. [Terminate]  If i < N return i, else return -1.
//
// Task
// Implement int SentinelSearch(vector<int>& v, int x) following Algorithm LS.
//   - Plant x at the end of v (push_back) so the search loop needs no bounds
//     check.
//   - Return the least index where x occurs, or -1 if it is not in the
//     original data.
//   - The sentinel must be removed again: when the function returns, v must be
//     exactly as the caller passed it in.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q44 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int SentinelSearch(vector<int>& v, int x);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int SentinelSearch(vector<int>& v, int x) {
  // Your implementation here
  return -1;
}
#else
#include "../solutions/q44.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
namespace {
// Searches, then checks the result and that v is untouched afterwards.
void Check(vector<int> v, int x, int expected) {
  const vector<int> before = v;
  int got = SentinelSearch(v, x);
  tf::ExpectEq(got, expected, "index of " + to_string(x));
  tf::ExpectEq(tf::VecStr(v), tf::VecStr(before), "vector after the search");
}
}  // namespace

void RunQ44() {
  tf::Test("key in the middle", [] { Check({4, 8, 15, 16, 23, 42}, 15, 2); });

  tf::Test("key absent returns -1 and v is restored", [] {
    Check({4, 8, 15, 16, 23, 42}, 99, -1);
  });

  tf::Test("key is the first element", [] { Check({7, 1, 2, 3}, 7, 0); });

  tf::Test("key is the last element (not mistaken for the sentinel)", [] {
    Check({1, 2, 3, 9}, 9, 3);
  });

  tf::HiddenTest("empty vector", [] { Check({}, 5, -1); });

  tf::HiddenTest("duplicates return the least index", [] {
    Check({3, 5, 3, 5, 3}, 5, 1);
  });

  tf::HiddenTest("single element, present and absent", [] {
    Check({6}, 6, 0);
    Check({6}, 7, -1);
  });
}

}  // namespace q44

REGISTER_QUESTION(44, "Sentinel linear search: SentinelSearch()", q44::RunQ44);
