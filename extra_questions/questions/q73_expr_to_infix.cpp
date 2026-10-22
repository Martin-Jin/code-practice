// ============================================================================
// Question 73  (8 marks)  -  Expression trees: ToInfix()
// Topic: Expression trees
//
// Requirements for Expression trees: ToInfix()
//
// A plain in-order walk of an expression tree loses the structure: the tree for
// (3 + 5) * 2 would print as 3 + 5 * 2. A good infix printer adds just enough
// brackets. You have been provided with the Node struct, is_op(), prec()
// (^ = 4, * / = 3, + - = 2) and right_assoc() (true only for ^), plus Mk() /
// Free() for building and freeing trees.
//
// Task
// Implement string ToInfix(Node* n). Tokens (operands, operators and brackets)
// are separated by single spaces, except that a bracket touches the text it
// encloses, e.g. "x * (y + 2) - x / y". Return "" for nullptr. Use this rule
// for an operator node with a child that is itself an operator:
//   - bracket the LEFT child if it binds weaker than the parent, OR binds
//     equally and the parent is right-associative;
//   - bracket the RIGHT child if it binds weaker than the parent, OR binds
//     equally and the parent is left-associative.
// Operand (leaf) children are never bracketed. Examples:
//   3 + 5 * 2 ^ 3     (2 ^ 3) ^ 2     2 ^ 3 ^ 2     a - (b - c)     a + (b + c)
//
// Note: there are four visible test cases and four hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q73 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Node {
  string tok;  // operator or operand
  Node* left;
  Node* right;
  Node(const string& t) : tok(t), left(nullptr), right(nullptr) {}
};

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

Node* Mk(const string& t, Node* l = nullptr, Node* r = nullptr) {
  Node* n = new Node(t);
  n->left = l;
  n->right = r;
  return n;
}

void Free(Node* n) {
  if (!n) return;
  Free(n->left);
  Free(n->right);
  delete n;
}

string ToInfix(Node* n);

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
string ToInfix(Node* n) {
  // Starting point: plain in-order with no brackets at all.
  if (!n) return "";
  if (!is_op(n->tok)) return n->tok;
  return ToInfix(n->left) + " " + n->tok + " " + ToInfix(n->right);
}
#else
#include "../solutions/q73.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static void Check(Node* t, const string& expected) {
  tf::ExpectEq(ToInfix(t), expected, "infix");
  Free(t);
}

void RunQ73() {
  tf::Test("(3 + 5) * (10 - 2)", [] {
    Check(Mk("*", Mk("+", Mk("3"), Mk("5")), Mk("-", Mk("10"), Mk("2"))),
          "(3 + 5) * (10 - 2)");
  });

  tf::Test("x * (y + 2) - x / y", [] {
    Check(Mk("-", Mk("*", Mk("x"), Mk("+", Mk("y"), Mk("2"))),
             Mk("/", Mk("x"), Mk("y"))),
          "x * (y + 2) - x / y");
  });

  tf::Test("no brackets needed: 3 + 5 * 2 ^ 3", [] {
    Check(Mk("+", Mk("3"), Mk("*", Mk("5"), Mk("^", Mk("2"), Mk("3")))),
          "3 + 5 * 2 ^ 3");
  });

  tf::Test("single leaf", [] { Check(Mk("x"), "x"); });

  tf::HiddenTest("nullptr gives the empty string", [] {
    tf::ExpectEq(ToInfix(nullptr), string(""), "infix");
  });

  tf::HiddenTest("power is right-associative", [] {
    Check(Mk("^", Mk("^", Mk("2"), Mk("3")), Mk("2")), "(2 ^ 3) ^ 2");
    Check(Mk("^", Mk("2"), Mk("^", Mk("3"), Mk("2"))), "2 ^ 3 ^ 2");
  });

  tf::HiddenTest("equal precedence on the right of a left-associative op", [] {
    Check(Mk("-", Mk("a"), Mk("-", Mk("b"), Mk("c"))), "a - (b - c)");
    Check(Mk("+", Mk("a"), Mk("+", Mk("b"), Mk("c"))), "a + (b + c)");
    Check(Mk("/", Mk("a"), Mk("*", Mk("b"), Mk("c"))), "a / (b * c)");
  });

  tf::HiddenTest("equal precedence on the left of a left-associative op", [] {
    Check(Mk("-", Mk("-", Mk("a"), Mk("b")), Mk("c")), "a - b - c");
    Check(Mk("*", Mk("/", Mk("a"), Mk("b")), Mk("c")), "a / b * c");
    Check(Mk("^", Mk("*", Mk("a"), Mk("b")), Mk("2")), "(a * b) ^ 2");
  });
}

}  // namespace q73

REGISTER_QUESTION(73, "Expression trees: ToInfix()", q73::RunQ73);
