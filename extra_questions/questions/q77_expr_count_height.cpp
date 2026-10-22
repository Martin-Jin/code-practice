// ============================================================================
// Question 77  (4 marks)  -  Expression trees: CountOperators() and Height()
// Topic: Expression trees
//
// Requirements for Expression trees: CountOperators() and Height()
//
// The shape of an expression tree matters: a chain like a - b - c - d - e
// builds a lopsided (left-skewed) tree whose height grows with the expression
// length, while (a + b) * (c + d) stays shallow. Recursive code goes as deep as
// the tree is high. You have been provided with the Node struct, is_op() and
// Mk() / Free() for building and freeing trees.
//
// Task
// Implement two recursive functions:
//   int CountOperators(Node* n)  - the number of operator nodes (tokens for
//                                  which is_op() is true); nullptr gives 0.
//   int Height(Node* n)          - the number of edges on the longest path
//                                  from n down to a leaf: a single leaf has
//                                  height 0 and nullptr has height -1.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include <algorithm>

#include "../../framework/test_framework.h"

namespace q77 {
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

int CountOperators(Node* n);
int Height(Node* n);

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
int CountOperators(Node* n) {
  // TODO
  return 0;
}

int Height(Node* n) {
  // TODO
  return 0;
}
#else
#include "../solutions/q77.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
// (a + b) * (c + d)
static Node* Balanced() {
  return Mk("*", Mk("+", Mk("a"), Mk("b")), Mk("+", Mk("c"), Mk("d")));
}

// a - b - c - d - e (left-skewed)
static Node* Skewed() {
  return Mk("-", Mk("-", Mk("-", Mk("-", Mk("a"), Mk("b")), Mk("c")), Mk("d")),
            Mk("e"));
}

void RunQ77() {
  tf::Test("balanced (a + b) * (c + d)", [] {
    Node* t = Balanced();
    tf::ExpectEq(CountOperators(t), 3, "operators");
    tf::ExpectEq(Height(t), 2, "height");
    Free(t);
  });

  tf::Test("skewed a - b - c - d - e", [] {
    Node* t = Skewed();
    tf::ExpectEq(CountOperators(t), 4, "operators");
    tf::ExpectEq(Height(t), 4, "height");
    Free(t);
  });

  tf::Test("single leaf", [] {
    Node* t = Mk("x");
    tf::ExpectEq(CountOperators(t), 0, "operators");
    tf::ExpectEq(Height(t), 0, "height");
    Free(t);
  });

  tf::HiddenTest("nullptr", [] {
    tf::ExpectEq(CountOperators(nullptr), 0, "operators");
    tf::ExpectEq(Height(nullptr), -1, "height");
  });

  tf::HiddenTest("one operator", [] {
    Node* t = Mk("+", Mk("1"), Mk("2"));
    tf::ExpectEq(CountOperators(t), 1, "operators");
    tf::ExpectEq(Height(t), 1, "height");
    Free(t);
  });

  tf::HiddenTest("right-skewed a ^ b ^ c ^ d and x * (y + 2) - x / y", [] {
    Node* p = Mk("^", Mk("a"), Mk("^", Mk("b"), Mk("^", Mk("c"), Mk("d"))));
    tf::ExpectEq(CountOperators(p), 3, "power operators");
    tf::ExpectEq(Height(p), 3, "power height");
    Free(p);
    Node* t = Mk("-", Mk("*", Mk("x"), Mk("+", Mk("y"), Mk("2"))),
                 Mk("/", Mk("x"), Mk("y")));
    tf::ExpectEq(CountOperators(t), 4, "mixed operators");
    tf::ExpectEq(Height(t), 3, "mixed height");
    Free(t);
  });
}

}  // namespace q77

REGISTER_QUESTION(77, "Expression trees: CountOperators() and Height()", q77::RunQ77);
