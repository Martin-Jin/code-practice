// ============================================================================
// Question 51  (5 marks)  -  Inverse naive DFT: NaiveIdft()
// Topic: Fourier transform and DFT
//
// Requirements for Inverse naive DFT: NaiveIdft()
//
// The normalised DFT turns N complex samples x_n into coefficients
//     X_k = (1/N) * sum_{n=0}^{N-1} x_n * e^{-i*2*pi*k*n/N},  k = 0..N-1.
// The inverse transform recovers the samples from the coefficients:
//     x_n = sum_{k=0}^{N-1} X_k * e^{+i*2*pi*k*n/N},  n = 0..N-1.
// (The sign of the exponent flips and, because the forward transform already
// divides by N, the inverse does not.)
//
// For example, X = [6, 1-1.1547i, 1+1.1547i] gives x = [8, 7, 3].
//
// Task
// Implement void NaiveIdft(const complex<double>* X, complex<double>* x, int N)
// which reads N coefficients from X and writes the N recovered samples to x.
// The arrays do not overlap. The forward transform NaiveDft() is provided.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q51 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
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

void NaiveIdft(const complex<double>* X, complex<double>* x, int N);

// ======================= YOUR ANSWER STARTS HERE
// ============================== The normalised DFT turns N complex samples x_n
// into coefficients
//     X_k = (1/N) * sum_{n=0}^{N-1} x_n * e^{-i*2*pi*k*n/N},  k = 0..N-1.
// The inverse transform recovers the samples from the coefficients:
//     x_n = sum_{k=0}^{N-1} X_k * e^{+i*2*pi*k*n/N},  n = 0..N-1.
#ifndef USE_SOLUTIONS
void NaiveIdft(const complex<double>* X, complex<double>* x, int N) {
  for (int n = 0; n < N; ++n) {
    x[n] = 0;
    for (int k = 0; k < N; ++k)
      x[n] += X[k] * exp(
          complex<double>(0.0, 2.0 * M_PI * k * n / static_cast<double>(N)));
  }
}
#else
#include "../solutions/q51.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static void PrintIdft(const complex<double>* X, int N) {
  complex<double> x[16];
  NaiveIdft(X, x, N);
  SanitiseNegativeZero(x, N);
  cout << fixed << setprecision(4);
  for (int n = 0; n < N; ++n) cout << x[n] << endl;
}

void RunQ51() {
  tf::Test("only the DC coefficient gives a constant signal", [] {
    complex<double> X[4] = {2, 0, 0, 0};
    tf::ExpectOutput(
        "(2.0000,0.0000)\n(2.0000,0.0000)\n(2.0000,0.0000)\n(2.0000,0.0000)\n",
        [&] { PrintIdft(X, 4); });
  });

  tf::Test("flat spectrum gives an impulse at n = 0", [] {
    complex<double> X[4] = {0.25, 0.25, 0.25, 0.25};
    tf::ExpectOutput(
        "(1.0000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n",
        [&] { PrintIdft(X, 4); });
  });

  tf::Test("cosine spectrum, N = 8", [] {
    complex<double> X[8] = {0, 0.5, 0, 0, 0, 0, 0, 0.5};
    tf::ExpectOutput(
        "(1.0000,0.0000)\n(0.7071,0.0000)\n(0.0000,0.0000)\n(-0.7071,0.0000)\n"
        "(-1.0000,0.0000)\n(-0.7071,0.0000)\n(0.0000,0.0000)\n(0.7071,0.0000)"
        "\n",
        [&] { PrintIdft(X, 8); });
  });

  tf::HiddenTest("rotating phase gives a delayed impulse", [] {
    complex<double> X[4] = {0.25, complex<double>(0, -0.25), -0.25,
                            complex<double>(0, 0.25)};
    tf::ExpectOutput(
        "(0.0000,0.0000)\n(1.0000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n",
        [&] { PrintIdft(X, 4); });
  });

  tf::HiddenTest("N = 1 and the notes example [8, 7, 3]", [] {
    complex<double> one[1] = {complex<double>(3, -2)};
    complex<double> X[3] = {6, complex<double>(1, -1.1547005383792515),
                            complex<double>(1, 1.1547005383792515)};
    tf::ExpectOutput(
        "(3.0000,-2.0000)\n(8.0000,0.0000)\n(7.0000,0.0000)\n(3.0000,0.0000)\n",
        [&] {
          PrintIdft(one, 1);
          PrintIdft(X, 3);
        });
  });

  tf::HiddenTest(
      "round trip: Idft(Dft(x)) returns x for complex input, N = 5", [] {
        complex<double> x[5] = {complex<double>(1, 2), complex<double>(-3, 0.5),
                                complex<double>(0, -1), complex<double>(4, 4),
                                complex<double>(-2, 3)};
        complex<double> X[5], back[5];
        NaiveDft(x, X, 5);
        NaiveIdft(X, back, 5);
        for (int n = 0; n < 5; ++n) {
          tf::ExpectComplexNear(back[n], x[n], "x[" + to_string(n) + "]");
        }
      });
}

}  // namespace q51

REGISTER_QUESTION(51, "Inverse naive DFT: NaiveIdft()", q51::RunQ51);
