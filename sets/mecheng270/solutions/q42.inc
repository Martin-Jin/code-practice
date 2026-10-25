Node* AvlTree::InsertValue(Node* n, const int& v) {
  if (!n) return new Node(v);
  if (v == n->data) return n;  // no duplicates
  if (v < n->data) {
    n->left = InsertValue(n->left, v);
  } else {
    n->right = InsertValue(n->right, v);
  }
  return Rebalance(UpdateHeight(n));  // runs on the way back up
}
