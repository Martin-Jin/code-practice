// ============================================================================
// Question 21  (5 marks)  -  Binary search tree: FindMin() and FindMax()
// Topic: Trees & binary search trees
//
// Requirements for Binary search tree: FindMin() and FindMax()
//
// You have been provided with a partially complete implementation of a binary
// search tree of ints (Node holds data, left and right). Insert is provided.
//
// Task
// Implement the public functions
//   int FindMin() const   - returns the smallest value stored in the tree
//   int FindMax() const   - returns the largest value stored in the tree
// If the tree is empty, both functions must return -1.
// Use the BST property: do not visit every node. Your answer must be
// iterative (a loop, no recursion) and must not modify the tree.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q21 {
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
  void Destroy(Node* node) {
    if (!node) return;
    Destroy(node->left);
    Destroy(node->right);
    delete node;
  }

 public:
  BinarySearchTree() : root(nullptr) {}
  ~BinarySearchTree() { Destroy(root); }

  void Insert(const int& value) { root = Insert(root, value); }

  // Returns the smallest value, or -1 if the tree is empty.
  int FindMin() const;
  // Returns the largest value, or -1 if the tree is empty.
  int FindMax() const;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int BinarySearchTree::FindMin() const {
  // Your implementation here
  return -2;
}

int BinarySearchTree::FindMax() const {
  // Your implementation here
  return -2;
}
#else
#include "../solutions/q21.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ21() {
  tf::Test("balanced tree", [] {
    BinarySearchTree tree;
    for (int v : {50, 30, 70, 20, 40, 60, 80}) tree.Insert(v);
    tf::ExpectOutput("Min: 20\nMax: 80\n", [&] {
      cout << "Min: " << tree.FindMin() << endl;
      cout << "Max: " << tree.FindMax() << endl;
    });
  });

  tf::Test("single node", [] {
    BinarySearchTree tree;
    tree.Insert(42);
    tf::ExpectOutput("Min: 42\nMax: 42\n", [&] {
      cout << "Min: " << tree.FindMin() << endl;
      cout << "Max: " << tree.FindMax() << endl;
    });
  });

  tf::Test("empty tree returns -1", [] {
    BinarySearchTree tree;
    tf::ExpectOutput("Min: -1\nMax: -1\n", [&] {
      cout << "Min: " << tree.FindMin() << endl;
      cout << "Max: " << tree.FindMax() << endl;
    });
  });

  tf::Test("minimum is deep in the left subtree", [] {
    BinarySearchTree tree;
    for (int v : {40, 20, 60, 10, 30, 5, 25}) tree.Insert(v);
    tf::ExpectEq(tree.FindMin(), 5, "FindMin");
    tf::ExpectEq(tree.FindMax(), 60, "FindMax");
  });

  tf::HiddenTest("increasing insertions (max is the last node)", [] {
    BinarySearchTree tree;
    for (int v = 1; v <= 6; ++v) tree.Insert(v);
    tf::ExpectEq(tree.FindMin(), 1, "FindMin");
    tf::ExpectEq(tree.FindMax(), 6, "FindMax");
  });

  tf::HiddenTest("decreasing insertions (min is the last node)", [] {
    BinarySearchTree tree;
    for (int v = 6; v >= 1; --v) tree.Insert(v);
    tf::ExpectEq(tree.FindMin(), 1, "FindMin");
    tf::ExpectEq(tree.FindMax(), 6, "FindMax");
  });

  tf::HiddenTest("negative values; searching twice does not change the tree", [] {
    BinarySearchTree tree;
    for (int v : {-3, -10, 4, -7, 9, 0}) tree.Insert(v);
    tf::ExpectEq(tree.FindMin(), -10, "FindMin");
    tf::ExpectEq(tree.FindMax(), 9, "FindMax");
    tf::ExpectEq(tree.FindMin(), -10, "FindMin again");
    tf::ExpectEq(tree.FindMax(), 9, "FindMax again");
  });
}

}  // namespace q21

REGISTER_QUESTION(21, "Binary search tree: FindMin() and FindMax()", q21::RunQ21);
