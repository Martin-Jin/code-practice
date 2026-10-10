// ============================================================================
// Question 28  (4 marks)  -  Binary search tree: fix Insert()
// Topic: Trees & binary search trees
//
// Requirements for Binary search tree: fix Insert()
//
// You have been provided with a binary search tree of ints (struct Node with
// `data`, `left`, `right`). The recursive private helper
// BinarySearchTree::InsertHelper(Node*, int) is supposed to insert a value and
// return the (possibly new) root of that subtree. Duplicate values must be
// ignored (the tree never stores the same value twice).
//
// Task
// The implementation below contains TWO bugs. Find and fix them so that Insert()
// builds a correct BST that ignores duplicates. Keep the function recursive.
//
// Note: there are four visible test cases and two hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q28 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Node {
  int data;
  Node* left;
  Node* right;
  Node(int value) : data(value), left(nullptr), right(nullptr) {}
};

class BinarySearchTree {
 private:
  Node* root;

  Node* InsertHelper(Node* node, int value);

  void Destroy(Node* node) {
    if (node == nullptr) return;
    Destroy(node->left);
    Destroy(node->right);
    delete node;
  }

  void PrintInOrder(Node* node) const {
    if (node == nullptr) return;
    PrintInOrder(node->left);
    cout << " " << node->data;
    PrintInOrder(node->right);
  }

  void PrintPreOrder(Node* node) const {
    if (node == nullptr) return;
    cout << " " << node->data;
    PrintPreOrder(node->left);
    PrintPreOrder(node->right);
  }

 public:
  BinarySearchTree() : root(nullptr) {}
  ~BinarySearchTree() { Destroy(root); }

  void Insert(int value) { root = InsertHelper(root, value); }

  void PrintInOrder() const {
    cout << "In-order:";
    PrintInOrder(root);
    cout << endl;
  }

  void PrintPreOrder() const {
    cout << "Pre-order:";
    PrintPreOrder(root);
    cout << endl;
  }
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
Node* BinarySearchTree::InsertHelper(Node* node, int value) {
  if (node == nullptr) {
    return new Node(value);
  }
  if (value < node->data) {
    InsertHelper(node->left, value);
  } else if (value >= node->data) {
    node->right = InsertHelper(node->right, value);
  }
  return node;
}
#else
#include "../solutions/q28.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ28() {
  tf::Test("insert into empty tree", [] {
    BinarySearchTree tree;
    tf::ExpectOutput("In-order: 10\nPre-order: 10\n", [&] {
      tree.Insert(10);
      tree.PrintInOrder();
      tree.PrintPreOrder();
    });
  });

  tf::Test("insert left and right children", [] {
    BinarySearchTree tree;
    tf::ExpectOutput("In-order: 3 5 8\nPre-order: 5 3 8\n", [&] {
      tree.Insert(5);
      tree.Insert(3);
      tree.Insert(8);
      tree.PrintInOrder();
      tree.PrintPreOrder();
    });
  });

  tf::Test("larger tree", [] {
    BinarySearchTree tree;
    tf::ExpectOutput("In-order: 1 3 4 6 7 8 10 13 14\nPre-order: 8 3 1 6 4 7 10 14 13\n", [&] {
      int values[] = {8, 3, 10, 1, 6, 14, 4, 7, 13};
      for (int v : values) tree.Insert(v);
      tree.PrintInOrder();
      tree.PrintPreOrder();
    });
  });

  tf::Test("duplicates are ignored", [] {
    BinarySearchTree tree;
    tf::ExpectOutput("In-order: 3 5\nPre-order: 5 3\n", [&] {
      tree.Insert(5);
      tree.Insert(3);
      tree.Insert(5);
      tree.Insert(3);
      tree.PrintInOrder();
      tree.PrintPreOrder();
    });
  });

  tf::HiddenTest("descending inserts form a left chain", [] {
    BinarySearchTree tree;
    tf::ExpectOutput("In-order: 1 2 3 4 5\nPre-order: 5 4 3 2 1\n", [&] {
      for (int i = 5; i >= 1; --i) tree.Insert(i);
      tree.PrintInOrder();
      tree.PrintPreOrder();
    });
  });

  tf::HiddenTest("negative values and many duplicates", [] {
    BinarySearchTree tree;
    tf::ExpectOutput("In-order: -4 -1 0 2\nPre-order: 0 -1 -4 2\n", [&] {
      int values[] = {0, -1, 2, -4, 0, 2, -1, -4, 2};
      for (int v : values) tree.Insert(v);
      tree.PrintInOrder();
      tree.PrintPreOrder();
    });
  });
}

}  // namespace q28

REGISTER_QUESTION(28, "Binary search tree: fix Insert()", q28::RunQ28);
