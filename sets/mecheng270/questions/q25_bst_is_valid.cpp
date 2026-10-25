// ============================================================================
// Question 25  (7 marks)  -  Binary tree: IsValidBST()
// Topic: Trees & binary search trees
//
// Requirements for Binary tree: IsValidBST()
//
// You have been provided with a binary tree of ints (Node holds data, left and
// right). The tree is built by hand from raw Node pointers and handed to the
// BinarySearchTree constructor, so it may NOT actually be a valid binary
// search tree.
//
// Task
// Implement both IsValidBST functions of class BinarySearchTree:
//   - the public   bool IsValidBST() const
//   - the private  bool IsValidBST(Node* node, long long min_value,
//                                   long long max_value) const
// A tree is a valid BST if, for EVERY node, all values in its left subtree are
// strictly smaller than the node's value and all values in its right subtree
// are strictly larger. Duplicate values therefore make a tree invalid.
// Checking only a node against its direct children is not enough: pass down
// the allowed (exclusive) range min_value < node->data < max_value.
// An empty tree and a single node are valid.
//
// Your answer to this question must make use of recursion.
//
// Note: there are four visible test cases and four hidden test cases.
// ============================================================================
#include <climits>

#include "framework/test_framework.h"

namespace q25 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Node {
  int data;
  Node* left;
  Node* right;
  Node(const int& value, Node* l = nullptr, Node* r = nullptr)
      : data(value), left(l), right(r) {}
};

class BinarySearchTree {
 private:
  Node* root;

  void Destroy(Node* node) {
    if (!node) return;
    Destroy(node->left);
    Destroy(node->right);
    delete node;
  }

  // True if every value in the subtree is in the open range (min_value, max_value)
  // and the subtree is itself a valid BST.
  bool IsValidBST(Node* node, long long min_value, long long max_value) const;

 public:
  // Takes ownership of the tree starting at `r` (may be nullptr).
  explicit BinarySearchTree(Node* r) : root(r) {}
  ~BinarySearchTree() { Destroy(root); }

  bool IsValidBST() const;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
bool BinarySearchTree::IsValidBST() const {
  // Your implementation here
  return true;
}

bool BinarySearchTree::IsValidBST(Node* node, long long min_value, long long max_value) const {
  // Your implementation here
  return true;
}
#else
#include "../solutions/q25.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ25() {
  tf::Test("valid BST", [] {
    // 8 -> (3 -> (1, 6)), (10 -> (-, 14))
    BinarySearchTree tree(new Node(8, new Node(3, new Node(1), new Node(6)),
                                   new Node(10, nullptr, new Node(14))));
    tf::ExpectOutput("Valid: true\n",
                     [&] { cout << "Valid: " << boolalpha << tree.IsValidBST() << endl; });
  });

  tf::Test("empty tree and single node are valid", [] {
    BinarySearchTree empty(nullptr);
    BinarySearchTree single(new Node(5));
    tf::ExpectTrue(empty.IsValidBST(), "empty tree should be valid");
    tf::ExpectTrue(single.IsValidBST(), "single node should be valid");
  });

  tf::Test("child on the wrong side of its parent", [] {
    BinarySearchTree tree(new Node(5, new Node(7), nullptr));  // left child larger
    tf::ExpectOutput("Valid: false\n",
                     [&] { cout << "Valid: " << boolalpha << tree.IsValidBST() << endl; });
  });

  tf::Test("grandchild violates an ancestor (left subtree)", [] {
    // 12 > 5 is fine locally, but 12 > 10 although it is in the LEFT subtree of 10.
    BinarySearchTree tree(new Node(10, new Node(5, new Node(2), new Node(12)), new Node(15)));
    tf::ExpectOutput("Valid: false\n",
                     [&] { cout << "Valid: " << boolalpha << tree.IsValidBST() << endl; });
  });

  tf::HiddenTest("grandchild violates an ancestor (right subtree)", [] {
    // 8 < 15 is fine locally, but 8 < 10 although it is in the RIGHT subtree of 10.
    BinarySearchTree tree(new Node(10, new Node(5), new Node(15, new Node(8), new Node(20))));
    tf::ExpectEq(tree.IsValidBST(), false, "IsValidBST");
  });

  tf::HiddenTest("duplicate values are invalid", [] {
    BinarySearchTree left_dup(new Node(5, new Node(5), nullptr));
    BinarySearchTree right_dup(new Node(5, nullptr, new Node(5)));
    tf::ExpectEq(left_dup.IsValidBST(), false, "duplicate on the left");
    tf::ExpectEq(right_dup.IsValidBST(), false, "duplicate on the right");
  });

  tf::HiddenTest("extreme int values", [] {
    BinarySearchTree a(new Node(INT_MIN, nullptr, new Node(0, nullptr, new Node(INT_MAX))));
    BinarySearchTree b(new Node(INT_MAX, new Node(0, new Node(INT_MIN), nullptr), nullptr));
    tf::ExpectEq(a.IsValidBST(), true, "INT_MIN root with larger descendants");
    tf::ExpectEq(b.IsValidBST(), true, "INT_MAX root with smaller descendants");
  });

  tf::HiddenTest("deep violation at a leaf", [] {
    // 19 is deep in the right subtree of 20 (path 20 -> 30 -> 40 -> 19).
    BinarySearchTree tree(new Node(20, new Node(10, nullptr, new Node(15, new Node(12), nullptr)),
                                   new Node(30, new Node(25), new Node(40, new Node(19), nullptr))));
    tf::ExpectEq(tree.IsValidBST(), false, "19 sits in the right subtree of 20");
  });
}

}  // namespace q25

REGISTER_QUESTION(25, "Binary tree: IsValidBST()", q25::RunQ25);
