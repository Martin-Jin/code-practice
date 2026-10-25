// ============================================================================
// Question 49  (5 marks)  -  Naive DFT: NaiveDft()
// Topic: Fourier transform and DFT
//
// Requirements for Naive DFT: NaiveDft()
//
// The normalised DFT of N complex samples x_n is
//     X_k = (1/N) * sum_{n=0}^{N-1} x_n * e^{-i*2*pi*k*n/N},  k = 0..N-1.
// Computing every coefficient directly takes O(N^2) operations.
//
// Task
// Implement void NaiveDft(const complex<double>* x, complex<double>* X, int N)
// which reads N samples from x and writes the N normalised DFT coefficients to
// X. The arrays do not overlap.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q49 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
void NaiveDft(const complex<double>* x, complex<double>* X, int N);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void NaiveDft(const complex<double>* x, complex<double>* X, int N) {
  // Your implementation here
  for (int k = 0; k < N; ++k) X[k] = complex<double>(0.0, 0.0);
}
#else
#include "../solutions/q49.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
static void PrintDft(const complex<double>* x, int N) {
  complex<double> X[16];
  NaiveDft(x, X, N);
  SanitiseNegativeZero(X, N);
  cout << fixed << setprecision(4);
  for (int k = 0; k < N; ++k) cout << X[k] << endl;
}

void RunQ49() {
  tf::Test("cosine signal, N = 8", [] {
    complex<double> x[8];
    for (int n = 0; n < 8; ++n) x[n] = cos(2.0 * M_PI * n / 8);
    tf::ExpectOutput(
        "(0.0000,0.0000)\n(0.5000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n"
        "(0.0000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n(0.5000,0.0000)\n",
        [&] { PrintDft(x, 8); });
  });

  tf::Test("constant signal", [] {
    complex<double> x[4] = {2, 2, 2, 2};
    tf::ExpectOutput("(2.0000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n(0.0000,0.0000)\n",
                     [&] { PrintDft(x, 4); });
  });

  tf::Test("impulse at n = 0", [] {
    complex<double> x[4] = {1, 0, 0, 0};
    tf::ExpectOutput("(0.2500,0.0000)\n(0.2500,0.0000)\n(0.2500,0.0000)\n(0.2500,0.0000)\n",
                     [&] { PrintDft(x, 4); });
  });

  tf::HiddenTest("delayed impulse gives a rotating phase", [] {
    complex<double> x[4] = {0, 1, 0, 0};
    tf::ExpectOutput("(0.2500,0.0000)\n(0.0000,-0.2500)\n(-0.2500,0.0000)\n(0.0000,0.2500)\n",
                     [&] { PrintDft(x, 4); });
  });

  tf::HiddenTest("complex input, N = 2", [] {
    complex<double> x[2] = {complex<double>(1, 0), complex<double>(0, 1)};
    tf::ExpectOutput("(0.5000,0.5000)\n(0.5000,-0.5000)\n", [&] { PrintDft(x, 2); });
  });

  tf::HiddenTest("N = 1 and the notes example [8, 7, 3]", [] {
    complex<double> one[1] = {complex<double>(3, -2)};
    complex<double> x[3] = {8, 7, 3};
    tf::ExpectOutput(
        "(3.0000,-2.0000)\n(6.0000,0.0000)\n(1.0000,-1.1547)\n(1.0000,1.1547)\n", [&] {
          PrintDft(one, 1);
          PrintDft(x, 3);
        });
  });
}

}  // namespace q49

REGISTER_QUESTION(49, "Naive DFT: NaiveDft()", q49::RunQ49);
