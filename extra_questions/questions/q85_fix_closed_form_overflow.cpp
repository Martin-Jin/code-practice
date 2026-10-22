// ============================================================================
// Question 85  (4 marks)  -  Fix the overflow in closed-form sums
// Topic: Big O and source analysis
//
// Requirements for SumTo() and SumSquares()
//
// The closed forms 1 + 2 + ... + N = N(N+1)/2 and
// 1^2 + 2^2 + ... + N^2 = N(N+1)(2N+1)/6 cost O(1), but the code below does
// the arithmetic in int. The product N(N+1) is computed BEFORE the division,
// so it overflows long before the answer itself would.
//
// Task
// Fix both functions. Keep the function names and the int parameter, but make
// both return unsigned long long and do all the arithmetic in unsigned long
// long (convert n first, and use the ULL suffix on literals). Both must work
// for 0 <= n <= 1,000,000.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q85 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// (nothing: the buggy code is in the answer box)

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
int SumTo(int n) {
  return n * (n + 1) / 2;
}

unsigned long long SumSquares(int n) {
  return n * (n + 1) * (2 * n + 1) / 6;
}
#else
#include "../solutions/q85.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ85() {
  tf::Test("SumTo small values", [] {
    unsigned long long a = SumTo(0), b = SumTo(1), c = SumTo(10);
    tf::ExpectEq(a, 0ULL, "SumTo(0)");
    tf::ExpectEq(b, 1ULL, "SumTo(1)");
    tf::ExpectEq(c, 55ULL, "SumTo(10)");
  });
  tf::Test("SumTo(100000) overflows an int", [] {
    unsigned long long r = SumTo(100000);
    tf::ExpectEq(r, 5000050000ULL, "SumTo(100000)");
  });
  tf::Test("SumSquares small values", [] {
    tf::ExpectEq(SumSquares(0), 0ULL, "SumSquares(0)");
    tf::ExpectEq(SumSquares(1), 1ULL, "SumSquares(1)");
    tf::ExpectEq(SumSquares(10), 385ULL, "SumSquares(10)");
  });
  tf::Test("SumSquares(2000) overflows int intermediates", [] {
    tf::ExpectEq(SumSquares(2000), 2668667000ULL, "SumSquares(2000)");
  });

  tf::HiddenTest("SumTo(1000000)", [] {
    unsigned long long r = SumTo(1000000);
    tf::ExpectEq(r, 500000500000ULL, "SumTo(1000000)");
  });
  tf::HiddenTest("SumSquares(1000000)", [] {
    tf::ExpectEq(SumSquares(1000000), 333333833333500000ULL, "SumSquares(1000000)");
  });
  tf::HiddenTest("SumSquares(1500) just past the int limit", [] {
    tf::ExpectEq(SumSquares(1500), 1126125250ULL, "SumSquares(1500)");
  });
}

}  // namespace q85

REGISTER_QUESTION(85, "Fix the overflow in closed-form sums", q85::RunQ85);
