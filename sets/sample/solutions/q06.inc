int Power(int base, int exponent) {
  if (exponent <= 0) return 1;
  return base * Power(base, exponent - 1);
}
