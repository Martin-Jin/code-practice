void Destroy(Node* n) {
  if (!n) return;
  Destroy(n->left);
  Destroy(n->right);
  delete n;
}
