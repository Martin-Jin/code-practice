// ============================================================================
// Question 40  (5 marks)  -  AVL tree: RotateRight() and RotateLeft()
// Topic: AVL trees
//
// Requirements for AVL tree: RotateRight() and RotateLeft()
//
// You have been provided with an AVL node (which caches its height) and the
// helper functions GetHeight(), GetBalance() and UpdateHeight().
//
// Task
// Implement the two single rotations. Each takes the root of an unbalanced
// subtree and returns the NEW root of that subtree.
//   Node* RotateRight(Node* k2)  - the left child k1 moves up; k2 becomes k1's
//                                  right child; k1's old right subtree is
//                                  reattached as k2's left child.
//   Node* RotateLeft(Node* k1)   - the mirror image: the right child k2 moves
//                                  up; k1 becomes k2's left child; k2's old
//                                  left subtree is reattached as k1's right
//                                  child.
// After rotating, the cached heights of the two rotated nodes must be correct.
// Update them in the right order: the node that moved DOWN first, then the
// node that is the new root. You may assume the child being moved up exists.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q40 {
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

Node* RotateRight(Node* k2);
Node* RotateLeft(Node* k1);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
Node* RotateRight(Node* k2) {
  // Your implementation here
  return k2;
}

Node* RotateLeft(Node* k1) {
  // Your implementation here
  return k1;
}
#else
#include "../solutions/q40.inc"
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

void RunQ40() {
  tf::Test("RotateRight on a left-left tree", [] {
    Node* root = Mk(30, Mk(20, Mk(10), Mk(25)), Mk(40));
    ExpectShape(RotateRight(root), Mk(20, Mk(10), Mk(30, Mk(25), Mk(40))), "tree after RotateRight");
  });

  tf::Test("RotateLeft on a right-right tree", [] {
    Node* root = Mk(10, Mk(5), Mk(20, Mk(15), Mk(30)));
    ExpectShape(RotateLeft(root), Mk(20, Mk(10, Mk(5), Mk(15)), Mk(30)), "tree after RotateLeft");
  });

  tf::Test("RotateRight / RotateLeft on a three-node line", [] {
    ExpectShape(RotateRight(Mk(3, Mk(2, Mk(1)))), Mk(2, Mk(1), Mk(3)), "RotateRight on 3-2-1");
    ExpectShape(RotateLeft(Mk(1, nullptr, Mk(2, nullptr, Mk(3)))), Mk(2, Mk(1), Mk(3)),
                "RotateLeft on 1-2-3");
  });

  tf::HiddenTest("heights are updated in the correct order (tall subtrees)", [] {
    // k2 = 50 has height 4; the new root must end up with height 3 + 1, not a stale value.
    Node* root = Mk(50, Mk(30, Mk(20, Mk(10, Mk(5)), Mk(25)), Mk(40)), Mk(60));
    Node* expected = Mk(30, Mk(20, Mk(10, Mk(5)), Mk(25)), Mk(50, Mk(40), Mk(60)));
    ExpectShape(RotateRight(root), expected, "tree after RotateRight");
  });

  tf::HiddenTest("RotateLeft when the reattached subtree is the tall one", [] {
    // Removal-style shape: both children of the moving node have equal height.
    Node* root = Mk(10, Mk(5), Mk(20, Mk(15, Mk(12), Mk(17)), Mk(30, Mk(25), Mk(35))));
    Node* expected =
        Mk(20, Mk(10, Mk(5), Mk(15, Mk(12), Mk(17))), Mk(30, Mk(25), Mk(35)));
    ExpectShape(RotateLeft(root), expected, "tree after RotateLeft");
  });

  tf::HiddenTest("rotating a subtree and reattaching it to its parent", [] {
    Node* parent = Mk(100, Mk(30, Mk(20, Mk(10)), nullptr), Mk(200));
    parent->left = RotateRight(parent->left);
    UpdateHeight(parent);
    ExpectShape(parent, Mk(100, Mk(20, Mk(10), Mk(30)), Mk(200)), "tree after rotating the left subtree");
  });
}

}  // namespace q40

REGISTER_QUESTION(40, "AVL tree: RotateRight() and RotateLeft()", q40::RunQ40);
