void BinarySearchTree::Insert(const int& value) { root = Insert(root, value); }

Node* BinarySearchTree::Insert(Node* node, const int& value) {
  if (!node) return new Node(value);
  if (value < node->data) {
    node->left = Insert(node->left, value);
  } else if (value > node->data) {
    node->right = Insert(node->right, value);
  }
  return node;
}
