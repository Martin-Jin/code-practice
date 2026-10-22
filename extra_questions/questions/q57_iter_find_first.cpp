// ============================================================================
// Question 57  (5 marks)  -  Write your own find with iterators
// Topic: Iterators
//
// Requirements for Write your own find with iterators
//
// Task
// Write the templated function
//   template <typename It, typename T>
//   It FindFirst(It first, It last, const T& value)
// that searches the range [first, last) and returns an iterator to the first
// element equal to `value`. If there is no such element, return `last`.
//
// Use only operations every iterator supports (++, *, ==, !=). Do not use
// arithmetic such as first + 1 or last - first: it would not compile for list
// or set iterators. The function is tested on vector, list and set.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include <iterator>
#include <list>
#include <set>
#include <string>
#include <vector>

#include "../../framework/test_framework.h"

namespace q57 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// (the headers above are included for you)

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
template <typename It, typename T>
It FindFirst(It first, It last, const T& value) {
  // Your implementation here
  return last;
}
#else
#include "../solutions/q57.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ57() {
  tf::Test("vector: found", [] {
    vector<int> v = {4, 8, 15, 16, 23, 42};
    auto it = FindFirst(v.begin(), v.end(), 15);
    tf::ExpectTrue(it != v.end(), "iterator should not be end()");
    if (it != v.end()) {
      tf::ExpectEq(*it, 15, "*it");
      tf::ExpectEq(distance(v.begin(), it), 2, "distance from begin");
    }
  });

  tf::Test("list: found", [] {
    list<int> l = {6, 7, 8, 9, 10};
    auto it = FindFirst(l.begin(), l.end(), 9);
    tf::ExpectTrue(it != l.end(), "iterator should not be end()");
    if (it != l.end()) {
      tf::ExpectEq(*it, 9, "*it");
      tf::ExpectEq(distance(l.begin(), it), 3, "distance from begin");
    }
  });

  tf::Test("set: not found returns last", [] {
    set<int> s = {11, 12, 13, 14, 15};
    auto it = FindFirst(s.begin(), s.end(), 99);
    tf::ExpectTrue(it == s.end(), "should return end() when missing");
  });

  tf::HiddenTest("duplicates: returns the first match", [] {
    vector<int> v = {1, 7, 3, 7, 7};
    auto it = FindFirst(v.begin(), v.end(), 7);
    tf::ExpectTrue(it != v.end(), "iterator should not be end()");
    if (it != v.end()) tf::ExpectEq(distance(v.begin(), it), 1, "distance from begin");
  });

  tf::HiddenTest("empty range returns last", [] {
    vector<int> v;
    list<int> l;
    tf::ExpectTrue(FindFirst(v.begin(), v.end(), 1) == v.end(), "empty vector");
    tf::ExpectTrue(FindFirst(l.begin(), l.end(), 1) == l.end(), "empty list");
  });

  tf::HiddenTest("sub-range, first and last element, strings", [] {
    vector<int> v = {5, 6, 7, 8, 9};
    // Search only [begin + 1, begin + 3): 5 and 8 are outside it.
    auto sub_last = v.begin() + 3;
    tf::ExpectTrue(FindFirst(v.begin() + 1, sub_last, 8) == sub_last,
                   "8 is outside the range, expect last");
    tf::ExpectTrue(FindFirst(v.begin(), v.end(), 5) == v.begin(), "first element");
    auto it = FindFirst(v.begin(), v.end(), 9);
    tf::ExpectTrue(it == v.end() - 1, "last element");
    set<string> words = {"cat", "dog", "emu"};
    auto w = FindFirst(words.begin(), words.end(), string("dog"));
    tf::ExpectTrue(w != words.end() && *w == "dog", "set<string> lookup");
  });
}

}  // namespace q57

REGISTER_QUESTION(57, "Write your own find with iterators", q57::RunQ57);
