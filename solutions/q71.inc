vector<string> InfixToPostfix(const vector<string>& infix) {
  vector<string> out, st;
  for (size_t i = 0; i < infix.size(); ++i) {
    const string& t = infix[i];
    if (is_op(t)) {
      while (!st.empty() && is_op(st.back())) {
        int p_top = prec(st.back()), p_in = prec(t);
        if (!(p_top > p_in || (p_top == p_in && !right_assoc(t)))) break;
        out.push_back(st.back());
        st.pop_back();
      }
      st.push_back(t);
    } else if (t == "(") {
      st.push_back(t);
    } else if (t == ")") {
      while (!st.empty() && st.back() != "(") {
        out.push_back(st.back());
        st.pop_back();
      }
      if (st.empty()) throw runtime_error("mismatched ')'");
      st.pop_back();
    } else {
      out.push_back(t);
    }
  }
  while (!st.empty()) {
    if (st.back() == "(") throw runtime_error("mismatched '('");
    out.push_back(st.back());
    st.pop_back();
  }
  return out;
}
