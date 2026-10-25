void BigOConstants(int a, int b, int d, long long& c, long long& n0) {
  // For N >= 1: N <= N^2 and 1 <= N^2, so aN^2 + bN + d <= (a + b + d) N^2.
  c = (long long)a + b + d;
  n0 = 1;
}
