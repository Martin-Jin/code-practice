double EvaluateInfix(const vector<string>& infix,
                     const unordered_map<string, double>& env) {
  Node* root = BuildFromPostfix(InfixToPostfix(infix));
  double result;
  try {
    result = Eval(root, env);
  } catch (...) {
    Destroy(root);  // do not leak the tree when Eval throws
    throw;
  }
  Destroy(root);
  return result;
}
