long long Power(long long base, int exp) {
  if (exp == 0) return 1;
  if (exp % 2 == 0) {
    long long half = Power(base, exp / 2);
    return half * half;
  }
  return base * Power(base, exp - 1);
}
