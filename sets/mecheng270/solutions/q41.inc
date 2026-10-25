Node* Rebalance(Node* n) {
  if (!n) return nullptr;

  int balance = GetBalance(n);
  if (balance > 1) {  // left-heavy
    if (GetBalance(n->left) < 0) n->left = RotateLeft(n->left);  // left-right: straighten first
    return RotateRight(n);
  } else if (balance < -1) {  // right-heavy
    if (GetBalance(n->right) > 0) n->right = RotateRight(n->right);  // right-left: straighten first
    return RotateLeft(n);
  }
  return n;  // balance in [-1, 1], nothing to do
}
