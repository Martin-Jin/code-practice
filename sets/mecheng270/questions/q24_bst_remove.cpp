// ============================================================================
// Question 24  (8 marks)  -  Binary search tree: Remove()
// Topic: Trees & binary search trees
// Restrict: recursive
//
// Requirements for Binary search tree: Remove()
//
// You have been provided with a partially complete implementation of a binary
// search tree of ints (Node holds data, left and right). Insert, a helper
// MinNode(node) that returns the node holding the smallest value in a
// non-empty subtree, and the printing helpers used by the tests are provided.
//
// Task
// Implement both Remove functions of class BinarySearchTree:
//   - the public   void Remove(const int& value)
//   - the private  Node* Remove(Node* node, const int& value)
// The private function removes `value` from the subtree rooted at `node` and
// returns the (possibly new) root of that subtree. If the value is not in the
// tree, nothing changes. Handle the three cases:
//   1. the node is a leaf                -> delete it
//   2. the node has exactly one child    -> replace it by that child
//   3. the node has two children         -> copy the smallest value of its
//      RIGHT subtree (the in-order successor) into the node, then remove that
//      successor from the right subtree.
// Nodes that are removed from the tree must be deleted.
//
// Your answer to this question must make use of recursion.
//
// Note: there are four visible test cases and four hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q24 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Node {
  int data;
  Node* left;
  Node* right;
  Node(const int& value) : data(value), left(nullptr), right(nullptr) {}
};

class BinarySearchTree {
 private:
  Node* root;

  Node* Insert(Node* node, const int& value) {
    if (!node) return new Node(value);
    if (value < node->data) {
      node->left = Insert(node->left, value);
    } else if (value > node->data) {
      node->right = Insert(node->right, value);
    }
    return node;
  }
  // Smallest node of a non-empty subtree.
  Node* MinNode(Node* node) const {
    while (node->left) node = node->left;
    return node;
  }
  void Destroy(Node* node) {
    if (!node) return;
    Destroy(node->left);
    Destroy(node->right);
    delete node;
  }
  void InOrder(Node* node, ostringstream& os) const {
    if (!node) return;
    InOrder(node->left, os);
    os << node->data << " ";
    InOrder(node->right, os);
  }
  void PreOrder(Node* node, ostringstream& os) const {
    if (!node) return;
    os << node->data << " ";
    PreOrder(node->left, os);
    PreOrder(node->right, os);
  }

  // Removes value from the subtree rooted at node; returns the subtree root.
  Node* Remove(Node* node, const int& value);

 public:
  BinarySearchTree() : root(nullptr) {}
  ~BinarySearchTree() { Destroy(root); }

  void Insert(const int& value) { root = Insert(root, value); }

  void Remove(const int& value);

  // Used by the tests.
  string InOrderString() const {
    ostringstream os;
    InOrder(root, os);
    return os.str();
  }
  string PreOrderString() const {
    ostringstream os;
    PreOrder(root, os);
    return os.str();
  }
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void BinarySearchTree::Remove(const int& value) {
  // Your implementation here
}

Node* BinarySearchTree::Remove(Node* node, const int& value) {
  // Your implementation here
  return node;
}
#else
#include "../solutions/q24.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
namespace {
// Builds the tree 50 / (30: 20, 40) / (70: 60, 80).
void BuildBalanced(BinarySearchTree& tree) {
  for (int v : {50, 30, 70, 20, 40, 60, 80}) tree.Insert(v);
}
}  // namespace

void RunQ24() {
  tf::Test("remove a leaf", [] {
    BinarySearchTree tree;
    BuildBalanced(tree);
    tree.Remove(20);
    tf::ExpectEq(tree.InOrderString(), string("30 40 50 60 70 80 "), "in-order");
    tf::ExpectEq(tree.PreOrderString(), string("50 30 40 70 60 80 "), "pre-order");
  });

  tf::Test("remove a node with one child (left only, then right only)", [] {
    BinarySearchTree tree;
    for (int v : {10, 5, 15, 12, 5, 20}) tree.Insert(v);  // 15 has children 12 and 20
    tree.Remove(20);                                      // 15 now has only a left child
    tree.Remove(15);
    tf::ExpectEq(tree.PreOrderString(), string("10 5 12 "), "pre-order after removing 15");
    BinarySearchTree other;
    for (int v : {10, 5, 15, 18}) other.Insert(v);  // 15 has only a right child
    other.Remove(15);
    tf::ExpectEq(other.PreOrderString(), string("10 5 18 "), "pre-order after removing 15");
  });

  tf::Test("remove a node with two children", [] {
    BinarySearchTree tree;
    BuildBalanced(tree);
    tree.Remove(30);  // successor is 40
    tf::ExpectEq(tree.InOrderString(), string("20 40 50 60 70 80 "), "in-order");
    tf::ExpectEq(tree.PreOrderString(), string("50 40 20 70 60 80 "), "pre-order");
  });

  tf::Test("remove the root (two children)", [] {
    BinarySearchTree tree;
    BuildBalanced(tree);
    tree.Remove(50);  // successor is 60
    tf::ExpectEq(tree.InOrderString(), string("20 30 40 60 70 80 "), "in-order");
    tf::ExpectEq(tree.PreOrderString(), string("60 30 20 40 70 80 "), "pre-order");
  });

  tf::HiddenTest("value not in the tree and empty tree", [] {
    BinarySearchTree tree;
    tree.Remove(5);
    tf::ExpectEq(tree.InOrderString(), string(""), "empty tree stays empty");
    BuildBalanced(tree);
    tree.Remove(55);
    tree.Remove(-1);
    tf::ExpectEq(tree.PreOrderString(), string("50 30 20 40 70 60 80 "), "unchanged");
  });

  tf::HiddenTest("successor is deeper and has a right child", [] {
    BinarySearchTree tree;
    for (int v : {20, 10, 40, 30, 50, 35}) tree.Insert(v);
    tree.Remove(20);  // successor 30 (has right child 35) replaces the root
    tf::ExpectEq(tree.InOrderString(), string("10 30 35 40 50 "), "in-order");
    tf::ExpectEq(tree.PreOrderString(), string("30 10 40 35 50 "), "pre-order");
  });

  tf::HiddenTest("remove the only node, and a root with one child", [] {
    BinarySearchTree tree;
    tree.Insert(7);
    tree.Remove(7);
    tf::ExpectEq(tree.InOrderString(), string(""), "empty after removing only node");
    tree.Insert(5);
    tree.Insert(3);
    tree.Remove(5);
    tf::ExpectEq(tree.PreOrderString(), string("3 "), "left child becomes root");
    tree.Insert(9);
    tf::ExpectEq(tree.PreOrderString(), string("3 9 "), "tree still usable");
  });

  tf::HiddenTest("remove every value one by one", [] {
    BinarySearchTree tree;
    BuildBalanced(tree);
    tree.Remove(50);
    tree.Remove(30);
    tree.Remove(80);
    tf::ExpectEq(tree.InOrderString(), string("20 40 60 70 "), "after three removals");
    tree.Remove(70);
    tree.Remove(20);
    tree.Remove(60);
    tree.Remove(40);
    tf::ExpectEq(tree.InOrderString(), string(""), "all removed");
  });
}

}  // namespace q24

REGISTER_QUESTION(24, "Binary search tree: Remove()", q24::RunQ24);
