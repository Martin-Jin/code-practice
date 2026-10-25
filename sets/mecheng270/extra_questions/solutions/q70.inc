Node* BuildFromPostfix(const vector<string>& pf) {
  vector<Node*> st;
  for (size_t i = 0; i < pf.size(); ++i) {
    const string& t = pf[i];
    if (!is_op(t)) {
      st.push_back(new Node(t));
    } else {
      if (st.size() < 2) {
        for (size_t k = 0; k < st.size(); ++k) Free(st[k]);
        throw runtime_error("malformed postfix: stack underflow");
      }
      Node* r = st.back();
      st.pop_back();
      Node* l = st.back();
      st.pop_back();
      Node* n = new Node(t);
      n->left = l;
      n->right = r;
      st.push_back(n);
    }
  }
  if (st.size() != 1) {
    for (size_t k = 0; k < st.size(); ++k) Free(st[k]);
    throw runtime_error("malformed postfix: leftover trees");
  }
  return st.back();
}
