// ============================================================================
// Question 54  (4 marks)  -  Join any container with an iterator loop
// Topic: Iterators
//
// Requirements for Join any container with an iterator loop
//
// Task
// Write the templated function
//   template <typename Container>
//   string JoinWithIterators(const Container& c)
// that returns the elements of `c` separated by single spaces, with no
// leading or trailing space. For example {1, 2, 3} gives "1 2 3". An empty
// container gives "".
//
// You must traverse the container with an iterator loop using begin() and
// end(). Do NOT use indexing (c[i]): it would not compile for list or set.
// The function must work for vector, list and set (a set is printed in its
// sorted order) and for element types that can be streamed with <<.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include <list>
#include <set>
#include <sstream>
#include <string>
#include <vector>

#include "../../framework/test_framework.h"

namespace q54 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// (the headers above are included for you)

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
template <typename Container>
string JoinWithIterators(const Container& c) {
  // Your implementation here
  return "";
}
#else
#include "../solutions/q54.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ54() {
  tf::Test("vector<int>", [] {
    vector<int> v = {1, 2, 3};
    tf::ExpectEq(JoinWithIterators(v), "1 2 3", "joined vector");
  });

  tf::Test("list<int>", [] {
    list<int> l = {6, 7, 8, 9, 10};
    tf::ExpectEq(JoinWithIterators(l), "6 7 8 9 10", "joined list");
  });

  tf::Test("set<int> is printed in sorted order", [] {
    set<int> s = {15, 11, 13, 12, 14};
    tf::ExpectEq(JoinWithIterators(s), "11 12 13 14 15", "joined set");
  });

  tf::HiddenTest("vector<string>", [] {
    vector<string> v = {"iterators", "are", "pointer-like"};
    tf::ExpectEq(JoinWithIterators(v), "iterators are pointer-like", "joined strings");
  });

  tf::HiddenTest("empty containers give an empty string", [] {
    vector<int> v;
    list<int> l;
    set<int> s;
    tf::ExpectEq(JoinWithIterators(v), "", "empty vector");
    tf::ExpectEq(JoinWithIterators(l), "", "empty list");
    tf::ExpectEq(JoinWithIterators(s), "", "empty set");
  });

  tf::HiddenTest("single element and duplicates", [] {
    vector<int> one = {-42};
    tf::ExpectEq(JoinWithIterators(one), "-42", "single element");
    set<int> dup = {3, 3, 1, 1};
    tf::ExpectEq(JoinWithIterators(dup), "1 3", "set removes duplicates");
    list<int> l = {2, 2, 2};
    tf::ExpectEq(JoinWithIterators(l), "2 2 2", "list keeps duplicates");
  });
}

}  // namespace q54

REGISTER_QUESTION(54, "Join any container with an iterator loop", q54::RunQ54);
