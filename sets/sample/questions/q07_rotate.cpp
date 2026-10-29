// ============================================================================
// Question 7  (4 marks)  -  Complex numbers: Rotate()
// Topic: Complex numbers
//
// Requirements for Complex numbers: Rotate()
//
// Task
// Implement `complex<double> Rotate(complex<double> z, double angle)`. It
// returns z rotated anticlockwise about the origin by `angle` radians. Hint:
// multiplying by a complex number of magnitude 1 and phase `angle` rotates z.
//
// Note: there are three visible test cases and two hidden test cases.
// ============================================================================
#include <cmath>
#include <complex>

#include "framework/test_framework.h"

namespace q07 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
complex<double> Rotate(complex<double> z, double angle);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
complex<double> Rotate(complex<double> z, double angle) {
  // Your implementation here
  return complex<double>(0.0, 0.0);
}
#else
#include "../solutions/q07.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
constexpr double kPi = 3.14159265358979323846;

void RunQ07() {
  tf::Test("1 rotated by a quarter turn is i", [] {
    tf::ExpectComplexNear(Rotate({1.0, 0.0}, kPi / 2), {0.0, 1.0},
                          "Rotate(1, pi/2)", 1e-9);
  });

  tf::Test("1 + i rotated by a half turn", [] {
    tf::ExpectComplexNear(Rotate({1.0, 1.0}, kPi), {-1.0, -1.0},
                          "Rotate(1 + i, pi)", 1e-9);
  });

  tf::Test("rotation by 0 changes nothing", [] {
    tf::ExpectComplexNear(Rotate({3.0, -2.0}, 0.0), {3.0, -2.0},
                          "Rotate(3 - 2i, 0)", 1e-9);
  });

  tf::HiddenTest("clockwise quarter turn", [] {
    tf::ExpectComplexNear(Rotate({0.0, 2.0}, -kPi / 2), {2.0, 0.0},
                          "Rotate(2i, -pi/2)", 1e-9);
  });

  tf::HiddenTest("rotation by 45 degrees", [] {
    const double r = std::sqrt(2.0) / 2.0;
    tf::ExpectComplexNear(Rotate({1.0, 0.0}, kPi / 4), {r, r},
                          "Rotate(1, pi/4)", 1e-9);
  });
}

}  // namespace q07

REGISTER_QUESTION(7, "Complex numbers: Rotate()", q07::RunQ07);
