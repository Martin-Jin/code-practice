// ============================================================================
// Question 39  (3 marks)  -  AVL tree: GetHeight(), GetBalance(), UpdateHeight()
// Topic: AVL trees
//
// Requirements for AVL tree: GetHeight(), GetBalance(), UpdateHeight()
//
// Every node of an AVL tree caches its own height in the member `height`. The
// height of an empty tree (nullptr) is defined as -1, so a leaf has height 0.
// The balance factor of a node is height(left subtree) - height(right subtree).
//
// Task
// Implement the three helper functions:
//   int   GetHeight(Node* n)    - n->height, or -1 if n is nullptr.
//   int   GetBalance(Node* n)   - GetHeight(n->left) - GetHeight(n->right),
//                                 or 0 if n is nullptr.
//   Node* UpdateHeight(Node* n) - recompute n->height in O(1) from the CACHED
//                                 heights of its two children (do not recurse
//                                 down the tree); return n. If n is nullptr,
//                                 return nullptr.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q39 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Node {
  int data;
  Node* left;
  Node* right;
  int height;
  Node(const int& value) : data(value), left(nullptr), right(nullptr), height(0) {}
};

int GetHeight(Node* n);
int GetBalance(Node* n);
Node* UpdateHeight(Node* n);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int GetHeight(Node* n) {
  // Your implementation here
  return 0;
}

int GetBalance(Node* n) {
  // Your implementation here
  return 0;
}

Node* UpdateHeight(Node* n) {
  // Your implementation here
  return n;
}
#else
#include "../solutions/q39.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
namespace {
// Builds a node with the given children and an explicitly chosen cached height.
Node* Mk(int v, int height, Node* l = nullptr, Node* r = nullptr) {
  Node* n = new Node(v);
  n->left = l;
  n->right = r;
  n->height = height;
  return n;
}

void Free(Node* n) {
  if (!n) return;
  Free(n->left);
  Free(n->right);
  delete n;
}
}  // namespace

void RunQ39() {
  tf::Test("GetHeight: empty tree is -1, leaf is 0", [] {
    Node* leaf = Mk(1, 0);
    tf::ExpectEq(GetHeight(nullptr), -1, "GetHeight(nullptr)");
    tf::ExpectEq(GetHeight(leaf), 0, "GetHeight(leaf)");
    Free(leaf);
  });

  tf::Test("GetHeight reads the cached height", [] {
    Node* n = Mk(5, 3, Mk(2, 2, Mk(1, 1, Mk(0, 0))), nullptr);
    tf::ExpectEq(GetHeight(n), 3, "GetHeight(root)");
    tf::ExpectEq(GetHeight(n->left), 2, "GetHeight(root->left)");
    Free(n);
  });

  tf::Test("GetBalance: left-heavy, right-heavy, balanced", [] {
    Node* left_heavy = Mk(5, 2, Mk(2, 1, Mk(1, 0)), nullptr);
    Node* right_heavy = Mk(5, 1, nullptr, Mk(8, 0));
    Node* balanced = Mk(5, 1, Mk(2, 0), Mk(8, 0));
    tf::ExpectEq(GetBalance(left_heavy), 2, "left-heavy balance");
    tf::ExpectEq(GetBalance(right_heavy), -1, "right-heavy balance");
    tf::ExpectEq(GetBalance(balanced), 0, "balanced balance");
    Free(left_heavy);
    Free(right_heavy);
    Free(balanced);
  });

  tf::Test("UpdateHeight fixes a stale height", [] {
    Node* n = Mk(5, 99, Mk(2, 1, Mk(1, 0)), Mk(8, 0));  // taller side is left (1)
    Node* leaf = Mk(9, 42);                              // stale leaf height
    Node* ret = UpdateHeight(n);
    tf::ExpectEq(n->height, 2, "height of node with children of height 1 and 0");
    tf::ExpectTrue(ret == n, "UpdateHeight returns the node it was given");
    UpdateHeight(leaf);
    tf::ExpectEq(leaf->height, 0, "height of a leaf");
    Free(n);
    Free(leaf);
  });

  tf::HiddenTest("null pointers", [] {
    tf::ExpectEq(GetBalance(nullptr), 0, "GetBalance(nullptr)");
    tf::ExpectTrue(UpdateHeight(nullptr) == nullptr, "UpdateHeight(nullptr) returns nullptr");
  });

  tf::HiddenTest("UpdateHeight with only a right child", [] {
    Node* n = Mk(5, 77, nullptr, Mk(8, 3));
    UpdateHeight(n);
    tf::ExpectEq(n->height, 4, "height with only a right child of height 3");
    Free(n);
  });

  tf::HiddenTest("UpdateHeight trusts the cached heights of its children", [] {
    // The children's cached heights are deliberately larger than their real
    // shape: an O(1) update must use them as they are.
    Node* n = Mk(5, 0, Mk(2, 6), Mk(8, 1));
    UpdateHeight(n);
    tf::ExpectEq(n->height, 7, "1 + max(6, 1)");
    tf::ExpectEq(GetBalance(n), 5, "balance 6 - 1");
    Free(n);
  });
}

}  // namespace q39

REGISTER_QUESTION(39, "AVL tree: GetHeight(), GetBalance(), UpdateHeight()", q39::RunQ39);
