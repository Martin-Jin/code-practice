Node* RotateRight(Node* k2) {
  Node* k1 = k2->left;
  Node* y = k1->right;
  k1->right = k2;
  k2->left = y;
  UpdateHeight(k2);  // k2 is now k1's child, so it must be updated first
  UpdateHeight(k1);
  return k1;  // new subtree root
}

Node* RotateLeft(Node* k1) {
  Node* k2 = k1->right;
  Node* y = k2->left;
  k2->left = k1;
  k1->right = y;
  UpdateHeight(k1);
  UpdateHeight(k2);
  return k2;
}
