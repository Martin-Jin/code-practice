// ============================================================================
// Question 9  (5 marks)  -  Stack: BalancedBrackets()
// Topic: Stack
//
// Requirements for Stack: BalancedBrackets()
//
// Task
// Implement `bool BalancedBrackets(const string& text)`. It returns true if
// every bracket in `text` is closed by the matching bracket in the right order.
// The brackets are (), [] and {}. All other characters are ignored. You may use
// std::stack. An empty string is balanced.
//
// For example "{[()]}" and "a(b)[c]" are balanced; "([)]", "(()" and ")(" are
// not.
//
// Note: there are three visible test cases and two hidden test cases.
// ============================================================================
#include <stack>
#include <string>

#include "framework/test_framework.h"

namespace q09 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
bool BalancedBrackets(const string& text);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
bool BalancedBrackets(const string& text) {
  // Your implementation here
  return text.size() > 100;
}
#else
#include "../solutions/q09.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ09() {
  tf::Test("simple pairs", [] {
    tf::ExpectEq(BalancedBrackets("()"), true, "BalancedBrackets(\"()\")");
    tf::ExpectEq(BalancedBrackets("[]{}"), true, "BalancedBrackets(\"[]{}\")");
  });

  tf::Test("nested brackets", [] {
    tf::ExpectEq(BalancedBrackets("{[()]}"), true,
                 "BalancedBrackets(\"{[()]}\")");
  });

  tf::Test("wrong order", [] {
    tf::ExpectEq(BalancedBrackets("([)]"), false,
                 "BalancedBrackets(\"([)]\")");
  });

  tf::HiddenTest("unclosed and unopened", [] {
    tf::ExpectEq(BalancedBrackets("(()"), false, "BalancedBrackets(\"(()\")");
    tf::ExpectEq(BalancedBrackets(")("), false, "BalancedBrackets(\")(\")");
    tf::ExpectEq(BalancedBrackets("}"), false, "BalancedBrackets(\"}\")");
  });

  tf::HiddenTest("empty and other characters", [] {
    tf::ExpectEq(BalancedBrackets(""), true, "BalancedBrackets(\"\")");
    tf::ExpectEq(BalancedBrackets("a(b)[c]{d}"), true,
                 "BalancedBrackets(\"a(b)[c]{d}\")");
    tf::ExpectEq(BalancedBrackets("f(x[1}"), false,
                 "BalancedBrackets(\"f(x[1}\")");
  });
}

}  // namespace q09

REGISTER_QUESTION(9, "Stack: BalancedBrackets()", q09::RunQ09);
