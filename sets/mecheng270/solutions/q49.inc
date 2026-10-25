void NaiveDft(const complex<double>* x, complex<double>* X, int N) {
  for (int k = 0; k < N; ++k) {
    complex<double> sum(0.0, 0.0);
    for (int n = 0; n < N; ++n) {
      double angle = -2.0 * M_PI * k * n / N;
      sum += x[n] * complex<double>(cos(angle), sin(angle));
    }
    X[k] = sum / static_cast<double>(N);
  }
}
