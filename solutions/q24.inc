void BinarySearchTree::Remove(const int& value) { root = Remove(root, value); }

Node* BinarySearchTree::Remove(Node* node, const int& value) {
  if (!node) return nullptr;
  if (value < node->data) {
    node->left = Remove(node->left, value);
  } else if (value > node->data) {
    node->right = Remove(node->right, value);
  } else if (node->left && node->right) {
    node->data = MinNode(node->right)->data;
    node->right = Remove(node->right, node->data);
  } else {
    Node* child = node->left ? node->left : node->right;
    delete node;
    return child;
  }
  return node;
}
