// ============================================================================
// Question 75  (5 marks)  -  Expression trees: Fix the bug in ToInfix()
// Topic: Expression trees
//
// Requirements for Expression trees: Fix the bug in ToInfix()
//
// ToInfix() prints an expression tree as an infix string with "just enough"
// brackets. You have been provided with the Node struct, is_op(), prec()
// (^ = 4, * / = 3, + - = 2), right_assoc() (true only for ^) and Mk() / Free().
// The ToInfix() below compiles and passes some tests, but it is WRONG: it
// prints the tree for (2 ^ 3) ^ 2 as "2 ^ 3 ^ 2" (which reads as 2 ^ 9) and the
// tree for a - (b - c) as "a - b - c".
//
// Task
// Find and fix the bugs so ToInfix() obeys this rule for an operator node with
// a child that is itself an operator:
//   - bracket the LEFT child if it binds weaker than the parent, OR binds
//     equally and the parent is right-associative;
//   - bracket the RIGHT child if it binds weaker than the parent, OR binds
//     equally and the parent is left-associative.
// Operand (leaf) children are never bracketed. Output tokens are separated by
// single spaces (brackets touch the text they enclose), e.g.
// "x * (y + 2) - x / y". Do not change the function signature.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q75 {
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
  if (!n) return "";
  if (!is_op(n->tok)) return n->tok;
  string L = ToInfix(n->left), R = ToInfix(n->right);
  int p = prec(n->tok);
  if (n->left && is_op(n->left->tok) && prec(n->left->tok) < p) {
    L = "(" + L + ")";
  }
  if (n->right && is_op(n->right->tok) && prec(n->right->tok) < p) {
    R = "(" + R + ")";
  }
  return L + " " + n->tok + " " + R;
}
#else
#include "../solutions/q75.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static void Check(Node* t, const string& expected) {
  tf::ExpectEq(ToInfix(t), expected, "infix");
  Free(t);
}

void RunQ75() {
  tf::Test("x * (y + 2) - x / y", [] {
    Check(Mk("-", Mk("*", Mk("x"), Mk("+", Mk("y"), Mk("2"))),
             Mk("/", Mk("x"), Mk("y"))),
          "x * (y + 2) - x / y");
  });

  tf::Test("3 + 5 * 2 ^ 3 needs no brackets", [] {
    Check(Mk("+", Mk("3"), Mk("*", Mk("5"), Mk("^", Mk("2"), Mk("3")))),
          "3 + 5 * 2 ^ 3");
  });

  tf::Test("(2 ^ 3) ^ 2 keeps its brackets", [] {
    Check(Mk("^", Mk("^", Mk("2"), Mk("3")), Mk("2")), "(2 ^ 3) ^ 2");
  });

  tf::Test("a - (b - c) keeps its brackets", [] {
    Check(Mk("-", Mk("a"), Mk("-", Mk("b"), Mk("c"))), "a - (b - c)");
  });

  tf::HiddenTest("2 ^ 3 ^ 2 needs no brackets", [] {
    Check(Mk("^", Mk("2"), Mk("^", Mk("3"), Mk("2"))), "2 ^ 3 ^ 2");
  });

  tf::HiddenTest("a + (b + c) and a / (b * c)", [] {
    Check(Mk("+", Mk("a"), Mk("+", Mk("b"), Mk("c"))), "a + (b + c)");
    Check(Mk("/", Mk("a"), Mk("*", Mk("b"), Mk("c"))), "a / (b * c)");
  });

  tf::HiddenTest("left-leaning chains need no brackets", [] {
    Check(Mk("-", Mk("-", Mk("a"), Mk("b")), Mk("c")), "a - b - c");
    Check(Mk("-", Mk("-", Mk("-", Mk("a"), Mk("b")), Mk("c")), Mk("d")),
          "a - b - c - d");
    Check(Mk("x"), "x");
  });
}

}  // namespace q75

REGISTER_QUESTION(75, "Expression trees: Fix the bug in ToInfix()", q75::RunQ75);
