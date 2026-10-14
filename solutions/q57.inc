int SelectionSort(vector<int>& a) {
  const int N = (int)a.size();
  int comparisons = 0;
  for (int i = 0; i < N - 1; ++i) {
    int min_idx = i;
    for (int j = i + 1; j < N; ++j) {
      ++comparisons;
      if (a[j] < a[min_idx]) min_idx = j;
    }
    Swap(a[i], a[min_idx]);
  }
  return comparisons;
}
