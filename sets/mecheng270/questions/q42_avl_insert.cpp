// ============================================================================
// Question 42  (6 marks)  -  AVL tree: InsertValue()
// Topic: AVL trees
//
// Requirements for AVL tree: InsertValue()
//
// You have been provided with an AVL tree of ints. Each node caches its
// height. The class already contains the helpers GetHeight(), GetBalance(),
// UpdateHeight(), the rotations and a correct Rebalance(). The public method
// Insert(value) simply does  root = InsertValue(root, value).
//
// Task
// Implement the private recursive method
//   Node* AvlTree::InsertValue(Node* n, const int& v)
// which inserts v into the subtree rooted at n and returns the (possibly new)
// root of that subtree.
//   - If n is nullptr, return a new node holding v.
//   - Values smaller than n->data go left, larger values go right. A value that
//     is already in the tree is ignored (no duplicates).
//   - On the way back up the recursion, update the height of n and rebalance
//     it, so the whole tree stays a valid AVL tree.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q42 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Node {
  int data;
  Node* left;
  Node* right;
  int height;
  Node(const int& value) : data(value), left(nullptr), right(nullptr), height(0) {}
};

class AvlTree {
 private:
  Node* root;

  static int GetHeight(Node* n) { return n ? n->height : -1; }

  static int GetBalance(Node* n) { return n ? GetHeight(n->left) - GetHeight(n->right) : 0; }

  static Node* UpdateHeight(Node* n) {
    if (n) n->height = 1 + max(GetHeight(n->left), GetHeight(n->right));
    return n;
  }

  static Node* RotateRight(Node* k2) {
    Node* k1 = k2->left;
    Node* y = k1->right;
    k1->right = k2;
    k2->left = y;
    UpdateHeight(k2);
    UpdateHeight(k1);
    return k1;
  }

  static Node* RotateLeft(Node* k1) {
    Node* k2 = k1->right;
    Node* y = k2->left;
    k2->left = k1;
    k1->right = y;
    UpdateHeight(k1);
    UpdateHeight(k2);
    return k2;
  }

  static Node* Rebalance(Node* n) {
    if (!n) return nullptr;
    int balance = GetBalance(n);
    if (balance > 1) {
      if (GetBalance(n->left) >= 0) return RotateRight(n);
      n->left = RotateLeft(n->left);
      return RotateRight(n);
    } else if (balance < -1) {
      if (GetBalance(n->right) <= 0) return RotateLeft(n);
      n->right = RotateRight(n->right);
      return RotateLeft(n);
    }
    return n;
  }

  static void Destroy(Node* n) {
    if (!n) return;
    Destroy(n->left);
    Destroy(n->right);
    delete n;
  }

  static void InorderInto(const Node* n, vector<int>& out) {
    if (!n) return;
    InorderInto(n->left, out);
    out.push_back(n->data);
    InorderInto(n->right, out);
  }

  Node* InsertValue(Node* n, const int& v);

 public:
  AvlTree() : root(nullptr) {}
  ~AvlTree() { Destroy(root); }
  AvlTree(const AvlTree&) = delete;
  AvlTree& operator=(const AvlTree&) = delete;

  void Insert(const int& value) { root = InsertValue(root, value); }

  int Height() const { return GetHeight(root); }
  int RootValue() const { return root ? root->data : -1; }
  const Node* Root() const { return root; }

  vector<int> Inorder() const {
    vector<int> out;
    InorderInto(root, out);
    return out;
  }
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
Node* AvlTree::InsertValue(Node* n, const int& v) {
  // Your implementation here
  return n;
}
#else
#include "../solutions/q42.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
namespace {
// Recomputes real heights; returns -2 if any node is out of balance, has a
// wrong cached height, or the tree is implausibly deep.
int CheckAvl(const Node* n, int depth = 0) {
  if (!n) return -1;
  if (depth > 40) return -2;
  int hl = CheckAvl(n->left, depth + 1), hr = CheckAvl(n->right, depth + 1);
  if (hl == -2 || hr == -2) return -2;
  if (abs(hl - hr) > 1 || n->height != 1 + max(hl, hr)) return -2;
  return n->height;
}

// Inserts `values`, then checks root, height, inorder order and AVL validity.
void InsertAndCheck(const vector<int>& values, int root, int height, const vector<int>& inorder) {
  AvlTree t;
  for (int v : values) t.Insert(v);
  tf::ExpectEq(t.RootValue(), root, "root value");
  tf::ExpectEq(t.Height(), height, "tree height");
  tf::ExpectEq(tf::VecStr(t.Inorder()), tf::VecStr(inorder), "inorder traversal");
  tf::ExpectTrue(CheckAvl(t.Root()) != -2, "every node balanced with a correct cached height");
}
}  // namespace

void RunQ42() {
  tf::Test("ascending 1..7 gives a perfect tree", [] {
    InsertAndCheck({1, 2, 3, 4, 5, 6, 7}, 4, 2, {1, 2, 3, 4, 5, 6, 7});
  });

  tf::Test("descending 7..1 gives a perfect tree", [] {
    InsertAndCheck({7, 6, 5, 4, 3, 2, 1}, 4, 2, {1, 2, 3, 4, 5, 6, 7});
  });

  tf::Test("zigzag inserts (right-left then left-right)", [] {
    InsertAndCheck({10, 30, 20}, 20, 1, {10, 20, 30});
    InsertAndCheck({30, 10, 20}, 20, 1, {10, 20, 30});
  });

  tf::Test("single value and empty tree", [] {
    InsertAndCheck({}, -1, -1, {});
    InsertAndCheck({42}, 42, 0, {42});
  });

  tf::HiddenTest("ascending 1..15 and 1..100", [] {
    vector<int> a, b;
    for (int i = 1; i <= 15; ++i) a.push_back(i);
    for (int i = 1; i <= 100; ++i) b.push_back(i);
    InsertAndCheck(a, 8, 3, a);
    InsertAndCheck(b, 64, 6, b);
  });

  tf::HiddenTest("mixed order needing a left-right rotation deep in the tree", [] {
    // Inserting 25 unbalances 50 (left-right case): 30 becomes the root.
    InsertAndCheck({50, 20, 80, 10, 30, 25}, 30, 2, {10, 20, 25, 30, 50, 80});
  });

  tf::HiddenTest("duplicates are ignored", [] {
    InsertAndCheck({5, 3, 8, 5, 3, 8, 5}, 5, 1, {3, 5, 8});
  });
}

}  // namespace q42

REGISTER_QUESTION(42, "AVL tree: InsertValue()", q42::RunQ42);
