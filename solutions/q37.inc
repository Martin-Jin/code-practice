int Gcd(int m, int n) {
  if (n > m) return Gcd(n, m);  // G1: order
  if (n == 0) return m;         // G2: terminate
  return Gcd(n, m % n);         // G3: remainder
}
