bool BinaryContains(const vector<int>& v, int key) {
  int lo = 0;
  int hi = (int)v.size() - 1;
  while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (v[mid] == key) return true;
    if (v[mid] < key) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return false;
}

bool ContainsAll(const vector<int>& sortedHaystack, const vector<int>& needles) {
  for (size_t i = 0; i < needles.size(); ++i) {
    if (!BinaryContains(sortedHaystack, needles[i])) return false;
  }
  return true;
}
