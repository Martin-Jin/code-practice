int GetHeight(Node* n) {
  return n ? n->height : -1;  // empty tree has height -1
}

int GetBalance(Node* n) {
  return n ? GetHeight(n->left) - GetHeight(n->right) : 0;
}

Node* UpdateHeight(Node* n) {
  if (n) n->height = 1 + max(GetHeight(n->left), GetHeight(n->right));
  return n;
}
