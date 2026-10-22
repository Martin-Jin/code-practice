// ============================================================================
// Question 59  (5 marks)  -  K-th element from the end of a list
// Topic: Iterators
//
// Requirements for K-th element from the end of a list
//
// Task
// Write the function
//   int KthFromEnd(const list<int>& l, int k)
// that returns the k-th element counting from the end, where k = 1 is the
// last element, k = 2 the second-to-last, and so on. If k < 1 or k is larger
// than the size of the list, return -1.
//
// A list has bidirectional iterators, so end() - k does not compile. Step
// back from end() with std::prev. Do not copy the list into a vector.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include <iterator>
#include <list>

#include "../../framework/test_framework.h"

namespace q59 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// (the headers above are included for you)

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int KthFromEnd(const list<int>& l, int k) {
  // Your implementation here
  return -1;
}
#else
#include "../solutions/q59.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ59() {
  tf::Test("k = 1 is the last element", [] {
    list<int> l = {10, 20, 30, 40};
    tf::ExpectEq(KthFromEnd(l, 1), 40, "KthFromEnd(l, 1)");
  });

  tf::Test("k in the middle", [] {
    list<int> l = {10, 20, 30, 40, 50};
    tf::ExpectEq(KthFromEnd(l, 2), 40, "KthFromEnd(l, 2)");
    tf::ExpectEq(KthFromEnd(l, 3), 30, "KthFromEnd(l, 3)");
  });

  tf::Test("k == size gives the first element", [] {
    list<int> l = {7, 8, 9};
    tf::ExpectEq(KthFromEnd(l, 3), 7, "KthFromEnd(l, 3)");
  });

  tf::HiddenTest("k too large returns -1", [] {
    list<int> l = {1, 2, 3};
    tf::ExpectEq(KthFromEnd(l, 4), -1, "k = size + 1");
    tf::ExpectEq(KthFromEnd(l, 100), -1, "k >> size");
  });

  tf::HiddenTest("k < 1 returns -1", [] {
    list<int> l = {1, 2, 3};
    tf::ExpectEq(KthFromEnd(l, 0), -1, "k = 0");
    tf::ExpectEq(KthFromEnd(l, -2), -1, "k = -2");
  });

  tf::HiddenTest("size-1 and empty lists", [] {
    list<int> one = {5};
    tf::ExpectEq(KthFromEnd(one, 1), 5, "single element, k = 1");
    tf::ExpectEq(KthFromEnd(one, 2), -1, "single element, k = 2");
    list<int> empty;
    tf::ExpectEq(KthFromEnd(empty, 1), -1, "empty list");
  });
}

}  // namespace q59

REGISTER_QUESTION(59, "K-th element from the end of a list", q59::RunQ59);
