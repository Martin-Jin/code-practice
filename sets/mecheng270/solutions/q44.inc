int SentinelSearch(vector<int>& v, int x) {
  int n = v.size();
  v.push_back(x);           // LS1: sentinel at index n
  int i = 0;                // LS2
  while (v[i] != x) i++;    // LS3, LS4
  v.pop_back();             // restore the caller's vector
  return (i < n) ? i : -1;  // LS5
}
