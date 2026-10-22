// ============================================================================
// Question 55  (4 marks)  -  Reverse copy with reverse iterators
// Topic: Iterators
//
// Requirements for Reverse copy with reverse iterators
//
// Task
// Write the function
//   vector<int> ReverseCopy(const vector<int>& v)
// that returns a new vector holding the elements of `v` in reverse order.
// The input vector must not be modified. For example {1, 2, 3} gives {3, 2, 1}.
//
// You must use the reverse iterators rbegin() and rend(). Do not use index
// loops (no v[i], no v.at(i)).
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include <string>
#include <vector>

#include "../../framework/test_framework.h"

namespace q55 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// (nothing: just write the function below)

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
vector<int> ReverseCopy(const vector<int>& v) {
  // Your implementation here
  return vector<int>();
}
#else
#include "../solutions/q55.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void ExpectVec(const vector<int>& actual, const vector<int>& expected, const string& what) {
  tf::ExpectEq(tf::VecStr(actual), tf::VecStr(expected), what);
}

void RunQ55() {
  tf::Test("odd length", [] {
    ExpectVec(ReverseCopy({1, 2, 3, 4, 5}), {5, 4, 3, 2, 1}, "reversed");
  });

  tf::Test("even length (course example)", [] {
    ExpectVec(ReverseCopy({5, 18, 19, 4, 10, 12, 20, 1, 8, 6}),
              {6, 8, 1, 20, 12, 10, 4, 19, 18, 5}, "reversed");
  });

  tf::Test("input is not modified", [] {
    const vector<int> v = {1, 2, 3};
    vector<int> r = ReverseCopy(v);
    ExpectVec(v, {1, 2, 3}, "original");
    ExpectVec(r, {3, 2, 1}, "copy");
  });

  tf::HiddenTest("empty vector", [] {
    ExpectVec(ReverseCopy({}), {}, "reversed empty");
  });

  tf::HiddenTest("single element", [] {
    ExpectVec(ReverseCopy({7}), {7}, "reversed single");
  });

  tf::HiddenTest("duplicates and negatives", [] {
    ExpectVec(ReverseCopy({-1, 0, 0, -1, 9}), {9, -1, 0, 0, -1}, "reversed");
  });
}

}  // namespace q55

REGISTER_QUESTION(55, "Reverse copy with reverse iterators", q55::RunQ55);
