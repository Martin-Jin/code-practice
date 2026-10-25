string ToInfix(Node* n) {
  if (!n) return "";
  if (!is_op(n->tok)) return n->tok;
  string L = ToInfix(n->left), R = ToInfix(n->right);
  int p = prec(n->tok);
  if (n->left && is_op(n->left->tok)) {
    int lp = prec(n->left->tok);
    if (lp < p || (lp == p && right_assoc(n->tok))) L = "(" + L + ")";
  }
  if (n->right && is_op(n->right->tok)) {
    int rp = prec(n->right->tok);
    if (rp < p || (rp == p && !right_assoc(n->tok))) R = "(" + R + ")";
  }
  return L + " " + n->tok + " " + R;
}
