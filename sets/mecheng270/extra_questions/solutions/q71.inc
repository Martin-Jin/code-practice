double Eval(Node* n, const unordered_map<string, double>& env) {
  if (!n) return 0.0;
  if (!is_op(n->tok)) {  // leaf
    if (IsNumber(n->tok)) return stod(n->tok);
    auto it = env.find(n->tok);
    if (it == env.end()) throw runtime_error("unknown variable: " + n->tok);
    return it->second;
  }
  double a = Eval(n->left, env);
  double b = Eval(n->right, env);
  if (n->tok == "+") return a + b;
  if (n->tok == "-") return a - b;
  if (n->tok == "*") return a * b;
  if (n->tok == "/") {
    if (b == 0.0) throw runtime_error("division by zero");
    return a / b;
  }
  return pow(a, b);  // "^"
}
