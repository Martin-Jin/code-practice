long long StepsA(int N) {
  if (N <= 0) return 0;
  long long n = N;
  return n * n;
}

long long StepsB(int N) {
  if (N <= 0) return 0;
  long long n = N;
  return n * (n - 1) / 2;
}

int StepsC(int N) {
  int count = 0;
  while (N > 1) {
    N /= 2;
    ++count;
  }
  return count;
}
