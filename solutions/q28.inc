Node* BinarySearchTree::InsertHelper(Node* node, int value) {
  if (node == nullptr) {
    return new Node(value);
  }
  if (value < node->data) {
    node->left = InsertHelper(node->left, value);
  } else if (value > node->data) {
    node->right = InsertHelper(node->right, value);
  }
  return node;
}
