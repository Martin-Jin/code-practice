int FindMax(const vector<int>& a, int& index, int& comparisons) {
  comparisons = 0;
  index = -1;
  if (a.empty()) return -1;
  int n = static_cast<int>(a.size());
  int j = n - 1;          // M1: j <- n, m <- a[n]
  int m = a[n - 1];
  int k = n - 2;          //     k <- n - 1
  while (k >= 0) {        // M2: k = 0 -> terminate
    ++comparisons;        // M3: compare a[k] with m
    if (a[k] > m) {       // M4: new maximum
      m = a[k];
      j = k;
    }
    --k;                  // M5: decrease k, back to M2
  }
  index = j;
  return m;
}
