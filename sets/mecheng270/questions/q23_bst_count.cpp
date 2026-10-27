// ============================================================================
// Question 23  (6 marks)  -  Binary search tree: CountNodes() and CountLeaves()
// Topic: Trees & binary search trees
// Restrict: recursive
//
// Requirements for Binary search tree: CountNodes() and CountLeaves()
//
// You have been provided with a partially complete implementation of a binary
// search tree of ints (Node holds data, left and right). Insert is provided.
//
// Task
// Implement the public functions CountNodes() and CountLeaves() together with
// their private recursive helpers:
//   int CountNodes(Node* node) const   - number of nodes in the subtree
//   int CountLeaves(Node* node) const  - number of leaves in the subtree
// A leaf is a node with no children. An empty tree has 0 nodes and 0 leaves;
// a tree with a single node has 1 node and 1 leaf (the root is a leaf).
//
// Your answer to this question must make use of recursion.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q23 {
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

  int CountNodes(Node* node) const;
  int CountLeaves(Node* node) const;

 public:
  BinarySearchTree() : root(nullptr) {}
  ~BinarySearchTree() { Destroy(root); }

  void Insert(const int& value) { root = Insert(root, value); }

  int CountNodes() const;
  int CountLeaves() const;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int BinarySearchTree::CountNodes() const {
  // Your implementation here
  return -1;
}

int BinarySearchTree::CountNodes(Node* node) const {
  // Your implementation here
  return -1;
}

int BinarySearchTree::CountLeaves() const {
  // Your implementation here
  return -1;
}

int BinarySearchTree::CountLeaves(Node* node) const {
  // Your implementation here
  return -1;
}
#else
#include "../solutions/q23.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ23() {
  tf::Test("empty tree", [] {
    BinarySearchTree tree;
    tf::ExpectOutput("Nodes: 0\nLeaves: 0\n", [&] {
      cout << "Nodes: " << tree.CountNodes() << endl;
      cout << "Leaves: " << tree.CountLeaves() << endl;
    });
  });

  tf::Test("single node is a leaf", [] {
    BinarySearchTree tree;
    tree.Insert(1);
    tf::ExpectOutput("Nodes: 1\nLeaves: 1\n", [&] {
      cout << "Nodes: " << tree.CountNodes() << endl;
      cout << "Leaves: " << tree.CountLeaves() << endl;
    });
  });

  tf::Test("perfect tree", [] {
    BinarySearchTree tree;
    for (int v : {50, 30, 70, 20, 40, 60, 80}) tree.Insert(v);
    tf::ExpectOutput("Nodes: 7\nLeaves: 4\n", [&] {
      cout << "Nodes: " << tree.CountNodes() << endl;
      cout << "Leaves: " << tree.CountLeaves() << endl;
    });
  });

  tf::Test("chain has one leaf", [] {
    BinarySearchTree tree;
    for (int v = 1; v <= 6; ++v) tree.Insert(v);
    tf::ExpectOutput("Nodes: 6\nLeaves: 1\n", [&] {
      cout << "Nodes: " << tree.CountNodes() << endl;
      cout << "Leaves: " << tree.CountLeaves() << endl;
    });
  });

  tf::HiddenTest("unbalanced tree with nodes that have one child", [] {
    BinarySearchTree tree;
    for (int v : {10, 5, 15, 3, 7, 12, 2}) tree.Insert(v);
    tf::ExpectEq(tree.CountNodes(), 7, "CountNodes");
    tf::ExpectEq(tree.CountLeaves(), 3, "CountLeaves");  // 2, 7, 12
  });

  tf::HiddenTest("duplicates are not counted twice", [] {
    BinarySearchTree tree;
    for (int v : {4, 2, 6, 2, 4, 6, 1}) tree.Insert(v);
    tf::ExpectEq(tree.CountNodes(), 4, "CountNodes");
    tf::ExpectEq(tree.CountLeaves(), 2, "CountLeaves");  // 1, 6
  });

  tf::HiddenTest("root with only a right child", [] {
    BinarySearchTree tree;
    tree.Insert(5);
    tree.Insert(9);
    tf::ExpectEq(tree.CountNodes(), 2, "CountNodes");
    tf::ExpectEq(tree.CountLeaves(), 1, "CountLeaves");
  });
}

}  // namespace q23

REGISTER_QUESTION(23, "Binary search tree: CountNodes() and CountLeaves()", q23::RunQ23);
