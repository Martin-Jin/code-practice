void ditfft2(const complex<double>* x, complex<double>* X, int N, int s) {
  if (N <= 0) return;
  if (N == 1) {
    X[0] = x[0];
    return;
  }
  ditfft2(x, X, N / 2, 2 * s);
  ditfft2(x + s, X + N / 2, N / 2, 2 * s);
  for (int k = 0; k < N / 2; ++k) {
    complex<double> p = X[k];
    complex<double> q = polar(1.0, -2.0 * M_PI * k / N) * X[k + N / 2];
    X[k] = p + q;
    X[k + N / 2] = p - q;
  }
}
