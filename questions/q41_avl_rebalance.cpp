// ============================================================================
// Question 41  (5 marks)  -  AVL tree: Rebalance()
// Topic: AVL trees
//
// Requirements for AVL tree: Rebalance()
//
// You have been provided with an AVL node, the helpers GetHeight(),
// GetBalance(), UpdateHeight(), and the two single rotations RotateRight() and
// RotateLeft() (each returns the new subtree root and fixes the heights).
//
// Task
// Implement Node* Rebalance(Node* n). Called on a node whose children are
// already valid AVL trees, it returns the root of the rebalanced subtree.
//   - balance of n in [-1, 1]  -> nothing to do, return n.
//   - left-heavy (balance > 1):
//       left child not right-heavy -> left-left case:  RotateRight(n)
//       left child right-heavy     -> left-right case: RotateLeft the left
//                                     child first, then RotateRight(n)
//   - right-heavy (balance < -1):
//       right child not left-heavy -> right-right case: RotateLeft(n)
//       right child left-heavy     -> right-left case:  RotateRight the right
//                                     child first, then RotateLeft(n)
//   - Rebalance(nullptr) returns nullptr.
// Remember that when the heavy child has balance 0 (this happens after a
// removal) a single rotation is the correct fix.
//
// Note: there are five visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q41 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Node {
  int data;
  Node* left;
  Node* right;
  int height;
  Node(const int& value) : data(value), left(nullptr), right(nullptr), height(0) {}
};

int GetHeight(Node* n) { return n ? n->height : -1; }

int GetBalance(Node* n) { return n ? GetHeight(n->left) - GetHeight(n->right) : 0; }

Node* UpdateHeight(Node* n) {
  if (n) n->height = 1 + max(GetHeight(n->left), GetHeight(n->right));
  return n;
}

Node* RotateRight(Node* k2) {
  Node* k1 = k2->left;
  Node* y = k1->right;
  k1->right = k2;
  k2->left = y;
  UpdateHeight(k2);
  UpdateHeight(k1);
  return k1;
}

Node* RotateLeft(Node* k1) {
  Node* k2 = k1->right;
  Node* y = k2->left;
  k2->left = k1;
  k1->right = y;
  UpdateHeight(k1);
  UpdateHeight(k2);
  return k2;
}

Node* Rebalance(Node* n);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
Node* Rebalance(Node* n) {
  // Your implementation here
  return n;
}
#else
#include "../solutions/q41.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
namespace {
bool bad = false;  // set when Shape() sees a cycle or an implausibly deep tree

// Preorder text such as "20/2(10/0(-,-),30/1(-,-))" = value/height(left,right).
string Shape(const Node* n, int depth = 0) {
  if (!n) return "-";
  if (depth > 12) {
    bad = true;
    return "!";
  }
  return to_string(n->data) + "/" + to_string(n->height) + "(" + Shape(n->left, depth + 1) + "," +
         Shape(n->right, depth + 1) + ")";
}

// Builds a node whose height is computed independently of the student's code.
Node* Mk(int v, Node* l = nullptr, Node* r = nullptr) {
  Node* n = new Node(v);
  n->left = l;
  n->right = r;
  int hl = l ? l->height : -1, hr = r ? r->height : -1;
  n->height = 1 + max(hl, hr);
  return n;
}

void Free(Node* n) {
  if (!n) return;
  Free(n->left);
  Free(n->right);
  delete n;
}

// Compares structure, values and cached heights; frees both trees.
void ExpectShape(Node* actual, Node* expected, const string& what) {
  bad = false;
  string a = Shape(actual), e = Shape(expected);
  if (a == e && !bad) Free(actual);  // never free a damaged tree
  Free(expected);
  tf::ExpectEq(a, e, what);
}
}  // namespace

void RunQ41() {
  tf::Test("left-left case", [] {
    Node* root = Mk(30, Mk(20, Mk(10)));
    ExpectShape(Rebalance(root), Mk(20, Mk(10), Mk(30)), "tree after Rebalance");
  });

  tf::Test("right-right case", [] {
    Node* root = Mk(10, nullptr, Mk(20, nullptr, Mk(30)));
    ExpectShape(Rebalance(root), Mk(20, Mk(10), Mk(30)), "tree after Rebalance");
  });

  tf::Test("left-right case", [] {
    Node* root = Mk(30, Mk(10, nullptr, Mk(20)));
    ExpectShape(Rebalance(root), Mk(20, Mk(10), Mk(30)), "tree after Rebalance");
  });

  tf::Test("right-left case", [] {
    Node* root = Mk(10, nullptr, Mk(30, Mk(20)));
    ExpectShape(Rebalance(root), Mk(20, Mk(10), Mk(30)), "tree after Rebalance");
  });

  tf::Test("an already balanced node is returned unchanged", [] {
    Node* root = Mk(20, Mk(10, Mk(5)), Mk(30));  // balance +1
    Node* same = root;
    Node* got = Rebalance(root);
    tf::ExpectTrue(got == same, "the same root pointer is returned");
    ExpectShape(got, Mk(20, Mk(10, Mk(5)), Mk(30)), "tree is untouched");
  });

  tf::HiddenTest("Rebalance(nullptr) returns nullptr", [] {
    tf::ExpectTrue(Rebalance(nullptr) == nullptr, "Rebalance(nullptr)");
  });

  tf::HiddenTest("removal-style case: heavy left child with balance 0", [] {
    // 30 has balance +2 and its left child 20 has balance 0 -> one right rotation.
    Node* root = Mk(30, Mk(20, Mk(10), Mk(25)));
    ExpectShape(Rebalance(root), Mk(20, Mk(10), Mk(30, Mk(25))), "tree after Rebalance");
  });

  tf::HiddenTest("removal-style case: heavy right child with balance 0", [] {
    // 10 has balance -2 and its right child 20 has balance 0 -> one left rotation.
    Node* root = Mk(10, nullptr, Mk(20, Mk(15), Mk(30)));
    ExpectShape(Rebalance(root), Mk(20, Mk(10, nullptr, Mk(15)), Mk(30)), "tree after Rebalance");
  });
}

}  // namespace q41

REGISTER_QUESTION(41, "AVL tree: Rebalance()", q41::RunQ41);
