// ============================================================================
// Question 53  (5 marks)  -  Comparing two functions by timing
// Topic: Big O and source analysis
//
// Requirements for TimeOnceMicros() and FasterOf()
//
// To decide which of two implementations is faster (for example a naive DFT
// against an FFT) we time each one with std::chrono::steady_clock. A single
// run jitters, so we repeat both and compare the totals.
//
// Task
// 1. Implement long long TimeOnceMicros(const function<void()>& f). It calls
//    f exactly once and returns the elapsed time in whole microseconds, using
//    chrono::steady_clock::now() and chrono::duration_cast<chrono::microseconds>.
// 2. Implement int FasterOf(const function<void()>& a,
//                           const function<void()>& b, int repeats).
//    It calls a and b exactly `repeats` times each, timing every call with
//    TimeOnceMicros(). It returns 0 if a is faster overall (or they tie) and
//    1 if b has the smaller total time. If repeats <= 0 it must not call
//    either function and returns 0.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include <chrono>
#include <thread>

#include "../framework/test_framework.h"

namespace q53 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
unsigned long long SumLoop(int n) {  // O(N): loop (volatile keeps the loop real)
  volatile unsigned long long total = 0;
  for (int i = 1; i <= n; ++i) total = total + i;
  return total;
}

unsigned long long SumFormula(int n) {  // O(1): closed form
  unsigned long long N = (unsigned long long)n;
  return N * (N + 1ULL) / 2ULL;
}

long long TimeOnceMicros(const function<void()>& f);
int FasterOf(const function<void()>& a, const function<void()>& b, int repeats);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
long long TimeOnceMicros(const function<void()>& f) {
  return 0;
}

int FasterOf(const function<void()>& a, const function<void()>& b, int repeats) {
  return 0;
}
#else
#include "../solutions/q53.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ53() {
  tf::Test("TimeOnceMicros of a 20 ms function is about 20000 us", [] {
    long long us = TimeOnceMicros([] { this_thread::sleep_for(chrono::milliseconds(20)); });
    tf::ExpectTrue(us >= 18000 && us <= 60000,
                   "expected between 18000 and 60000 us, got " + tf::Str(us));
  });

  tf::Test("TimeOnceMicros calls f exactly once", [] {
    int calls = 0;
    TimeOnceMicros([&] { ++calls; });
    tf::ExpectEq(calls, 1, "number of calls");
  });

  tf::Test("FasterOf picks the 30 ms function over the 5 ms one", [] {
    auto fast = [] { this_thread::sleep_for(chrono::milliseconds(5)); };
    auto slow = [] { this_thread::sleep_for(chrono::milliseconds(30)); };
    tf::ExpectEq(FasterOf(slow, fast, 3), 1, "b is faster");
  });

  tf::HiddenTest("FasterOf returns 0 when a is faster", [] {
    auto fast = [] { this_thread::sleep_for(chrono::milliseconds(5)); };
    auto slow = [] { this_thread::sleep_for(chrono::milliseconds(30)); };
    tf::ExpectEq(FasterOf(fast, slow, 3), 0, "a is faster");
  });

  tf::HiddenTest("each function is called exactly `repeats` times", [] {
    int a_calls = 0, b_calls = 0;
    FasterOf([&] { ++a_calls; }, [&] { ++b_calls; }, 6);
    tf::ExpectEq(a_calls, 6, "calls of a");
    tf::ExpectEq(b_calls, 6, "calls of b");
  });

  tf::HiddenTest("repeats <= 0 calls nothing; SumLoop is slower than SumFormula", [] {
    int calls = 0;
    tf::ExpectEq(FasterOf([&] { ++calls; }, [&] { ++calls; }, 0), 0, "result for repeats = 0");
    tf::ExpectEq(calls, 0, "number of calls");
    unsigned long long sink = 0;
    int result = FasterOf([&] { sink += SumLoop(2000000); }, [&] { sink += SumFormula(2000000); }, 5);
    tf::ExpectTrue(sink != 0, "results must be used");
    tf::ExpectEq(result, 1, "the closed form is faster");
  });
}

}  // namespace q53

REGISTER_QUESTION(53, "Comparing two functions by timing", q53::RunQ53);
