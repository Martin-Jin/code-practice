vector<string> Tokenize(const string& text) {
  vector<string> tokens;
  size_t i = 0;
  while (i < text.size()) {
    char c = text[i];
    if (isspace(static_cast<unsigned char>(c))) {
      ++i;
    } else if (isdigit(static_cast<unsigned char>(c)) || c == '.') {
      size_t j = i;
      while (j < text.size() &&
             (isdigit(static_cast<unsigned char>(text[j])) || text[j] == '.')) {
        ++j;
      }
      tokens.push_back(text.substr(i, j - i));
      i = j;
    } else if (isalpha(static_cast<unsigned char>(c)) || c == '_') {
      size_t j = i;
      while (j < text.size() &&
             (isalnum(static_cast<unsigned char>(text[j])) || text[j] == '_')) {
        ++j;
      }
      tokens.push_back(text.substr(i, j - i));
      i = j;
    } else {  // operator or bracket: one character
      tokens.push_back(string(1, c));
      ++i;
    }
  }
  return tokens;
}
