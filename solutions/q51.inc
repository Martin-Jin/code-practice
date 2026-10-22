void NaiveIdft(const complex<double>* X, complex<double>* x, int N) {
  for (int n = 0; n < N; ++n) {
    complex<double> sum(0.0, 0.0);
    for (int k = 0; k < N; ++k) {
      double angle = 2.0 * M_PI * k * n / N;
      sum += X[k] * complex<double>(cos(angle), sin(angle));
    }
    x[n] = sum;
  }
}
