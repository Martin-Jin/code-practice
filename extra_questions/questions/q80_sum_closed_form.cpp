// ============================================================================
// Question 80  (3 marks)  -  Sum 1..N in constant time
// Topic: Big O and source analysis
//
// Requirements for Sum2()
//
// You have been provided with Sum1(), which adds 1 + 2 + ... + n with a loop.
// It is O(N). The same sum has a closed form, N(N+1)/2, that costs O(1).
//
// Task
// Implement unsigned long long Sum2(int n) that returns 1 + 2 + ... + n using
// the closed form, with no loop. Do the arithmetic in unsigned long long so
// large n (up to 2,000,000,000) does not overflow. Sum2(0) must return 0.
//
// Note: there are four visible test cases and two hidden test cases. One of
// the hidden tests is a speed test: a loop-based answer will time out.
// ============================================================================
#include <chrono>

#include "../../framework/test_framework.h"

namespace q80 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
unsigned long long Sum1(int n) {  // O(N): loop
  unsigned long long total = 0;
  for (int i = 1; i <= n; ++i) total += i;
  return total;
}

unsigned long long Sum2(int n);  // O(1): closed form (you write this)

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
unsigned long long Sum2(int n) {
  // TODO: closed form N * (N + 1) / 2 in unsigned long long
  return 0;
}
#else
#include "../solutions/q80.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ80() {
  tf::Test("n = 0", [] { tf::ExpectEq(Sum2(0), 0ULL, "Sum2(0)"); });
  tf::Test("n = 1", [] { tf::ExpectEq(Sum2(1), 1ULL, "Sum2(1)"); });
  tf::Test("n = 10", [] { tf::ExpectEq(Sum2(10), 55ULL, "Sum2(10)"); });
  tf::Test("n = 1,000,000", [] {
    tf::ExpectEq(Sum2(1000000), 500000500000ULL, "Sum2(1000000)");
  });

  tf::HiddenTest("n = 2,000,000,000 needs 64-bit arithmetic", [] {
    tf::ExpectEq(Sum2(2000000000), 2000000001000000000ULL, "Sum2(2e9)");
  });

  tf::HiddenTest("speed: 100000 calls with n = 1e9", [] {
    using clock = chrono::steady_clock;
    // A loop-based answer needs 1e9 steps per call, so check one call first.
    auto t0 = clock::now();
    unsigned long long first = Sum2(1000000000);
    double one = chrono::duration<double>(clock::now() - t0).count();
    tf::ExpectEq(first, 500000000500000000ULL, "Sum2(1e9)");
    if (one > 0.2) {
      tf::Fail("Sum2(1e9) took too long; it must be O(1), not a loop");
      return;
    }
    unsigned long long sink = 0;
    t0 = clock::now();
    for (int i = 0; i < 100000; ++i) sink += Sum2(1000000000 - i % 7);
    double secs = chrono::duration<double>(clock::now() - t0).count();
    tf::ExpectTrue(sink != 0, "results must be used");
    tf::ExpectTrue(secs < 3.0, "100000 calls must finish in under 3 s");
  });
}

}  // namespace q80

REGISTER_QUESTION(80, "Sum 1..N in constant time", q80::RunQ80);
