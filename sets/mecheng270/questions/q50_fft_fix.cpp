// ============================================================================
// Question 50  (4 marks)  -  Fix the bugs: ditfft2()
// Topic: Fast Fourier transform
//
// Requirements for Fix the bugs: ditfft2()
//
// ditfft2(x, X, N, s) is the radix-2 decimation-in-time Cooley-Tukey FFT. It
// computes the (un-normalised) DFT of the N samples x[0], x[s], x[2s], ...,
// x[(N-1)s] and writes the N results to X[0..N-1]. N is a power of 2.
// Recursively:
//   - N == 1: X[0] = x[0].
//   - otherwise: the DFT of the even-indexed samples goes in X[0..N/2-1], the
//     DFT of the odd-indexed samples goes in X[N/2..N-1], then for each
//     k = 0..N/2-1, with p = X[k] and q = e^{-i*2*pi*k/N} * X[k+N/2]:
//         X[k] = p + q,   X[k + N/2] = p - q.
// The wrapper fft() (provided) calls ditfft2 and then divides by N to give the
// normalised DFT used in this course.
//
// Task
// The ditfft2 in the answer box has several bugs (recursion, twiddle factor,
// base case for N == 2 and the combine step). Fix them.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q50 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
void ditfft2(const complex<double>* x, complex<double>* X, int N, int s);

void fft(const complex<double>* x, complex<double>* X, int N) {
  ditfft2(x, X, N, 1);
  for (int k = 0; k < N; ++k) X[k] /= static_cast<double>(N);
}

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void ditfft2(const complex<double>* x, complex<double>* X, int N, int s) {
  if (N <= 0) return;
  if (N == 1) {
    X[0] = x[0];
    return;
  }
  if (N == 2) {
    X[0] = x[0];
    X[1] = x[s];
    return;
  }
  ditfft2(x, X, N / 2, 2 * s);
  ditfft2(x + s, X + N / 2, N / 2, s);
  for (int k = 0; k < N / 2; ++k) {
    complex<double> p = X[k];
    complex<double> q = polar(1.0, 2.0 * M_PI * k / N) * X[k + N / 2];
    X[k] = p + q;
    X[k + N / 2] = p + q;
  }
}
#else
#include "../solutions/q50.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
static void PrintFft(const complex<double>* x, int N) {
  complex<double> X[16];
  fft(x, X, N);
  SanitiseNegativeZero(X, N);
  cout << fixed << setprecision(4);
  for (int k = 0; k < N; ++k) cout << X[k] << endl;
}

static void ExpectMatchesNaive(const complex<double>* x, int N) {
  complex<double> X[16];
  fft(x, X, N);
  for (int k = 0; k < N; ++k) {
    complex<double> sum(0, 0);
    for (int n = 0; n < N; ++n) sum += x[n] * polar(1.0, -2.0 * M_PI * k * n / N);
    tf::ExpectComplexNear(X[k], sum / static_cast<double>(N), "X[" + to_string(k) + "]");
  }
}

void RunQ50() {
  tf::Test("cosine signal, N = 8", [] {
    complex<double> x[8];
    for (int n = 0; n < 8; ++n) x[n] = cos(2.0 * M_PI * n / 8);
    tf::ExpectOutput(
        "(0.0000,0.0000)\n(0.5000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n"
        "(0.0000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n(0.5000,0.0000)\n",
        [&] { PrintFft(x, 8); });
  });

  tf::Test("sine signal, N = 8", [] {
    complex<double> x[8];
    for (int n = 0; n < 8; ++n) x[n] = sin(2.0 * M_PI * n / 8);
    tf::ExpectOutput(
        "(0.0000,0.0000)\n(0.0000,-0.5000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n"
        "(0.0000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.5000)\n",
        [&] { PrintFft(x, 8); });
  });

  tf::Test("N = 4 ramp", [] {
    complex<double> x[4] = {1, 2, 3, 4};
    tf::ExpectOutput("(2.5000,0.0000)\n(-0.5000,0.5000)\n(-0.5000,0.0000)\n(-0.5000,-0.5000)\n",
                     [&] { PrintFft(x, 4); });
  });

  tf::Test("N = 2", [] {
    complex<double> x[2] = {1, 3};
    tf::ExpectOutput("(2.0000,0.0000)\n(-1.0000,0.0000)\n", [&] { PrintFft(x, 2); });
  });

  tf::HiddenTest("N = 1 and constant N = 8", [] {
    complex<double> one[1] = {complex<double>(4, -1)};
    complex<double> c[8] = {1, 1, 1, 1, 1, 1, 1, 1};
    tf::ExpectOutput(
        "(4.0000,-1.0000)\n(1.0000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n"
        "(0.0000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n",
        [&] {
          PrintFft(one, 1);
          PrintFft(c, 8);
        });
  });

  tf::HiddenTest("matches the naive DFT, N = 8 (real and complex input)", [] {
    complex<double> x[8] = {3, -1, 4, 1, -5, 9, 2, -6};
    ExpectMatchesNaive(x, 8);
    complex<double> y[8];
    for (int n = 0; n < 8; ++n) y[n] = complex<double>(n * n % 5, 2 - n);
    ExpectMatchesNaive(y, 8);
  });

  tf::HiddenTest("matches the naive DFT, N = 16", [] {
    complex<double> x[16];
    for (int n = 0; n < 16; ++n) x[n] = complex<double>(sin(0.7 * n) + n % 3, cos(1.3 * n));
    ExpectMatchesNaive(x, 16);
  });
}

}  // namespace q50

REGISTER_QUESTION(50, "Fix the bugs: ditfft2()", q50::RunQ50);
