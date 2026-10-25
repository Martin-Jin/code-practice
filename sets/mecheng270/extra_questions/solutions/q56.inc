void MirrorSwap(vector<int>& v) {
  if (v.empty()) return;
  auto lo = v.begin();
  auto hi = v.end() - 1;
  while (lo < hi) {
    swap(*lo, *hi);
    ++lo;
    --hi;
  }
}
