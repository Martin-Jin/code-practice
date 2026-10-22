// ============================================================================
// Question 81  (5 marks)  -  Duplicate detection in O(N log N)
// Topic: Big O and source analysis
//
// Requirements for HasDuplicate()
//
// You have been provided with HasDuplicateSlow(), which compares every pair of
// elements. It is O(N^2) and far too slow for large inputs.
//
// Task
// Implement bool HasDuplicate(const vector<int>& v). It returns true if any
// value appears more than once in v, otherwise false. It must run in
// O(N log N): sort a COPY of the vector (v is const), then compare neighbours.
// An empty vector or a single element has no duplicates.
//
// Note: there are four visible test cases and three hidden test cases. The
// hidden tests include speed tests with N = 300,000.
// ============================================================================
#include <algorithm>
#include <chrono>

#include "../../framework/test_framework.h"

namespace q81 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
bool HasDuplicateSlow(const vector<int>& v) {  // O(N^2)
  for (size_t i = 0; i < v.size(); ++i) {
    for (size_t j = i + 1; j < v.size(); ++j) {
      if (v[i] == v[j]) return true;
    }
  }
  return false;
}

bool HasDuplicate(const vector<int>& v);  // O(N log N) (you write this)

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
bool HasDuplicate(const vector<int>& v) {
  // TODO: sort a copy, then compare neighbouring elements
  return false;
}
#else
#include "../solutions/q81.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
// Distinct values in scrambled order (1000003 is prime, so no repeats).
static vector<int> Scrambled(int n) {
  vector<int> v(n);
  for (int i = 0; i < n; ++i) {
    v[i] = (int)((long long)i * 7919 % 1000003);
  }
  return v;
}

void RunQ81() {
  tf::Test("empty and single element", [] {
    tf::ExpectEq(HasDuplicate({}), false, "empty");
    tf::ExpectEq(HasDuplicate({5}), false, "single");
  });
  tf::Test("no duplicates", [] {
    tf::ExpectEq(HasDuplicate({4, 1, 3, 2, 9}), false, "{4,1,3,2,9}");
  });
  tf::Test("duplicate at the ends", [] {
    tf::ExpectEq(HasDuplicate({7, 1, 3, 2, 7}), true, "{7,1,3,2,7}");
  });
  tf::Test("input is not modified", [] {
    vector<int> v = {3, 1, 2, 1};
    vector<int> copy = v;
    tf::ExpectEq(HasDuplicate(v), true, "{3,1,2,1}");
    tf::ExpectTrue(v == copy, "the input vector must be left unchanged");
  });

  tf::HiddenTest("agrees with HasDuplicateSlow on small cases", [] {
    vector<vector<int>> cases = {
        {1, 1},         {2, 2, 2},        {-1, 0, 1, -1},  {10, 20, 30, 40},
        {0, 0},         {5, 4, 3, 2, 1},  {1, 2, 3, 4, 4}, {-5, 5},
        {100, 50, 100}, {1, 2, 3, 1, 2, 3}};
    for (const vector<int>& c : cases) {
      tf::ExpectEq(HasDuplicate(c), HasDuplicateSlow(c), tf::VecStr(c));
    }
  });
  tf::HiddenTest("speed: N = 300000, no duplicates", [] {
    vector<int> v = Scrambled(300000);
    auto t0 = chrono::steady_clock::now();
    bool r = HasDuplicate(v);
    double secs = chrono::duration<double>(chrono::steady_clock::now() - t0).count();
    tf::ExpectEq(r, false, "result");
    tf::ExpectTrue(secs < 3.0, "must finish in under 3 s (O(N log N))");
  });
  tf::HiddenTest("speed: N = 300000, one duplicate at the end", [] {
    vector<int> v = Scrambled(300000);
    v.push_back(v[1234]);
    auto t0 = chrono::steady_clock::now();
    bool r = HasDuplicate(v);
    double secs = chrono::duration<double>(chrono::steady_clock::now() - t0).count();
    tf::ExpectEq(r, true, "result");
    tf::ExpectTrue(secs < 3.0, "must finish in under 3 s (O(N log N))");
  });
}

}  // namespace q81

REGISTER_QUESTION(81, "Duplicate detection in O(N log N)", q81::RunQ81);
