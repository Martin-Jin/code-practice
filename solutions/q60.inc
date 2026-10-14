void Merge(vector<Item>& a, int L, int m, int R) {
  vector<Item> left(a.begin() + L, a.begin() + m + 1);
  vector<Item> right(a.begin() + m + 1, a.begin() + R + 1);
  int i = 0, j = 0, k = L;
  while (i < (int)left.size() && j < (int)right.size()) {
    if (left[i].key <= right[j].key) {
      a[k++] = left[i++];
    } else {
      a[k++] = right[j++];
    }
  }
  while (i < (int)left.size()) a[k++] = left[i++];
  while (j < (int)right.size()) a[k++] = right[j++];
}
