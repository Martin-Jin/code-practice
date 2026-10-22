// ============================================================================
// Question 58  (5 marks)  -  Fix the iterator bugs
// Topic: Iterators
//
// Requirements for Fix the iterator bugs
//
// You have been given two functions that compile and run but give wrong
// results. Fix both of them.
//   - void DoubleAll(vector<int>& v)
//       Should multiply every element of v by 2, in place.
//   - void ClampNegativesToZero(vector<int>& v)
//       Should replace every negative element of v by 0, in place.
//
// Keep using iterators / range-based for in your fix. Do not change the
// function signatures.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include <string>
#include <vector>

#include "../../framework/test_framework.h"

namespace q58 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// (nothing: the buggy functions are in the answer box)

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void DoubleAll(vector<int>& v) {
  for (auto x : v) {
    x *= 2;
  }
}

void ClampNegativesToZero(vector<int>& v) {
  if (v.empty()) return;
  for (auto it = v.begin(); it != v.end() - 1; ++it) {
    if (*it < 0) *it = 0;
  }
}
#else
#include "../solutions/q58.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void ExpectVec(const vector<int>& actual, const vector<int>& expected, const string& what) {
  tf::ExpectEq(tf::VecStr(actual), tf::VecStr(expected), what);
}

void RunQ58() {
  tf::Test("DoubleAll modifies the vector", [] {
    vector<int> v = {1, 2, 3, 4};
    DoubleAll(v);
    ExpectVec(v, {2, 4, 6, 8}, "after DoubleAll");
  });

  tf::Test("ClampNegativesToZero on a mixed vector", [] {
    vector<int> v = {3, -1, 4, -5, 9};
    ClampNegativesToZero(v);
    ExpectVec(v, {3, 0, 4, 0, 9}, "after ClampNegativesToZero");
  });

  tf::Test("ClampNegativesToZero must reach the last element", [] {
    vector<int> v = {1, 2, -3};
    ClampNegativesToZero(v);
    ExpectVec(v, {1, 2, 0}, "after ClampNegativesToZero");
  });

  tf::HiddenTest("DoubleAll with negatives and zero", [] {
    vector<int> v = {-2, 0, 5};
    DoubleAll(v);
    ExpectVec(v, {-4, 0, 10}, "after DoubleAll");
  });

  tf::HiddenTest("empty vector (must not crash)", [] {
    vector<int> a, b;
    DoubleAll(a);
    ClampNegativesToZero(b);
    ExpectVec(a, {}, "DoubleAll on empty");
    ExpectVec(b, {}, "ClampNegativesToZero on empty");
  });

  tf::HiddenTest("single negative element", [] {
    vector<int> v = {-7};
    ClampNegativesToZero(v);
    ExpectVec(v, {0}, "single negative");
    vector<int> w = {6};
    ClampNegativesToZero(w);
    ExpectVec(w, {6}, "single positive");
  });
}

}  // namespace q58

REGISTER_QUESTION(58, "Fix the iterator bugs", q58::RunQ58);
