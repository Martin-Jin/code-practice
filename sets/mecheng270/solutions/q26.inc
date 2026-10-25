void BinarySearchTree::PrintReverse() const { PrintReverse(root); }

void BinarySearchTree::PrintReverse(Node* node) const {
  if (!node) return;
  PrintReverse(node->right);
  cout << node->data << endl;
  PrintReverse(node->left);
}
