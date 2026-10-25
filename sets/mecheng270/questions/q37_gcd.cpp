// ============================================================================
// Question 37  (4 marks)  -  Recursion: Gcd()
// Topic: Recursion & algorithms
//
// Requirements for Recursion: Gcd()
//
// The following algorithm is written in Knuth style.
//
//   Algorithm G (GCD). Given non-negative integers m and n, return their
//   greatest common divisor.
//   G1. [Order]      If n > m, swap m and n.
//   G2. [Terminate?] If n = 0, return m.
//   G3. [Remainder]  r <- m mod n, m <- n, n <- r, goto G2.
//
// Task
// Implement the function int Gcd(int m, int n) so that it follows Algorithm G
// but uses RECURSION instead of a loop (no for/while/do loops allowed).
//   - It must cope with n > m (the arguments arrive in either order).
//   - Gcd(m, 0) is m, and Gcd(0, n) is n.
//   - Gcd(0, 0) is 0.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q37 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int Gcd(int m, int n);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int Gcd(int m, int n) {
  // Your implementation here
  return -1;
}
#else
#include "../solutions/q37.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ37() {
  tf::Test("Gcd(48, 18)", [] {
    tf::ExpectOutput("6\n", [] { cout << Gcd(48, 18) << endl; });
  });

  tf::Test("Gcd(18, 48): n larger than m", [] {
    tf::ExpectOutput("6\n", [] { cout << Gcd(18, 48) << endl; });
  });

  tf::Test("Gcd(7, 0): n is zero", [] {
    tf::ExpectOutput("7\n", [] { cout << Gcd(7, 0) << endl; });
  });

  tf::Test("coprime numbers", [] {
    tf::ExpectOutput("1\n1\n", [] {
      cout << Gcd(17, 13) << endl;
      cout << Gcd(13, 17) << endl;
    });
  });

  tf::HiddenTest("Gcd(0, 7) and Gcd(0, 0)", [] {
    tf::ExpectOutput("7\n0\n", [] {
      cout << Gcd(0, 7) << endl;
      cout << Gcd(0, 0) << endl;
    });
  });

  tf::HiddenTest("equal arguments and divisibility", [] {
    tf::ExpectOutput("100\n5\n5\n", [] {
      cout << Gcd(100, 100) << endl;
      cout << Gcd(25, 5) << endl;
      cout << Gcd(5, 25) << endl;
    });
  });

  tf::HiddenTest("larger values (1071, 462) and (1, 1000000)", [] {
    tf::ExpectOutput("21\n1\n", [] {
      cout << Gcd(1071, 462) << endl;
      cout << Gcd(1, 1000000) << endl;
    });
  });
}

}  // namespace q37

REGISTER_QUESTION(37, "Recursion: Gcd()", q37::RunQ37);
