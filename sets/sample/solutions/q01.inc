int Sum(const int* values, int count) {
  int total = 0;
  for (int i = 0; i < count; ++i) total += values[i];
  return total;
}
