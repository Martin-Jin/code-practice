int PartitionSpan(vector<int>& a, int L, int R) {
  const int pivot = a[R];
  int i = L;
  for (int j = L; j < R; ++j) {
    if (a[j] <= pivot) {
      swap(a[i], a[j]);
      ++i;
    }
  }
  swap(a[i], a[R]);
  return i;
}
