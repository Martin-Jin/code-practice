// ============================================================================
// Question 47  (4 marks)  -  Nth roots of unity: NthRoots()
// Topic: Complex arithmetic in C++
//
// Requirements for Nth roots of unity: NthRoots()
//
// The Nth roots of unity are the N complex numbers W[k] = e^{-i(2*pi*k/N)},
// k = 0..N-1, equally spaced on the unit circle, going clockwise from 1.
// For example, for N = 3 and no rotation:
//   W[0] = (1, 0), W[1] = (-0.5, -0.8660), W[2] = (-0.5, 0.8660).
//
// Task
// Implement void NthRoots(complex<double>* W, int N, double rotation_radians)
// which fills W[0..N-1] with the Nth roots of unity, all rotated clockwise by
// rotation_radians, i.e. W[k] = e^{-i(2*pi*k/N + rotation_radians)}.
// W is an array with room for N elements.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q47 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
void NthRoots(complex<double>* W, int N, double rotation_radians);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void NthRoots(complex<double>* W, int N, double rotation_radians) {
  // Your implementation here
  for (int k = 0; k < N; ++k) W[k] = complex<double>(0.0, 0.0);
}
#else
#include "../solutions/q47.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
static void PrintRoots(int N, double rot) {
  complex<double> W[16];
  NthRoots(W, N, rot);
  SanitiseNegativeZero(W, N);
  cout << fixed << setprecision(4);
  for (int k = 0; k < N; ++k) cout << W[k] << endl;
}

void RunQ47() {
  tf::Test("cube roots of unity (the exam's ThirdRoots)", [] {
    tf::ExpectOutput("(1.0000,0.0000)\n(-0.5000,-0.8660)\n(-0.5000,0.8660)\n",
                     [] { PrintRoots(3, 0.0); });
  });

  tf::Test("fourth roots of unity", [] {
    tf::ExpectOutput("(1.0000,0.0000)\n(0.0000,-1.0000)\n(-1.0000,0.0000)\n(0.0000,1.0000)\n",
                     [] { PrintRoots(4, 0.0); });
  });

  tf::Test("fourth roots rotated clockwise by pi/2", [] {
    tf::ExpectOutput("(0.0000,-1.0000)\n(-1.0000,0.0000)\n(0.0000,1.0000)\n(1.0000,0.0000)\n",
                     [] { PrintRoots(4, M_PI / 2); });
  });

  tf::HiddenTest("eighth roots rotated by pi/4", [] {
    tf::ExpectOutput(
        "(0.7071,-0.7071)\n(0.0000,-1.0000)\n(-0.7071,-0.7071)\n(-1.0000,0.0000)\n"
        "(-0.7071,0.7071)\n(0.0000,1.0000)\n(0.7071,0.7071)\n(1.0000,0.0000)\n",
        [] { PrintRoots(8, M_PI / 4); });
  });

  tf::HiddenTest("single root N = 1 rotated by pi", [] {
    tf::ExpectOutput("(-1.0000,0.0000)\n", [] { PrintRoots(1, M_PI); });
  });

  tf::HiddenTest("roots have unit modulus, sum to zero and W^N is constant", [] {
    const int N = 5;
    const double rot = 0.3;
    complex<double> W[N];
    NthRoots(W, N, rot);
    complex<double> sum(0, 0);
    complex<double> target = polar(1.0, -N * rot);
    for (int k = 0; k < N; ++k) {
      tf::ExpectNear(abs(W[k]), 1.0, "modulus of W[" + to_string(k) + "]");
      tf::ExpectComplexNear(pow(W[k], N), target, "W[" + to_string(k) + "]^N");
      sum += W[k];
    }
    tf::ExpectComplexNear(sum, complex<double>(0, 0), "sum of roots");
  });
}

}  // namespace q47

REGISTER_QUESTION(47, "Nth roots of unity: NthRoots()", q47::RunQ47);
