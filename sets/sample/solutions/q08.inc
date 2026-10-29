bool IsPalindrome(const string& text) {
  int left = 0;
  int right = static_cast<int>(text.size()) - 1;
  while (left < right) {
    if (!isalpha(static_cast<unsigned char>(text[left]))) {
      ++left;
    } else if (!isalpha(static_cast<unsigned char>(text[right]))) {
      --right;
    } else {
      if (tolower(static_cast<unsigned char>(text[left])) !=
          tolower(static_cast<unsigned char>(text[right]))) {
        return false;
      }
      ++left;
      --right;
    }
  }
  return true;
}
