Node* RotateRight(Node* k2) {
  Node* k1 = k2->left;
  Node* y = k1->right;
  k1->right = k2;
  k2->left = y;      // reattach k1's old RIGHT subtree (y), not k1->left
  UpdateHeight(k2);  // k2 is now k1's child: update it first
  UpdateHeight(k1);
  return k1;
}
