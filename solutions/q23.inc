int BinarySearchTree::CountNodes() const { return CountNodes(root); }

int BinarySearchTree::CountNodes(Node* node) const {
  if (!node) return 0;
  return 1 + CountNodes(node->left) + CountNodes(node->right);
}

int BinarySearchTree::CountLeaves() const { return CountLeaves(root); }

int BinarySearchTree::CountLeaves(Node* node) const {
  if (!node) return 0;
  if (!node->left && !node->right) return 1;
  return CountLeaves(node->left) + CountLeaves(node->right);
}
