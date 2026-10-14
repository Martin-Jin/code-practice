int InsertionSort(vector<int>& a) {
  int comparisons = 0;
  for (int i = 1; i < (int)a.size(); ++i) {
    const int key = a[i];
    int j = i - 1;
    while (j >= 0) {
      ++comparisons;
      if (!(a[j] > key)) break;
      a[j + 1] = a[j];
      --j;
    }
    a[j + 1] = key;
  }
  return comparisons;
}
