void NthRoots(complex<double>* W, int N, double rotation_radians) {
  for (int k = 0; k < N; ++k) {
    double angle = -(2.0 * M_PI * k / N + rotation_radians);
    W[k] = complex<double>(cos(angle), sin(angle));
  }
}
