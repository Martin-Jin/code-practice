// ============================================================================
// Question 43  (4 marks)  -  AVL tree: fix the buggy RotateRight()
// Topic: AVL trees
//
// Requirements for AVL tree: fix the buggy RotateRight()
//
// You have been provided with an AVL node (which caches its height) and the
// correct helpers GetHeight(), GetBalance() and UpdateHeight().
//
// A student wrote RotateRight(Node* k2), which should fix a left-left
// imbalance: the left child k1 of k2 moves up to become the subtree root, k2
// becomes k1's right child, and k1's old RIGHT subtree is reattached as k2's
// left child. The function returns the new subtree root, and the cached
// heights of k1 and k2 must be correct afterwards.
//
// Unfortunately the student's code contains TWO bugs.
//
// Task
// Find and fix the bugs in RotateRight(). Do not change its signature. You may
// assume k2 and k2->left are not nullptr.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q43 {
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

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
Node* RotateRight(Node* k2) {
  Node* k1 = k2->left;
  Node* y = k1->right;
  k1->right = k2;
  k2->left = k1->left;
  UpdateHeight(k1);
  UpdateHeight(k2);
  return k1;
}
#else
#include "../solutions/q43.inc"
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

void RunQ43() {
  tf::Test("left-left line 3-2-1", [] {
    ExpectShape(RotateRight(Mk(3, Mk(2, Mk(1)))), Mk(2, Mk(1), Mk(3)), "tree after RotateRight");
  });

  tf::Test("all subtrees present", [] {
    Node* root = Mk(30, Mk(20, Mk(10), Mk(25)), Mk(40));
    ExpectShape(RotateRight(root), Mk(20, Mk(10), Mk(30, Mk(25), Mk(40))), "tree after RotateRight");
  });

  tf::Test("new root is returned and k2 becomes its right child", [] {
    Node* k2 = Mk(8, Mk(4, Mk(2), Mk(6)));
    Node* k1 = k2->left;
    Node* got = RotateRight(k2);
    tf::ExpectTrue(got == k1, "RotateRight returns the old left child");
    tf::ExpectTrue(got->right == k2, "old root is the right child of the new root");
    ExpectShape(got, Mk(4, Mk(2), Mk(8, Mk(6))), "tree after RotateRight");
  });

  tf::HiddenTest("tall subtrees: heights must be updated in the right order", [] {
    Node* root = Mk(50, Mk(30, Mk(20, Mk(10, Mk(5)), Mk(25)), Mk(40)), Mk(60));
    ExpectShape(RotateRight(root), Mk(30, Mk(20, Mk(10, Mk(5)), Mk(25)), Mk(50, Mk(40), Mk(60))),
                "tree after RotateRight");
  });

  tf::HiddenTest("removal-style shape: left child has two equal subtrees", [] {
    Node* root = Mk(40, Mk(20, Mk(10, Mk(5), Mk(15)), Mk(30, Mk(25), Mk(35))), Mk(50));
    Node* expected = Mk(20, Mk(10, Mk(5), Mk(15)), Mk(40, Mk(30, Mk(25), Mk(35)), Mk(50)));
    ExpectShape(RotateRight(root), expected, "tree after RotateRight");
  });

  tf::HiddenTest("rotating a subtree and reattaching it to its parent", [] {
    Node* parent = Mk(100, Mk(30, Mk(20, Mk(10)), nullptr), Mk(200));
    parent->left = RotateRight(parent->left);
    UpdateHeight(parent);
    ExpectShape(parent, Mk(100, Mk(20, Mk(10), Mk(30)), Mk(200)), "tree after rotating the left subtree");
  });
}

}  // namespace q43

REGISTER_QUESTION(43, "AVL tree: fix the buggy RotateRight()", q43::RunQ43);
