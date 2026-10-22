// ============================================================================
// Question 56  (5 marks)  -  Mirror swap with two iterators
// Topic: Iterators
//
// Requirements for Mirror swap with two iterators
//
// Task
// Write the function
//   void MirrorSwap(vector<int>& v)
// that swaps the first element with the last, the second with the second-to-
// last, and so on, so that the vector ends up reversed in place. For an odd
// length the middle element stays where it is. An empty vector is allowed.
//
// Walk two iterators towards each other: one starting at begin(), one at the
// last element, stopping when they meet or cross. Do not create a second
// vector and do not use index loops.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include <algorithm>
#include <string>
#include <vector>

#include "../../framework/test_framework.h"

namespace q56 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// (nothing: just write the function below; std::swap is available)

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void MirrorSwap(vector<int>& v) {
  // Your implementation here
}
#else
#include "../solutions/q56.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void ExpectVec(const vector<int>& actual, const vector<int>& expected, const string& what) {
  tf::ExpectEq(tf::VecStr(actual), tf::VecStr(expected), what);
}

void RunQ56() {
  tf::Test("even length (course example)", [] {
    vector<int> v = {5, 18, 19, 4, 10, 12, 20, 1, 8, 6};
    MirrorSwap(v);
    ExpectVec(v, {6, 8, 1, 20, 12, 10, 4, 19, 18, 5}, "after MirrorSwap");
  });

  tf::Test("odd length keeps the middle", [] {
    vector<int> v = {1, 2, 3, 4, 5};
    MirrorSwap(v);
    ExpectVec(v, {5, 4, 3, 2, 1}, "after MirrorSwap");
  });

  tf::Test("two elements", [] {
    vector<int> v = {1, 2};
    MirrorSwap(v);
    ExpectVec(v, {2, 1}, "after MirrorSwap");
  });

  tf::HiddenTest("empty vector", [] {
    vector<int> v;
    MirrorSwap(v);
    ExpectVec(v, {}, "after MirrorSwap");
  });

  tf::HiddenTest("single element", [] {
    vector<int> v = {9};
    MirrorSwap(v);
    ExpectVec(v, {9}, "after MirrorSwap");
  });

  tf::HiddenTest("applying it twice restores the original", [] {
    vector<int> v = {3, -1, 4, 1, -5, 9, 2};
    MirrorSwap(v);
    ExpectVec(v, {2, 9, -5, 1, 4, -1, 3}, "after one MirrorSwap");
    MirrorSwap(v);
    ExpectVec(v, {3, -1, 4, 1, -5, 9, 2}, "after two MirrorSwaps");
  });
}

}  // namespace q56

REGISTER_QUESTION(56, "Mirror swap with two iterators", q56::RunQ56);
