// ============================================================================
// Question 29  (5 marks)  -  Binary search tree: InOrder() and PreOrder()
// Topic: Trees & binary search trees
//
// Requirements for Binary search tree: InOrder() and PreOrder()
//
// You have been provided with a binary search tree of ints (struct Node with
// `data`, `left`, `right`) with a private root, a constructor, a destructor and
// Insert().
//
// Task
// Implement the traversals below. Each public function returns the values of the
// tree in a vector<int> and must be recursive, using the private helper that
// takes the vector by reference.
//   - InOrder()  : left subtree, node, right subtree (ascending order for a BST)
//   - PreOrder() : node, left subtree, right subtree
// An empty tree gives an empty vector.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q29 {
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

  // Appends the values of the subtree rooted at `node` to `result`.
  void InOrderHelper(Node* node, vector<int>& result) const;
  void PreOrderHelper(Node* node, vector<int>& result) const;

 public:
  BinarySearchTree() : root(nullptr) {}
  ~BinarySearchTree() { Destroy(root); }

  void Insert(int value) { root = InsertHelper(root, value); }

  vector<int> InOrder() const;
  vector<int> PreOrder() const;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void BinarySearchTree::InOrderHelper(Node* node, vector<int>& result) const {
  // Your implementation here
}

void BinarySearchTree::PreOrderHelper(Node* node, vector<int>& result) const {
  // Your implementation here
}

vector<int> BinarySearchTree::InOrder() const {
  vector<int> result;
  return result;
}

vector<int> BinarySearchTree::PreOrder() const {
  vector<int> result;
  return result;
}
#else
#include "../solutions/q29.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
static BinarySearchTree* Build(const vector<int>& values) {
  BinarySearchTree* tree = new BinarySearchTree();
  for (int v : values) tree->Insert(v);
  return tree;
}

void RunQ29() {
  tf::Test("InOrder of a small tree", [] {
    BinarySearchTree* tree = Build({5, 3, 8});
    tf::ExpectEq(tf::VecStr(tree->InOrder()), "[3, 5, 8]", "InOrder");
    delete tree;
  });

  tf::Test("PreOrder of a small tree", [] {
    BinarySearchTree* tree = Build({5, 3, 8});
    tf::ExpectEq(tf::VecStr(tree->PreOrder()), "[5, 3, 8]", "PreOrder");
    delete tree;
  });

  tf::Test("both traversals on a larger tree", [] {
    BinarySearchTree* tree = Build({8, 3, 10, 1, 6, 14, 4, 7, 13});
    tf::ExpectEq(tf::VecStr(tree->InOrder()), "[1, 3, 4, 6, 7, 8, 10, 13, 14]", "InOrder");
    tf::ExpectEq(tf::VecStr(tree->PreOrder()), "[8, 3, 1, 6, 4, 7, 10, 14, 13]", "PreOrder");
    delete tree;
  });

  tf::Test("empty tree gives empty vectors", [] {
    BinarySearchTree* tree = Build({});
    tf::ExpectEq(tree->InOrder().size(), size_t(0), "InOrder size");
    tf::ExpectEq(tree->PreOrder().size(), size_t(0), "PreOrder size");
    delete tree;
  });

  tf::HiddenTest("single node", [] {
    BinarySearchTree* tree = Build({42});
    tf::ExpectEq(tf::VecStr(tree->InOrder()), "[42]", "InOrder");
    tf::ExpectEq(tf::VecStr(tree->PreOrder()), "[42]", "PreOrder");
    delete tree;
  });

  tf::HiddenTest("left-leaning chain", [] {
    BinarySearchTree* tree = Build({5, 4, 3, 2, 1});
    tf::ExpectEq(tf::VecStr(tree->InOrder()), "[1, 2, 3, 4, 5]", "InOrder");
    tf::ExpectEq(tf::VecStr(tree->PreOrder()), "[5, 4, 3, 2, 1]", "PreOrder");
    delete tree;
  });

  tf::HiddenTest("negative values and repeated calls", [] {
    BinarySearchTree* tree = Build({0, -5, 5, -10, -2, 2, 10});
    tf::ExpectEq(tf::VecStr(tree->InOrder()), "[-10, -5, -2, 0, 2, 5, 10]", "InOrder");
    tf::ExpectEq(tf::VecStr(tree->PreOrder()), "[0, -5, -10, -2, 5, 2, 10]", "PreOrder");
    // Calling again must give the same answer (no leftover state).
    tf::ExpectEq(tf::VecStr(tree->InOrder()), "[-10, -5, -2, 0, 2, 5, 10]", "InOrder again");
    delete tree;
  });
}

}  // namespace q29

REGISTER_QUESTION(29, "Binary search tree: InOrder() and PreOrder()", q29::RunQ29);
