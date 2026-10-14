int KthFromEnd(const list<int>& l, int k) {
  if (k < 1 || k > static_cast<int>(l.size())) return -1;
  return *prev(l.end(), k);
}
