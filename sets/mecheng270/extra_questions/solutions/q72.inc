static void Collect(Node* n, bool pre, vector<string>& out) {
  if (!n) return;
  if (pre) out.push_back(n->tok);
  Collect(n->left, pre, out);
  Collect(n->right, pre, out);
  if (!pre) out.push_back(n->tok);
}

static string Join(const vector<string>& v) {
  string s;
  for (size_t i = 0; i < v.size(); ++i) s += (i ? " " : "") + v[i];
  return s;
}

string ToPrefix(Node* n) {
  vector<string> v;
  Collect(n, true, v);
  return Join(v);
}

string ToPostfix(Node* n) {
  vector<string> v;
  Collect(n, false, v);
  return Join(v);
}
