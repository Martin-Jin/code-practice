// ============================================================================
// Question 14  (5 marks)  -  Stack application: IsBalanced()
// Topic: Stack and queue
//
// Requirements for Stack application: IsBalanced()
//
// Task
// Implement `bool IsBalanced(const string& text)`. It returns true if every
// bracket in text — (), [] and {} — is closed by the matching bracket in the
// correct order. All other characters are ignored. Use a stack
// (std::stack<char> is allowed). The empty string is balanced.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include <stack>
#include <string>

#include "framework/test_framework.h"

namespace q14 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
bool IsBalanced(const string& text);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
bool IsBalanced(const string& text) {
  // Your implementation here
  return false;
}
#else
#include "../solutions/q14.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ14() {
  tf::Test("simple balanced", [] {
    tf::ExpectEq(IsBalanced("()"), true, "()");
    tf::ExpectEq(IsBalanced("([]{})"), true, "([]{})");
  });
  tf::Test("empty and bracket-free text", [] {
    tf::ExpectEq(IsBalanced(""), true, "empty");
    tf::ExpectEq(IsBalanced("hello world"), true, "no brackets");
  });
  tf::Test("wrong closing bracket", [] {
    tf::ExpectEq(IsBalanced("(]"), false, "(]");
    tf::ExpectEq(IsBalanced("{[}]"), false, "{[}]");
  });
  tf::Test("unclosed brackets", [] {
    tf::ExpectEq(IsBalanced("(("), false, "((");
    tf::ExpectEq(IsBalanced("[()"), false, "[()");
  });

  tf::HiddenTest("closing bracket with nothing open", [] {
    tf::ExpectEq(IsBalanced(")"), false, ")");
    tf::ExpectEq(IsBalanced("())("), false, "())(");
  });
  tf::HiddenTest("brackets mixed with other characters", [] {
    tf::ExpectEq(IsBalanced("int a[3] = {(1+2)*3, 4};"), true, "code");
    tf::ExpectEq(IsBalanced("f(x[1) ]"), false, "interleaved");
  });
  tf::HiddenTest("deep nesting", [] {
    tf::ExpectEq(IsBalanced(string(500, '(') + string(500, ')')), true, "500 deep");
    tf::ExpectEq(IsBalanced(string(500, '(') + string(499, ')')), false, "one missing");
  });
}

}  // namespace q14

REGISTER_QUESTION(14, "Stack application: IsBalanced()", q14::RunQ14);
