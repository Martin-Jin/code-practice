// ============================================================================
// Question 15  (5 marks)  -  Stack application: EvaluatePostfix()
// Topic: Stack and queue
//
// Requirements for Stack application: EvaluatePostfix()
//
// Task
// Implement `int EvaluatePostfix(const string& expression)`. The expression is
// in postfix (reverse Polish) notation: space-separated tokens, each either an
// integer (possibly negative) or one of the operators + - * /. Use a stack
// (std::stack<int> is allowed): push numbers; on an operator pop the right
// operand, then the left operand, and push the result. Division is integer
// division. Return the single value left on the stack. The input is always a
// valid expression.
//
//   "3 4 +"        -> 7
//   "5 1 2 + 4 * + 3 -" -> 14
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include <sstream>
#include <stack>
#include <string>

#include "framework/test_framework.h"

namespace q15 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int EvaluatePostfix(const string& expression);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int EvaluatePostfix(const string& expression) {
  // Your implementation here
  return 0;
}
#else
#include "../solutions/q15.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ15() {
  tf::Test("single number", [] { tf::ExpectEq(EvaluatePostfix("42"), 42, "42"); });
  tf::Test("addition", [] { tf::ExpectEq(EvaluatePostfix("3 4 +"), 7, "3 4 +"); });
  tf::Test("mixed operators", [] {
    tf::ExpectEq(EvaluatePostfix("5 1 2 + 4 * + 3 -"), 14, "5 1 2 + 4 * + 3 -");
  });
  tf::Test("multiplication and division", [] {
    tf::ExpectEq(EvaluatePostfix("6 3 /"), 2, "6 3 /");
    tf::ExpectEq(EvaluatePostfix("2 3 4 * *"), 24, "2 3 4 * *");
  });

  tf::HiddenTest("operand order matters for - and /", [] {
    tf::ExpectEq(EvaluatePostfix("10 4 -"), 6, "10 4 -");
    tf::ExpectEq(EvaluatePostfix("20 5 /"), 4, "20 5 /");
    tf::ExpectEq(EvaluatePostfix("1 2 -"), -1, "1 2 -");
  });
  tf::HiddenTest("negative numbers and multi-digit values", [] {
    tf::ExpectEq(EvaluatePostfix("-3 12 +"), 9, "-3 12 +");
    tf::ExpectEq(EvaluatePostfix("100 25 - 3 *"), 225, "100 25 - 3 *");
  });
  tf::HiddenTest("integer division truncates", [] {
    tf::ExpectEq(EvaluatePostfix("7 2 /"), 3, "7 2 /");
    tf::ExpectEq(EvaluatePostfix("2 3 + 2 /"), 2, "2 3 + 2 /");
  });
}

}  // namespace q15

REGISTER_QUESTION(15, "Stack application: EvaluatePostfix()", q15::RunQ15);
