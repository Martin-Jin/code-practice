int BinarySearchTree::CountInRangeHelper(Node* node, int lo, int hi) const {
  if (node == nullptr) return 0;
  if (node->data < lo) {
    // Everything in the left subtree is smaller still.
    return CountInRangeHelper(node->right, lo, hi);
  }
  if (node->data > hi) {
    // Everything in the right subtree is larger still.
    return CountInRangeHelper(node->left, lo, hi);
  }
  return 1 + CountInRangeHelper(node->left, lo, hi) + CountInRangeHelper(node->right, lo, hi);
}

int BinarySearchTree::CountInRange(int lo, int hi) const {
  if (lo > hi) return 0;
  return CountInRangeHelper(root, lo, hi);
}
