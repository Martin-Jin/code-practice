complex<double> DftBin(const vector<double>& x, int k) {
  int N = static_cast<int>(x.size());
  complex<double> sum(0.0, 0.0);
  for (int n = 0; n < N; ++n) {
    double angle = -2.0 * M_PI * k * n / N;
    sum += x[n] * complex<double>(cos(angle), sin(angle));
  }
  return N > 0 ? sum / static_cast<double>(N) : sum;
}
