int EvaluatePostfix(const string& expression) {
  stack<int> values;
  istringstream in(expression);
  string token;
  while (in >> token) {
    if (token == "+" || token == "-" || token == "*" || token == "/") {
      int right = values.top();
      values.pop();
      int left = values.top();
      values.pop();
      if (token == "+") {
        values.push(left + right);
      } else if (token == "-") {
        values.push(left - right);
      } else if (token == "*") {
        values.push(left * right);
      } else {
        values.push(left / right);
      }
    } else {
      values.push(stoi(token));
    }
  }
  return values.top();
}
