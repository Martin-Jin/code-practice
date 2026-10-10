bool IsBalanced(const string& text) {
  stack<char> open;
  for (char c : text) {
    if (c == '(' || c == '[' || c == '{') {
      open.push(c);
    } else if (c == ')' || c == ']' || c == '}') {
      if (open.empty()) {
        return false;
      }
      char top = open.top();
      open.pop();
      if ((c == ')' && top != '(') || (c == ']' && top != '[') || (c == '}' && top != '{')) {
        return false;
      }
    }
  }
  return open.empty();
}
