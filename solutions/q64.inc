void StableSortByKey(vector<Record>& r) {
  for (int i = 1; i < (int)r.size(); ++i) {
    const Record cur = r[i];
    int j = i - 1;
    while (j >= 0 && r[j].key > cur.key) {
      r[j + 1] = r[j];
      --j;
    }
    r[j + 1] = cur;
  }
}
