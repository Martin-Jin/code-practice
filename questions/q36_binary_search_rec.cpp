// ============================================================================
// Question 36  (5 marks)  -  Recursion: BinarySearchRec()
// Topic: Recursion, Algorithms and search
//
// Requirements for Recursion: BinarySearchRec()
//
// Task
// Implement `int BinarySearchRec(const vector<int>& v, int key, int low, int high)`.
// v is sorted ascending. The function searches v[low..high] (both inclusive) for
// key and returns the index of the match, or -1 if key is not there. It is first
// called as BinarySearchRec(v, key, 0, (int)v.size() - 1).
//
// Your answer to this question must make use of recursion.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q36 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int BinarySearchRec(const vector<int>& v, int key, int low, int high);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int BinarySearchRec(const vector<int>& v, int key, int low, int high) {
  // Your implementation here
  return -1;
}
#else
#include "../solutions/q36.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
static int Find(const vector<int>& v, int key) {
  return BinarySearchRec(v, key, 0, static_cast<int>(v.size()) - 1);
}

void RunQ36() {
  const vector<int> sorted = {1, 6, 12, 22, 24, 25, 30, 44, 45, 58, 59, 81, 82, 86, 89, 91};

  tf::Test("key in the middle", [&] { tf::ExpectEq(Find(sorted, 44), 7, "index of 44"); });
  tf::Test("first and last elements", [&] {
    tf::ExpectEq(Find(sorted, 1), 0, "index of 1");
    tf::ExpectEq(Find(sorted, 91), 15, "index of 91");
  });
  tf::Test("key not present", [&] {
    tf::ExpectEq(Find(sorted, 99), -1, "99");
    tf::ExpectEq(Find(sorted, 0), -1, "0");
    tf::ExpectEq(Find(sorted, 50), -1, "50");
  });
  tf::Test("empty vector", [] { tf::ExpectEq(Find({}, 5), -1, "empty"); });

  tf::HiddenTest("single element", [] {
    tf::ExpectEq(Find({7}, 7), 0, "present");
    tf::ExpectEq(Find({7}, 8), -1, "absent");
  });
  tf::HiddenTest("every element is found at its own index", [&] {
    for (int i = 0; i < static_cast<int>(sorted.size()); ++i) {
      tf::ExpectEq(Find(sorted, sorted[i]), i, "index of " + to_string(sorted[i]));
    }
  });
  tf::HiddenTest("sub-range only searches low..high", [&] {
    tf::ExpectEq(BinarySearchRec(sorted, 1, 4, 10), -1, "1 is outside [4,10]");
    tf::ExpectEq(BinarySearchRec(sorted, 30, 4, 10), 6, "30 is inside [4,10]");
  });
}

}  // namespace q36

REGISTER_QUESTION(36, "Recursion: BinarySearchRec()", q36::RunQ36);
