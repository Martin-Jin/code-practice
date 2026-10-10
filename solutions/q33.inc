string ReverseString(const string& s) {
  if (s.empty()) return "";
  return ReverseString(s.substr(1)) + s[0];
}
