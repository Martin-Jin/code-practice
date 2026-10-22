// ============================================================================
// Question 74  (8 marks)  -  Expression trees: InfixToPostfix()
// Topic: Expression trees
//
// Requirements for Expression trees: InfixToPostfix()
//
// People write infix; it is easier to build a tree from postfix. Dijkstra's
// shunting-yard algorithm converts one to the other in a single pass: operands
// go straight to the output, operators wait on a stack until it is their turn.
// You have been provided with is_op() (true for + - * / ^), prec() (^ = 4,
// * / = 3, + - = 2) and right_assoc() (true only for ^).
//
// Task
// Implement vector<string> InfixToPostfix(const vector<string>& infix). The
// input is already tokenised, one token per element, e.g.
// {"x","*","(","y","+","2",")"}. Use an operator stack (vector<string>):
//   - operand : append to the output
//   - operator: while the stack top is an operator that outranks the incoming
//               one, or has EQUAL precedence and the incoming one is
//               left-associative, pop it to the output; then push the incoming
//               operator
//   - "("     : push it
//   - ")"     : pop operators to the output until "(", then discard the "(";
//               if no "(" is found throw std::runtime_error
//   - end     : pop everything left to the output; a leftover "(" throws
//               std::runtime_error
// Anything that is not an operator or a bracket is an operand.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include <stdexcept>

#include "../../framework/test_framework.h"

namespace q74 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
static inline bool is_op(const string& t) {
  return t.size() == 1 && string("+-*/^").find(t[0]) != string::npos;
}

static inline int prec(const string& op) {
  if (op == "^") return 4;
  if (op == "*" || op == "/") return 3;
  if (op == "+" || op == "-") return 2;
  return 1;
}

static inline bool right_assoc(const string& op) { return op == "^"; }

vector<string> InfixToPostfix(const vector<string>& infix);

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
vector<string> InfixToPostfix(const vector<string>& infix) {
  // TODO: shunting-yard.
  return vector<string>();
}
#else
#include "../solutions/q74.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static bool Throws(const vector<string>& infix) {
  try {
    InfixToPostfix(infix);
  } catch (const runtime_error&) {
    return true;
  }
  return false;
}

static void Check(const vector<string>& infix, const vector<string>& expected) {
  tf::ExpectEq(tf::VecStr(InfixToPostfix(infix)), tf::VecStr(expected), "postfix");
}

void RunQ74() {
  tf::Test("x * ( y + 2 ) - x / y", [] {
    Check({"x", "*", "(", "y", "+", "2", ")", "-", "x", "/", "y"},
          {"x", "y", "2", "+", "*", "x", "y", "/", "-"});
  });

  tf::Test("( 3 + 5 ) * ( 10 - 2 )", [] {
    Check({"(", "3", "+", "5", ")", "*", "(", "10", "-", "2", ")"},
          {"3", "5", "+", "10", "2", "-", "*"});
  });

  tf::Test("precedence: 3 + 5 * 2", [] {
    Check({"3", "+", "5", "*", "2"}, {"3", "5", "2", "*", "+"});
  });

  tf::Test("single operand", [] { Check({"x"}, {"x"}); });

  tf::HiddenTest("left-associative: a - b - c", [] {
    Check({"a", "-", "b", "-", "c"}, {"a", "b", "-", "c", "-"});
  });

  tf::HiddenTest("right-associative: 2 ^ 3 ^ 2", [] {
    Check({"2", "^", "3", "^", "2"}, {"2", "3", "2", "^", "^"});
    Check({"a", "*", "b", "^", "c", "^", "d", "+", "e"},
          {"a", "b", "c", "d", "^", "^", "*", "e", "+"});
  });

  tf::HiddenTest("mismatched brackets throw runtime_error", [] {
    tf::ExpectTrue(Throws({"(", "3", "+", "5"}), "missing ')'");
    tf::ExpectTrue(Throws({"3", "+", "5", ")"}), "missing '('");
    tf::ExpectTrue(Throws({"(", "(", "1", "+", "2", ")"}), "one '(' left over");
    tf::ExpectTrue(!Throws({"(", "(", "1", ")", ")"}), "nested brackets are fine");
  });
}

}  // namespace q74

REGISTER_QUESTION(74, "Expression trees: InfixToPostfix()", q74::RunQ74);
