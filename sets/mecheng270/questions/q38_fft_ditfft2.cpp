// ============================================================================
// Question 38  (8 marks)  -  Fast Fourier transform: ditfft2()
// Topic: Complex arithmetic & FFT
// Restrict: recursive
//
// Requirements for Fast Fourier transform: ditfft2()
//
// You have been provided with a naive O(N^2) DFT (Dft) and an fft() wrapper
// that calls your function and then divides every output by N, so that fft()
// and Dft() give identical (normalised) results. N is always a power of two.
//
// The (unnormalised) radix-2 decimation-in-time FFT is, in pseudocode:
//
//   X[0..N-1] <- ditfft2(x, N, s):
//     if N = 1 then
//       X[0] <- x[0]
//     else
//       X[0..N/2-1] <- ditfft2(x,   N/2, 2s)    // even samples
//       X[N/2..N-1] <- ditfft2(x+s, N/2, 2s)    // odd samples
//       for k = 0 to N/2-1 do
//         p <- X[k]
//         q <- exp(-i*2*pi*k/N) * X[k+N/2]
//         X[k]     <- p + q
//         X[k+N/2] <- p - q
//       end for
//     end if
//
// Task
// Implement
//   void ditfft2(const complex<double>* x, complex<double>* X, int N, int s)
// so that it follows the pseudocode: x is read with stride s (elements x[0],
// x[s], x[2s], ...), N values are written contiguously to X, and the result is
// NOT divided by N. The function must be recursive.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q38 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
typedef complex<double> cd;

// Naive normalised DFT: X[k] = (1/N) * sum_n x[n] * exp(-i*2*pi*k*n/N).
void Dft(const vector<cd>& x, vector<cd>& X) {
  int N = x.size();
  X.assign(N, cd(0, 0));
  for (int k = 0; k < N; ++k) {
    for (int n = 0; n < N; ++n) {
      X[k] += x[n] * polar(1.0, -2.0 * M_PI * k * n / N);
    }
    X[k] /= N;
  }
}

void ditfft2(const complex<double>* x, complex<double>* X, int N, int s);

// Normalised FFT built on ditfft2.
void Fft(const vector<cd>& x, vector<cd>& X) {
  int N = x.size();
  X.assign(N, cd(0, 0));
  ditfft2(x.data(), X.data(), N, 1);
  for (int k = 0; k < N; ++k) X[k] /= N;
}

// Prints each bin as "X[k] = (re,im)" with 4 decimals.
void PrintSpectrum(vector<cd> X) {
  SanitiseNegativeZero(X.data(), static_cast<int>(X.size()));
  ios_base::fmtflags old = cout.flags();
  streamsize old_prec = cout.precision();
  cout << fixed << setprecision(4);
  for (size_t k = 0; k < X.size(); ++k) cout << "X[" << k << "] = " << X[k] << endl;
  cout.flags(old);
  cout.precision(old_prec);
}

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void ditfft2(const complex<double>* x, complex<double>* X, int N, int s) {
  // Your implementation here
}
#else
#include "../solutions/q38.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
namespace {
vector<cd> Ramp(int N) {
  vector<cd> x(N);
  for (int n = 0; n < N; ++n) x[n] = cd(n + 1, 0);
  return x;
}

vector<cd> Mixed(int N) {  // deterministic complex data
  vector<cd> x(N);
  for (int n = 0; n < N; ++n) x[n] = cd(((n * 7) % 5) - 2, ((n * 3) % 4) - 1.5);
  return x;
}

void CompareToDft(const vector<cd>& x) {
  vector<cd> got, want;
  Fft(x, got);
  Dft(x, want);
  for (size_t k = 0; k < x.size(); ++k) {
    tf::ExpectComplexNear(got[k], want[k], "N=" + to_string(x.size()) + " bin " + to_string(k), 1e-9);
  }
}
}  // namespace

void RunQ38() {
  tf::Test("N=1 and N=2", [] {
    CompareToDft({cd(5, 0)});
    CompareToDft({cd(1, 0), cd(3, 0)});
    tf::ExpectOutput("X[0] = (2.0000,0.0000)\nX[1] = (-1.0000,0.0000)\n", [] {
      vector<cd> X;
      Fft({cd(1, 0), cd(3, 0)}, X);
      PrintSpectrum(X);
    });
  });

  tf::Test("N=4 ramp [1,2,3,4] printed", [] {
    tf::ExpectOutput(
        "X[0] = (2.5000,0.0000)\n"
        "X[1] = (-0.5000,0.5000)\n"
        "X[2] = (-0.5000,0.0000)\n"
        "X[3] = (-0.5000,-0.5000)\n",
        [] {
          vector<cd> X;
          Fft(Ramp(4), X);
          PrintSpectrum(X);
        });
  });

  tf::Test("N=8 matches the naive DFT", [] {
    CompareToDft(Ramp(8));
    CompareToDft(Mixed(8));
  });

  tf::HiddenTest("N=16 matches the naive DFT", [] {
    CompareToDft(Ramp(16));
    CompareToDft(Mixed(16));
  });

  tf::HiddenTest("N=8 unit impulse is flat", [] {
    vector<cd> x(8, cd(0, 0));
    x[0] = cd(1, 0);
    tf::ExpectOutput(
        "X[0] = (0.1250,0.0000)\nX[1] = (0.1250,0.0000)\nX[2] = (0.1250,0.0000)\n"
        "X[3] = (0.1250,0.0000)\nX[4] = (0.1250,0.0000)\nX[5] = (0.1250,0.0000)\n"
        "X[6] = (0.1250,0.0000)\nX[7] = (0.1250,0.0000)\n",
        [&] {
          vector<cd> X;
          Fft(x, X);
          PrintSpectrum(X);
        });
  });

  tf::HiddenTest("N=8 cosine has energy in bins 1 and 7 only", [] {
    vector<cd> x(8);
    for (int n = 0; n < 8; ++n) x[n] = cd(cos(2.0 * M_PI * n / 8.0), 0);
    tf::ExpectOutput(
        "X[0] = (0.0000,0.0000)\nX[1] = (0.5000,0.0000)\nX[2] = (0.0000,0.0000)\n"
        "X[3] = (0.0000,0.0000)\nX[4] = (0.0000,0.0000)\nX[5] = (0.0000,0.0000)\n"
        "X[6] = (0.0000,0.0000)\nX[7] = (0.5000,0.0000)\n",
        [&] {
          vector<cd> X;
          Fft(x, X);
          PrintSpectrum(X);
        });
  });
}

}  // namespace q38

REGISTER_QUESTION(38, "Fast Fourier transform: ditfft2()", q38::RunQ38);
