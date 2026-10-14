int CountInversions(const vector<int>& a) {
  int count = 0;
  for (int i = 0; i < (int)a.size(); ++i) {
    for (int j = i + 1; j < (int)a.size(); ++j) {
      if (a[i] > a[j]) ++count;
    }
  }
  return count;
}
