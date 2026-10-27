// ============================================================================
// Question 26  (4 marks)  -  Binary search tree: PrintReverse()
// Topic: Trees & binary search trees
// Restrict: recursive
//
// Requirements for Binary search tree: PrintReverse()
//
// You have been provided with a partially complete implementation of a binary
// search tree of ints (Node holds data, left and right). Insert is provided.
//
// Task
// Implement both PrintReverse functions of class BinarySearchTree:
//   - the public   void PrintReverse() const
//   - the private  void PrintReverse(Node* node) const
// They print every value in the tree in DESCENDING order, one value per line.
// An empty tree prints nothing. The private function prints the subtree rooted
// at `node`; the public function starts at the root.
//
// Your answer to this question must make use of recursion.
//
// Note: there are four visible test cases and two hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q26 {
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

  void PrintReverse(Node* node) const;

 public:
  BinarySearchTree() : root(nullptr) {}
  ~BinarySearchTree() { Destroy(root); }

  void Insert(const int& value) { root = Insert(root, value); }

  void PrintReverse() const;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void BinarySearchTree::PrintReverse() const {
  // Your implementation here
}

void BinarySearchTree::PrintReverse(Node* node) const {
  // Your implementation here
}
#else
#include "../solutions/q26.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ26() {
  tf::Test("empty tree prints nothing", [] {
    BinarySearchTree tree;
    tf::ExpectOutput("", [&] { tree.PrintReverse(); });
  });

  tf::Test("single node", [] {
    BinarySearchTree tree;
    tree.Insert(9);
    tf::ExpectOutput("9\n", [&] { tree.PrintReverse(); });
  });

  tf::Test("perfect tree", [] {
    BinarySearchTree tree;
    for (int v : {4, 2, 6, 1, 3, 5, 7}) tree.Insert(v);
    tf::ExpectOutput("7\n6\n5\n4\n3\n2\n1\n", [&] { tree.PrintReverse(); });
  });

  tf::Test("ascending insertion (right chain)", [] {
    BinarySearchTree tree;
    for (int v = 1; v <= 4; ++v) tree.Insert(v);
    tf::ExpectOutput("4\n3\n2\n1\n", [&] { tree.PrintReverse(); });
  });

  tf::HiddenTest("unbalanced tree with negatives", [] {
    BinarySearchTree tree;
    for (int v : {0, -4, 8, -2, 3, -9, 12}) tree.Insert(v);
    tf::ExpectOutput("12\n8\n3\n0\n-2\n-4\n-9\n", [&] { tree.PrintReverse(); });
  });

  tf::HiddenTest("duplicates are printed once", [] {
    BinarySearchTree tree;
    for (int v : {5, 5, 2, 8, 2, 8}) tree.Insert(v);
    tf::ExpectOutput("8\n5\n2\n", [&] { tree.PrintReverse(); });
  });
}

}  // namespace q26

REGISTER_QUESTION(26, "Binary search tree: PrintReverse()", q26::RunQ26);
