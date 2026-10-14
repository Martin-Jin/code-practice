unsigned long long SumTo(int n) {
  unsigned long long N = (unsigned long long)n;
  return N * (N + 1ULL) / 2ULL;
}

unsigned long long SumSquares(int n) {
  unsigned long long N = (unsigned long long)n;
  return N * (N + 1ULL) * (2ULL * N + 1ULL) / 6ULL;
}
