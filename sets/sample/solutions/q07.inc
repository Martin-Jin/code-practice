complex<double> Rotate(complex<double> z, double angle) {
  return z * polar(1.0, angle);
}
