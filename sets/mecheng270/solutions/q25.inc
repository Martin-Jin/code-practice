bool BinarySearchTree::IsValidBST() const { return IsValidBST(root, LLONG_MIN, LLONG_MAX); }

bool BinarySearchTree::IsValidBST(Node* node, long long min_value, long long max_value) const {
  if (!node) return true;
  if (node->data <= min_value || node->data >= max_value) return false;
  return IsValidBST(node->left, min_value, node->data) &&
         IsValidBST(node->right, node->data, max_value);
}
