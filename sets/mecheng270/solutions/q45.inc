int BinarySearchCount(const vector<int>& v, int key, int& probes) {
  int low = 0;
  int high = static_cast<int>(v.size()) - 1;
  probes = 0;
  while (low <= high) {
    int mid = low + (high - low) / 2;
    ++probes;
    if (v[mid] == key) {
      return mid;
    } else if (v[mid] < key) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return -1;
}
