bool IsPalindrome(const string& s, int lo, int hi) {
  if (lo >= hi) {
    return true;
  }
  if (s[lo] != s[hi]) {
    return false;
  }
  return IsPalindrome(s, lo + 1, hi - 1);
}
