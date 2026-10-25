void DoubleAll(vector<int>& v) {
  for (auto& x : v) {
    x *= 2;
  }
}

void ClampNegativesToZero(vector<int>& v) {
  for (auto it = v.begin(); it != v.end(); ++it) {
    if (*it < 0) *it = 0;
  }
}
