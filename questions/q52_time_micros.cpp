// ============================================================================
// Question 52  (4 marks)  -  Timing an algorithm
// Topic: Big O and source analysis
//
// Requirements for TimeMicros()
//
// Big O predicts the trend, not the exact time, and one timing run is noisy.
// So we run the code several times and report the mean. Sum1() (a loop, O(N))
// and Sum2() (a closed form, O(1)) are provided to time.
//
// Task
// Implement double TimeMicros(const function<void()>& f, int repeats). It
// calls f exactly `repeats` times and returns the MEAN time of one call in
// microseconds, measured with std::chrono::steady_clock. If repeats <= 0 it
// must not call f and returns 0.0.
//
// Note: there are three visible test cases and two hidden test cases.
// ============================================================================
#include <chrono>
#include <thread>

#include "../framework/test_framework.h"

namespace q52 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
unsigned long long Sum1(int n) {  // O(N): loop (volatile keeps the loop real)
  volatile unsigned long long total = 0;
  for (int i = 1; i <= n; ++i) total = total + i;
  return total;
}

unsigned long long Sum2(int n) {  // O(1): closed form
  unsigned long long N = (unsigned long long)n;
  return N * (N + 1ULL) / 2ULL;
}

double TimeMicros(const function<void()>& f, int repeats);

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
double TimeMicros(const function<void()>& f, int repeats) {
  double total_time = 0.0;
  for (int i = 0; i < repeats; i++) {
    auto start = std::chrono::steady_clock::now();
    f();
    auto end = std::chrono::steady_clock::now();
    total_time += std::chrono::duration_cast<chrono::microseconds>(end - start).count();
  }
  return total_time;
}
#else
#include "../solutions/q52.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ52() {
  tf::Test("mean of a 20 ms function is about 20000 us", [] {
    double us =
        TimeMicros([] { this_thread::sleep_for(chrono::milliseconds(20)); }, 5);
    tf::ExpectTrue(
        us >= 18000.0 && us <= 60000.0,
        "mean should be between 18000 and 60000 us, got " + tf::Str(us));
  });
  tf::Test("f is called exactly `repeats` times", [] {
    int calls = 0;
    TimeMicros([&] { ++calls; }, 7);
    tf::ExpectEq(calls, 7, "number of calls");
  });
  tf::Test("repeats = 0 returns 0 and does not call f", [] {
    int calls = 0;
    double us = TimeMicros([&] { ++calls; }, 0);
    tf::ExpectEq(calls, 0, "number of calls");
    tf::ExpectNear(us, 0.0, "returned time", 1e-12);
  });

  tf::HiddenTest("returns the mean, not the total", [] {
    double us = TimeMicros(
        [] { this_thread::sleep_for(chrono::milliseconds(20)); }, 10);
    tf::ExpectTrue(us < 60000.0,
                   "mean of 10 runs must be well under the 200 ms total, got " +
                       tf::Str(us));
  });
  tf::HiddenTest("Sum1(2e6) is much slower than Sum2(2e6)", [] {
    unsigned long long sink = 0;
    double t1 = TimeMicros([&] { sink += Sum1(2000000); }, 5);
    double t2 = TimeMicros([&] { sink += Sum2(2000000); }, 1000);
    tf::ExpectTrue(sink != 0, "results must be used");
    tf::ExpectTrue(t1 > 0.0, "Sum1 time must be positive, got " + tf::Str(t1));
    tf::ExpectTrue(t1 > 5.0 * t2,
                   "Sum1 should be more than 5x slower than Sum2 (" +
                       tf::Str(t1) + " us vs " + tf::Str(t2) + " us)");
  });
}

}  // namespace q52

REGISTER_QUESTION(52, "Timing an algorithm", q52::RunQ52);
