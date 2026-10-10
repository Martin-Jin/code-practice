// ============================================================================
// Question 30  (5 marks)  -  Binary search tree: CountInRange()
// Topic: Trees & binary search trees
//
// Requirements for Binary search tree: CountInRange()
//
// You have been provided with a binary search tree of ints (struct Node with
// `data`, `left`, `right`) with a private root, a constructor, a destructor and
// Insert().
//
// Task
// Implement BinarySearchTree::CountInRange(int lo, int hi), which returns how
// many values v stored in the tree satisfy lo <= v <= hi (both ends inclusive).
// If lo > hi the answer is 0.
// Use the private recursive helper CountInRangeHelper(Node*, int, int). Make use
// of the BST ordering: do not search a subtree that cannot contain any value in
// the range.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q30 {
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

  Node* InsertHelper(Node* node, int value) {
    if (node == nullptr) return new Node(value);
    if (value < node->data) {
      node->left = InsertHelper(node->left, value);
    } else if (value > node->data) {
      node->right = InsertHelper(node->right, value);
    }
    return node;
  }

  void Destroy(Node* node) {
    if (node == nullptr) return;
    Destroy(node->left);
    Destroy(node->right);
    delete node;
  }

  int CountInRangeHelper(Node* node, int lo, int hi) const;

 public:
  BinarySearchTree() : root(nullptr) {}
  ~BinarySearchTree() { Destroy(root); }

  void Insert(int value) { root = InsertHelper(root, value); }

  // Number of values v in the tree with lo <= v <= hi.
  int CountInRange(int lo, int hi) const;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int BinarySearchTree::CountInRangeHelper(Node* node, int lo, int hi) const {
  // Your implementation here
  return 0;
}

int BinarySearchTree::CountInRange(int lo, int hi) const {
  // Your implementation here
  return 0;
}
#else
#include "../solutions/q30.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
static BinarySearchTree* Build(const vector<int>& values) {
  BinarySearchTree* tree = new BinarySearchTree();
  for (int v : values) tree->Insert(v);
  return tree;
}

void RunQ30() {
  tf::Test("range covering the middle of the tree", [] {
    BinarySearchTree* tree = Build({8, 3, 10, 1, 6, 14, 4, 7, 13});
    tf::ExpectEq(tree->CountInRange(4, 10), 5, "CountInRange(4, 10)");  // 4 6 7 8 10
    delete tree;
  });

  tf::Test("range covering everything", [] {
    BinarySearchTree* tree = Build({8, 3, 10, 1, 6, 14, 4, 7, 13});
    tf::ExpectEq(tree->CountInRange(-100, 100), 9, "CountInRange(-100, 100)");
    delete tree;
  });

  tf::Test("range with no values", [] {
    BinarySearchTree* tree = Build({8, 3, 10, 1, 6, 14, 4, 7, 13});
    tf::ExpectEq(tree->CountInRange(11, 12), 0, "CountInRange(11, 12)");
    tf::ExpectEq(tree->CountInRange(20, 30), 0, "CountInRange(20, 30)");
    delete tree;
  });

  tf::Test("empty tree", [] {
    BinarySearchTree* tree = Build({});
    tf::ExpectEq(tree->CountInRange(0, 10), 0, "CountInRange(0, 10)");
    delete tree;
  });

  tf::HiddenTest("both ends are inclusive", [] {
    BinarySearchTree* tree = Build({5, 2, 8, 1, 3, 7, 9});
    tf::ExpectEq(tree->CountInRange(2, 8), 5, "CountInRange(2, 8)");
    tf::ExpectEq(tree->CountInRange(5, 5), 1, "CountInRange(5, 5)");
    tf::ExpectEq(tree->CountInRange(9, 9), 1, "CountInRange(9, 9)");
    delete tree;
  });

  tf::HiddenTest("lo greater than hi", [] {
    BinarySearchTree* tree = Build({5, 2, 8});
    tf::ExpectEq(tree->CountInRange(8, 2), 0, "CountInRange(8, 2)");
    delete tree;
  });

  tf::HiddenTest("chain-shaped trees and negatives", [] {
    BinarySearchTree* left_chain = Build({5, 4, 3, 2, 1, 0, -1});
    tf::ExpectEq(left_chain->CountInRange(-1, 2), 4, "left chain");
    tf::ExpectEq(left_chain->CountInRange(6, 9), 0, "left chain above");
    delete left_chain;
    BinarySearchTree* right_chain = Build({-3, -2, -1, 0, 1, 2});
    tf::ExpectEq(right_chain->CountInRange(-2, 0), 3, "right chain");
    delete right_chain;
  });
}

}  // namespace q30

REGISTER_QUESTION(30, "Binary search tree: CountInRange()", q30::RunQ30);
