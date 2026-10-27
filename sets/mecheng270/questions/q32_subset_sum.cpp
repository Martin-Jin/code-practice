// ============================================================================
// Question 32  (5 marks)  -  Recursion: CountSubsets()
// Topic: Recursion
// Restrict: no-loops, recursive
//
// Requirements for Recursion: CountSubsets()
//
// Task
// Write a recursive function
//     int CountSubsets(const vector<int>& v, int index, int target)
// that returns how many subsets of the elements v[index], v[index+1], ...,
// v[v.size()-1] add up to exactly `target`. The empty subset has sum 0 and
// counts as a subset. Two subsets are different if they use different
// positions, so for v = {2, 2} and target 2 the answer is 2.
//
// Example: v = {1, 2, 3}, target = 3, index = 0 -> {3} and {1, 2} -> returns 2.
//
// Think of each element as a choice: either it is in the subset (so the target
// shrinks by its value) or it is not. Your function must be recursive; loops
// are not allowed. The tests call it with index = 0.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q32 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int CountSubsets(const vector<int>& v, int index, int target);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int CountSubsets(const vector<int>& v, int index, int target) {
  // Your implementation here
  return 0;
}
#else
#include "../solutions/q32.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ32() {
  tf::Test("{1,2,3} sums to 3 two ways", [] {
    tf::ExpectEq(CountSubsets({1, 2, 3}, 0, 3), 2, "CountSubsets({1,2,3}, 3)");
  });

  tf::Test("{1,2,3,4} sums to 5 two ways", [] {
    tf::ExpectEq(CountSubsets({1, 2, 3, 4}, 0, 5), 2, "CountSubsets({1,2,3,4}, 5)");
  });

  tf::Test("equal values count as different subsets", [] {
    tf::ExpectEq(CountSubsets({2, 2, 2}, 0, 4), 3, "CountSubsets({2,2,2}, 4)");
    tf::ExpectEq(CountSubsets({1, 1, 1, 1}, 0, 2), 6, "CountSubsets({1,1,1,1}, 2)");
  });

  tf::Test("empty subset sums to 0", [] {
    tf::ExpectEq(CountSubsets({}, 0, 0), 1, "empty vector, target 0");
    tf::ExpectEq(CountSubsets({4, 7}, 0, 0), 1, "{4,7}, target 0");
  });

  tf::HiddenTest("larger example", [] {
    tf::ExpectEq(CountSubsets({5, 10, 12, 13, 15, 18}, 0, 30), 3, "target 30");
  });

  tf::HiddenTest("target not reachable", [] {
    tf::ExpectEq(CountSubsets({2, 4, 6}, 0, 7), 0, "target 7");
    tf::ExpectEq(CountSubsets({}, 0, 3), 0, "empty vector, target 3");
  });

  tf::HiddenTest("all elements together", [] {
    tf::ExpectEq(CountSubsets({1, 2, 3, 4, 5}, 0, 15), 1, "whole set");
    tf::ExpectEq(CountSubsets({1, 2, 3, 4, 5, 6, 7}, 0, 7), 5, "{7},{1,6},{2,5},{3,4},{1,2,4}");
  });
}

}  // namespace q32

REGISTER_QUESTION(32, "Recursion: CountSubsets()", q32::RunQ32);
