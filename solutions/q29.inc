void BinarySearchTree::InOrderHelper(Node* node, vector<int>& result) const {
  if (node == nullptr) return;
  InOrderHelper(node->left, result);
  result.push_back(node->data);
  InOrderHelper(node->right, result);
}

void BinarySearchTree::PreOrderHelper(Node* node, vector<int>& result) const {
  if (node == nullptr) return;
  result.push_back(node->data);
  PreOrderHelper(node->left, result);
  PreOrderHelper(node->right, result);
}

vector<int> BinarySearchTree::InOrder() const {
  vector<int> result;
  InOrderHelper(root, result);
  return result;
}

vector<int> BinarySearchTree::PreOrder() const {
  vector<int> result;
  PreOrderHelper(root, result);
  return result;
}
