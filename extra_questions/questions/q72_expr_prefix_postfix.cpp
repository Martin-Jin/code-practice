// ============================================================================
// Question 72  (4 marks)  -  Expression trees: ToPrefix() and ToPostfix()
// Topic: Expression trees
//
// Requirements for Expression trees: ToPrefix() and ToPostfix()
//
// The order in which you visit an expression tree picks the notation:
// pre-order (node, left, right) gives PREFIX and post-order (left, right,
// node) gives POSTFIX. You have been provided with the Node struct and Mk() /
// Free() for building and freeing trees.
//
// Task
// Implement string ToPrefix(Node* n) and string ToPostfix(Node* n). Each
// returns the tokens of the tree separated by single spaces, with NO leading
// or trailing space, and "" for nullptr. For the tree of (3 + 5) * (10 - 2):
//   ToPrefix  -> "* + 3 5 - 10 2"
//   ToPostfix -> "3 5 + 10 2 - *"
//
// Note: there are three visible test cases and two hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q72 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Node {
  string tok;  // operator or operand
  Node* left;
  Node* right;
  Node(const string& t) : tok(t), left(nullptr), right(nullptr) {}
};

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

string ToPrefix(Node* n);
string ToPostfix(Node* n);

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
string ToPrefix(Node* n) {
  // TODO: pre-order traversal.
  return "";
}

string ToPostfix(Node* n) {
  // TODO: post-order traversal.
  return "";
}
#else
#include "../solutions/q72.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
// (3 + 5) * (10 - 2)
static Node* Sixty4() {
  return Mk("*", Mk("+", Mk("3"), Mk("5")), Mk("-", Mk("10"), Mk("2")));
}

void RunQ72() {
  tf::Test("ToPrefix of (3 + 5) * (10 - 2)", [] {
    Node* t = Sixty4();
    tf::ExpectEq(ToPrefix(t), string("* + 3 5 - 10 2"), "prefix");
    Free(t);
  });

  tf::Test("ToPostfix of (3 + 5) * (10 - 2)", [] {
    Node* t = Sixty4();
    tf::ExpectEq(ToPostfix(t), string("3 5 + 10 2 - *"), "postfix");
    Free(t);
  });

  tf::Test("single leaf has no extra spaces", [] {
    Node* t = Mk("x");
    tf::ExpectEq(ToPrefix(t), string("x"), "prefix");
    tf::ExpectEq(ToPostfix(t), string("x"), "postfix");
    Free(t);
  });

  tf::HiddenTest("nullptr gives the empty string", [] {
    tf::ExpectEq(ToPrefix(nullptr), string(""), "prefix");
    tf::ExpectEq(ToPostfix(nullptr), string(""), "postfix");
  });

  tf::HiddenTest("x * (y + 2) - x / y", [] {
    Node* t = Mk("-", Mk("*", Mk("x"), Mk("+", Mk("y"), Mk("2"))),
                 Mk("/", Mk("x"), Mk("y")));
    tf::ExpectEq(ToPrefix(t), string("- * x + y 2 / x y"), "prefix");
    tf::ExpectEq(ToPostfix(t), string("x y 2 + * x y / -"), "postfix");
    Free(t);
  });
}

}  // namespace q72

REGISTER_QUESTION(72, "Expression trees: ToPrefix() and ToPostfix()", q72::RunQ72);
