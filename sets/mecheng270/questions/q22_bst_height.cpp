// ============================================================================
// Question 22  (5 marks)  -  Binary search tree: Height()
// Topic: Trees & binary search trees
//
// Requirements for Binary search tree: Height()
//
// You have been provided with a partially complete implementation of a binary
// search tree of ints (Node holds data, left and right). Insert is provided.
//
// Task
// Implement both Height functions of class BinarySearchTree:
//   - the public   int Height() const
//   - the private  int Height(Node* node) const
// The height of a tree is the number of edges on the longest path from the
// root down to a leaf. An empty tree has height -1 and a tree with a single
// node has height 0. The private function returns the height of the subtree
// rooted at `node`; the public function calls it on the root.
//
// Your answer to this question must make use of recursion.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q22 {
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

  // Height of the subtree rooted at node (-1 if node is nullptr).
  int Height(Node* node) const;

 public:
  BinarySearchTree() : root(nullptr) {}
  ~BinarySearchTree() { Destroy(root); }

  void Insert(const int& value) { root = Insert(root, value); }

  // Height of the whole tree.
  int Height() const;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int BinarySearchTree::Height() const {
  // Your implementation here
  return -2;
}

int BinarySearchTree::Height(Node* node) const {
  // Your implementation here
  return -2;
}
#else
#include "../solutions/q22.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ22() {
  tf::Test("empty tree has height -1", [] {
    BinarySearchTree tree;
    tf::ExpectOutput("Height: -1\n", [&] { cout << "Height: " << tree.Height() << endl; });
  });

  tf::Test("single node has height 0", [] {
    BinarySearchTree tree;
    tree.Insert(7);
    tf::ExpectOutput("Height: 0\n", [&] { cout << "Height: " << tree.Height() << endl; });
  });

  tf::Test("perfect tree of three levels", [] {
    BinarySearchTree tree;
    for (int v : {50, 30, 70, 20, 40, 60, 80}) tree.Insert(v);
    tf::ExpectOutput("Height: 2\n", [&] { cout << "Height: " << tree.Height() << endl; });
  });

  tf::Test("chain of ascending values", [] {
    BinarySearchTree tree;
    for (int v = 1; v <= 5; ++v) tree.Insert(v);
    tf::ExpectOutput("Height: 4\n", [&] { cout << "Height: " << tree.Height() << endl; });
  });

  tf::HiddenTest("longest path is on the left", [] {
    BinarySearchTree tree;
    for (int v : {10, 20, 5, 3, 7, 2}) tree.Insert(v);
    tf::ExpectEq(tree.Height(), 3, "height");
  });

  tf::HiddenTest("longest path is on the right, zigzag", [] {
    BinarySearchTree tree;
    for (int v : {10, 5, 20, 15, 18, 16}) tree.Insert(v);  // 10 -> 20 -> 15 -> 18 -> 16
    tf::ExpectEq(tree.Height(), 4, "height");
  });

  tf::HiddenTest("duplicates do not add height", [] {
    BinarySearchTree tree;
    for (int v : {4, 4, 4, 2, 2, 6}) tree.Insert(v);
    tf::ExpectEq(tree.Height(), 1, "height");
  });
}

}  // namespace q22

REGISTER_QUESTION(22, "Binary search tree: Height()", q22::RunQ22);
