int BinarySearchRec(const vector<int>& v, int key, int low, int high) {
  if (low > high) {
    return -1;
  }
  int mid = low + (high - low) / 2;
  if (v[mid] == key) {
    return mid;
  } else if (v[mid] < key) {
    return BinarySearchRec(v, key, mid + 1, high);
  }
  return BinarySearchRec(v, key, low, mid - 1);
}
