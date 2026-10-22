// ============================================================================
// Question 84  (4 marks)  -  Proving T(N) = O(N^2)
// Topic: Big O and source analysis
//
// Requirements for BigOConstants()
//
// T(N) = O(f(N)) means there are positive constants c and n0 such that
// T(N) <= c * f(N) for every N > n0.
//
// Task
// Let T(N) = a*N^2 + b*N + d where a >= 1, b >= 0 and d >= 0 are ints (each
// at most 1,000,000). Implement
//   void BigOConstants(int a, int b, int d, long long& c, long long& n0)
// so that c and n0 prove T(N) = O(N^2): set c and n0 so that
//   a*N^2 + b*N + d <= c * N^2   for every N > n0.
// Requirements on your answer: 0 < c <= 100,000,000 and 0 <= n0 <= 1000.
// Any valid pair is accepted. Hint: for N >= 1, bound N and 1 by N^2.
//
// Note: there are three visible test cases and three hidden test cases. The
// tests check the inequality for every N from n0 + 1 up to 100,000.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q84 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
void BigOConstants(int a, int b, int d, long long& c, long long& n0);

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
void BigOConstants(int a, int b, int d, long long& c, long long& n0) {
  // TODO: choose c and n0
  c = 0;
  n0 = 0;
}
#else
#include "../solutions/q84.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static void CheckProof(int a, int b, int d) {
  long long c = 0, n0 = 0;
  BigOConstants(a, b, d, c, n0);
  string what = "T(N) = " + to_string(a) + "N^2 + " + to_string(b) + "N + " +
                to_string(d) + " (c = " + to_string(c) + ", n0 = " +
                to_string(n0) + ")";
  if (c <= 0 || c > 100000000LL) {
    tf::Fail(what + ": c must satisfy 0 < c <= 100000000");
    return;
  }
  if (n0 < 0 || n0 > 1000) {
    tf::Fail(what + ": n0 must satisfy 0 <= n0 <= 1000");
    return;
  }
  for (long long n = n0 + 1; n <= 100000; ++n) {
    long long t = (long long)a * n * n + (long long)b * n + d;
    if (t > c * n * n) {
      tf::Fail(what + ": inequality fails at N = " + to_string(n));
      return;
    }
  }
}

void RunQ84() {
  tf::Test("T(N) = N^2", [] { CheckProof(1, 0, 0); });
  tf::Test("T(N) = 3N^2 + 5N + 7", [] { CheckProof(3, 5, 7); });
  tf::Test("T(N) = 2N^2 + 100", [] { CheckProof(2, 0, 100); });

  tf::HiddenTest("large coefficients", [] { CheckProof(1000, 1000, 1000); });
  tf::HiddenTest("large constant term", [] { CheckProof(1, 0, 1000000); });
  tf::HiddenTest("large linear term", [] { CheckProof(1, 1000000, 0); });
}

}  // namespace q84

REGISTER_QUESTION(84, "Proving T(N) = O(N^2)", q84::RunQ84);
