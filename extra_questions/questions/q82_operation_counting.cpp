// ============================================================================
// Question 82  (4 marks)  -  Counting operations
// Topic: Big O and source analysis
//
// Requirements for StepsA(), StepsB(), StepsC()
//
// Each fragment below counts how many times its inner statement runs.
//
//   Fragment A:                      Fragment B:
//     for (i = 0; i < N; ++i)          for (i = 0; i < N; ++i)
//       for (j = 0; j < N; ++j)          for (j = 0; j < i; ++j)
//         ++count;                         ++count;
//
//   Fragment C:
//     while (n > 1) { n /= 2; ++count; }      (n starts equal to N)
//
// Task
// Write functions that return the final value of count WITHOUT running the
// loops (the tests use values of N where the loops would be far too slow):
//   long long StepsA(int N)  - count for fragment A (N*N)
//   long long StepsB(int N)  - count for fragment B (N(N-1)/2)
//   int StepsC(int N)        - count for fragment C (number of halvings,
//                              i.e. floor(log2 N); 0 when N <= 1)
// For N <= 0, StepsA and StepsB return 0. Use 64-bit arithmetic for A and B.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q82 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// Brute-force counters that really run the loops (use them to check yourself).
long long CountA(int N) {
  long long count = 0;
  for (int i = 0; i < N; ++i)
    for (int j = 0; j < N; ++j) ++count;
  return count;
}

long long CountB(int N) {
  long long count = 0;
  for (int i = 0; i < N; ++i)
    for (int j = 0; j < i; ++j) ++count;
  return count;
}

int CountC(int N) {
  int count = 0;
  int n = N;
  while (n > 1) {
    n /= 2;
    ++count;
  }
  return count;
}

long long StepsA(int N);
long long StepsB(int N);
int StepsC(int N);

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
long long StepsA(int N) {
  // TODO: closed form for fragment A
  return 0;
}

long long StepsB(int N) {
  // TODO: closed form for fragment B
  return 0;
}

int StepsC(int N) {
  // TODO: number of halvings for fragment C
  return 0;
}
#else
#include "../solutions/q82.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ82() {
  tf::Test("StepsA small values", [] {
    tf::ExpectEq(StepsA(0), 0LL, "StepsA(0)");
    tf::ExpectEq(StepsA(1), 1LL, "StepsA(1)");
    tf::ExpectEq(StepsA(5), 25LL, "StepsA(5)");
  });
  tf::Test("StepsB small values", [] {
    tf::ExpectEq(StepsB(0), 0LL, "StepsB(0)");
    tf::ExpectEq(StepsB(1), 0LL, "StepsB(1)");
    tf::ExpectEq(StepsB(5), 10LL, "StepsB(5)");
  });
  tf::Test("StepsC small values", [] {
    tf::ExpectEq(StepsC(0), 0, "StepsC(0)");
    tf::ExpectEq(StepsC(1), 0, "StepsC(1)");
    tf::ExpectEq(StepsC(2), 1, "StepsC(2)");
    tf::ExpectEq(StepsC(16), 4, "StepsC(16)");
  });
  tf::Test("StepsC does not round up", [] {
    tf::ExpectEq(StepsC(15), 3, "StepsC(15)");
    tf::ExpectEq(StepsC(17), 4, "StepsC(17)");
  });

  tf::HiddenTest("all three match the brute-force counters for N = 0..200", [] {
    for (int n = 0; n <= 200; ++n) {
      tf::ExpectEq(StepsA(n), CountA(n), "StepsA(" + to_string(n) + ")");
      tf::ExpectEq(StepsB(n), CountB(n), "StepsB(" + to_string(n) + ")");
      tf::ExpectEq(StepsC(n), CountC(n), "StepsC(" + to_string(n) + ")");
    }
  });
  tf::HiddenTest("large N for A and B", [] {
    tf::ExpectEq(StepsA(1000000), 1000000000000LL, "StepsA(1e6)");
    tf::ExpectEq(StepsB(1000000), 499999500000LL, "StepsB(1e6)");
    tf::ExpectEq(StepsA(2000000000), 4000000000000000000LL, "StepsA(2e9)");
    tf::ExpectEq(StepsB(2000000000), 1999999999000000000LL, "StepsB(2e9)");
  });
  tf::HiddenTest("large N for C", [] {
    tf::ExpectEq(StepsC(1000000000), 29, "StepsC(1e9)");
    tf::ExpectEq(StepsC(2147483647), 30, "StepsC(INT_MAX)");
    tf::ExpectEq(StepsC(1 << 20), 20, "StepsC(2^20)");
  });
}

}  // namespace q82

REGISTER_QUESTION(82, "Counting operations", q82::RunQ82);
