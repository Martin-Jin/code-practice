// ============================================================================
// Question 48  (4 marks)  -  A single DFT coefficient: DftBin()
// Topic: Fourier transform and DFT
//
// Requirements for A single DFT coefficient: DftBin()
//
// The normalised discrete Fourier transform of N samples x_0..x_{N-1} has
// coefficients
//     X_k = (1/N) * sum_{n=0}^{N-1} x_n * e^{-i*2*pi*k*n/N}.
// For example, x = [8, 7, 3] gives X_0 = 6 (the mean) and
// X_1 = 1.0000 - 1.1547i.
//
// Task
// Implement complex<double> DftBin(const vector<double>& x, int k), returning
// the single coefficient X_k for the real signal x. For an empty signal return
// 0. (k may be any integer >= 0, also larger than N - 1.)
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q48 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
complex<double> DftBin(const vector<double>& x, int k);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
complex<double> DftBin(const vector<double>& x, int k) {
  // Your implementation here
  return complex<double>(0.0, 0.0);
}
#else
#include "../solutions/q48.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
static void PrintBin(const vector<double>& x, int k) {
  complex<double> v = DftBin(x, k);
  SanitiseNegativeZero(&v, 1);
  cout << fixed << setprecision(4) << v << endl;
}

void RunQ48() {
  tf::Test("X_0 is the mean", [] {
    tf::ExpectOutput("(6.0000,0.0000)\n", [] { PrintBin({8, 7, 3}, 0); });
  });

  tf::Test("X_1 of [8, 7, 3]", [] {
    tf::ExpectOutput("(1.0000,-1.1547)\n", [] { PrintBin({8, 7, 3}, 1); });
  });

  tf::Test("X_2 of [8, 7, 3] is the conjugate of X_1", [] {
    tf::ExpectOutput("(1.0000,1.1547)\n", [] { PrintBin({8, 7, 3}, 2); });
  });

  tf::HiddenTest("cosine signal, N = 8", [] {
    vector<double> x;
    for (int n = 0; n < 8; ++n) x.push_back(cos(2.0 * M_PI * n / 8));
    tf::ExpectOutput("(0.5000,0.0000)\n(0.0000,0.0000)\n(0.5000,0.0000)\n", [&] {
      PrintBin(x, 1);
      PrintBin(x, 3);
      PrintBin(x, 7);
    });
  });

  tf::HiddenTest("single sample and empty signal", [] {
    tf::ExpectOutput("(5.0000,0.0000)\n(0.0000,0.0000)\n", [] {
      PrintBin({5}, 0);
      PrintBin({}, 0);
    });
  });

  tf::HiddenTest("k beyond N - 1 wraps around", [] {
    vector<double> x = {1, 2, 3, 4};
    tf::ExpectComplexNear(DftBin(x, 5), complex<double>(-0.5, 0.5), "X_5 (= X_1)");
    tf::ExpectComplexNear(DftBin(x, 2), complex<double>(-0.5, 0.0), "X_2");
    tf::ExpectComplexNear(DftBin(x, 3), complex<double>(-0.5, -0.5), "X_3");
  });
}

}  // namespace q48

REGISTER_QUESTION(48, "A single DFT coefficient: DftBin()", q48::RunQ48);
