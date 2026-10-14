int CountOperators(Node* n) {
  if (!n) return 0;
  return (is_op(n->tok) ? 1 : 0) + CountOperators(n->left) +
         CountOperators(n->right);
}

int Height(Node* n) {
  if (!n) return -1;
  return 1 + max(Height(n->left), Height(n->right));
}
