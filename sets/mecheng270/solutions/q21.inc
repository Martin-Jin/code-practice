int BinarySearchTree::FindMin() const {
  if (!root) return -1;
  Node* cur = root;
  while (cur->left) cur = cur->left;
  return cur->data;
}

int BinarySearchTree::FindMax() const {
  if (!root) return -1;
  Node* cur = root;
  while (cur->right) cur = cur->right;
  return cur->data;
}
