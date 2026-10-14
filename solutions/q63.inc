void QuickSort(vector<int>& a, int L, int R) {
  if (L >= R) return;
  const int p = Partition(a, L, R);
  QuickSort(a, L, p - 1);
  QuickSort(a, p + 1, R);
}
