double Average(const int* values, int count) {
  if (count <= 0) return 0.0;
  double total = 0.0;
  for (int i = 0; i < count; ++i) total += values[i];
  return total / count;
}
