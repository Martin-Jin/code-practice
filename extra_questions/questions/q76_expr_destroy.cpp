// ============================================================================
// Question 76  (3 marks)  -  Expression trees: Destroy()
// Topic: Expression trees
//
// Requirements for Expression trees: Destroy()
//
// Every node of an expression tree is created with new, so the tree needs a
// matching delete for each node. You have been provided with the Node struct
// (it keeps a static count `live` of nodes currently alive, which the tests use
// to detect leaks) and a builder Mk().
//
// Task
// Implement void Destroy(Node* n) that frees every node of the tree rooted at
// n using a POST-ORDER traversal (children first, then the node itself).
// Destroy(nullptr) must do nothing. Every node must be deleted exactly once:
// no leaks and no double frees.
//
// Note: there are three visible test cases and two hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q76 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Node {
  static inline int live = 0;  // number of Nodes currently allocated
  string tok;                  // operator or operand
  Node* left;
  Node* right;
  Node(const string& t) : tok(t), left(nullptr), right(nullptr) { ++live; }
  ~Node() { --live; }
};

Node* Mk(const string& t, Node* l = nullptr, Node* r = nullptr) {
  Node* n = new Node(t);
  n->left = l;
  n->right = r;
  return n;
}

void Destroy(Node* n);

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
void Destroy(Node* n) {
  // TODO: free the children before the node itself.
  if (!n) return;
  delete n;
}
#else
#include "../solutions/q76.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ76() {
  tf::Test("single node", [] {
    int before = Node::live;
    Node* t = Mk("x");
    tf::ExpectEq(Node::live - before, 1, "nodes allocated");
    Destroy(t);
    tf::ExpectEq(Node::live - before, 0, "nodes still alive");
  });

  tf::Test("(3 + 5) * (10 - 2) frees all 7 nodes", [] {
    int before = Node::live;
    Node* t = Mk("*", Mk("+", Mk("3"), Mk("5")), Mk("-", Mk("10"), Mk("2")));
    tf::ExpectEq(Node::live - before, 7, "nodes allocated");
    Destroy(t);
    tf::ExpectEq(Node::live - before, 0, "nodes still alive");
  });

  tf::Test("nullptr is safe", [] {
    int before = Node::live;
    Destroy(nullptr);
    tf::ExpectEq(Node::live - before, 0, "live count unchanged");
  });

  tf::HiddenTest("left-skewed chain a - b - c - d - e", [] {
    int before = Node::live;
    Node* t = Mk("-", Mk("-", Mk("-", Mk("-", Mk("a"), Mk("b")), Mk("c")), Mk("d")),
                 Mk("e"));
    tf::ExpectEq(Node::live - before, 9, "nodes allocated");
    Destroy(t);
    tf::ExpectEq(Node::live - before, 0, "nodes still alive");
  });

  tf::HiddenTest("deep right-skewed chain of 1000 operators", [] {
    int before = Node::live;
    Node* t = Mk("1");
    for (int i = 0; i < 1000; ++i) t = Mk("+", Mk("1"), t);
    tf::ExpectEq(Node::live - before, 2001, "nodes allocated");
    Destroy(t);
    tf::ExpectEq(Node::live - before, 0, "nodes still alive");
  });
}

}  // namespace q76

REGISTER_QUESTION(76, "Expression trees: Destroy()", q76::RunQ76);
