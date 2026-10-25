void MergeSort(vector<int>& a, int L, int R) {
  if (L >= R) return;
  const int m = L + (R - L) / 2;
  MergeSort(a, L, m);
  MergeSort(a, m + 1, R);
  Merge(a, L, m, R);
}
