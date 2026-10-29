int LargestValue(const int* values, int count) {
  if (count <= 0) return 0;
  int largest = values[0];
  for (int i = 1; i < count; ++i) {
    if (values[i] > largest) largest = values[i];
  }
  return largest;
}
