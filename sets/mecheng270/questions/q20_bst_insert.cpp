// ============================================================================
// Question 20  (6 marks)  -  Binary search tree: Insert()
// Topic: Trees & binary search trees
//
// Requirements for Binary search tree: Insert()
//
// You have been provided with a partially complete implementation of a binary
// search tree of ints (Node holds data, left and right).
//
// Task
// Implement both Insert functions of class BinarySearchTree:
//   - the public   void Insert(const int& value)
//   - the private  Node* Insert(Node* node, const int& value)
// The public function starts the insertion at the root. The private function
// inserts `value` into the subtree rooted at `node` and returns the (possibly
// new) root of that subtree. Smaller values go to the left, larger values go
// to the right. Duplicate values must NOT be inserted (the tree is unchanged).
//
// Your answer to this question must make use of recursion.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q20 {
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

  // Inserts value into the subtree rooted at node; returns the subtree root.
  Node* Insert(Node* node, const int& value);

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

 public:
  BinarySearchTree() : root(nullptr) {}
  ~BinarySearchTree() { Destroy(root); }

  // Inserts value into the tree (duplicates are ignored).
  void Insert(const int& value);

  // Used by the tests: values in ascending order, e.g. "1 3 5 " ("" if empty).
  string InOrderString() const {
    ostringstream os;
    InOrder(root, os);
    return os.str();
  }
  // Used by the tests: values in pre-order (shows the tree's shape).
  string PreOrderString() const {
    ostringstream os;
    PreOrder(root, os);
    return os.str();
  }
  bool Contains(const int& value) const {
    Node* cur = root;
    while (cur) {
      if (value == cur->data) return true;
      cur = value < cur->data ? cur->left : cur->right;
    }
    return false;
  }
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void BinarySearchTree::Insert(const int& value) {
  // Your implementation here
}

Node* BinarySearchTree::Insert(Node* node, const int& value) {
  // Your implementation here
  return node;
}
#else
#include "../solutions/q20.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ20() {
  tf::Test("insert into an empty tree", [] {
    BinarySearchTree tree;
    tree.Insert(10);
    tf::ExpectEq(tree.InOrderString(), string("10 "), "in-order");
    tf::ExpectTrue(tree.Contains(10), "Contains(10)");
  });

  tf::Test("insert builds correct shape", [] {
    BinarySearchTree tree;
    for (int v : {50, 30, 70, 20, 40, 60, 80}) tree.Insert(v);
    tf::ExpectEq(tree.InOrderString(), string("20 30 40 50 60 70 80 "), "in-order");
    tf::ExpectEq(tree.PreOrderString(), string("50 30 20 40 70 60 80 "), "pre-order");
  });

  tf::Test("ascending input makes a right-leaning chain", [] {
    BinarySearchTree tree;
    for (int v = 1; v <= 5; ++v) tree.Insert(v);
    tf::ExpectEq(tree.PreOrderString(), string("1 2 3 4 5 "), "pre-order");
    tf::ExpectTrue(tree.Contains(5) && !tree.Contains(6), "Contains");
  });

  tf::Test("duplicates are ignored", [] {
    BinarySearchTree tree;
    for (int v : {5, 3, 5, 8, 3, 8, 5}) tree.Insert(v);
    tf::ExpectEq(tree.InOrderString(), string("3 5 8 "), "in-order");
    tf::ExpectEq(tree.PreOrderString(), string("5 3 8 "), "pre-order");
  });

  tf::HiddenTest("descending input makes a left-leaning chain", [] {
    BinarySearchTree tree;
    for (int v = 5; v >= 1; --v) tree.Insert(v);
    tf::ExpectEq(tree.PreOrderString(), string("5 4 3 2 1 "), "pre-order");
  });

  tf::HiddenTest("negative values and zero", [] {
    BinarySearchTree tree;
    for (int v : {0, -5, 5, -10, -1, 3}) tree.Insert(v);
    tf::ExpectEq(tree.InOrderString(), string("-10 -5 -1 0 3 5 "), "in-order");
    tf::ExpectEq(tree.PreOrderString(), string("0 -5 -10 -1 5 3 "), "pre-order");
    tf::ExpectTrue(tree.Contains(-1) && !tree.Contains(-2), "Contains");
  });

  tf::HiddenTest("mixed insertion order", [] {
    BinarySearchTree tree;
    for (int v : {8, 3, 10, 1, 6, 14, 4, 7, 13}) tree.Insert(v);
    tf::ExpectEq(tree.InOrderString(), string("1 3 4 6 7 8 10 13 14 "), "in-order");
    tf::ExpectEq(tree.PreOrderString(), string("8 3 1 6 4 7 10 14 13 "), "pre-order");
  });
}

}  // namespace q20

REGISTER_QUESTION(20, "Binary search tree: Insert()", q20::RunQ20);
