int BinarySearchTree::Height() const { return Height(root); }

int BinarySearchTree::Height(Node* node) const {
  if (!node) return -1;
  int left_height = Height(node->left);
  int right_height = Height(node->right);
  return 1 + (left_height > right_height ? left_height : right_height);
}
