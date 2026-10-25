// Tiny CodeRunner-style test framework used by every question file.
// You do not need to edit this file.
#pragma once

#ifndef _USE_MATH_DEFINES
#define _USE_MATH_DEFINES  // makes M_PI available on every compiler
#endif

#include <cmath>
#include <complex>
#include <functional>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

namespace tf {

// ---- registry: each question file registers itself with REGISTER_QUESTION ----
struct Question {
  int number;
  const char* title;
  void (*run)();
};
std::vector<Question>& Registry();

struct Registrar {
  Registrar(int number, const char* title, void (*run)());
};

// Runs one question (number > 0) or all of them (number == 0).
// Returns 0 if every test passed, 1 otherwise.
int RunQuestion(int number);

// ---- running tests ----
// Runs `body` as one named test case. Exceptions thrown by your code fail it.
// Use hidden=true for the "hidden test case" flavour (only changes the label).
void Test(const std::string& name, const std::function<void()>& body, bool hidden = false);
void HiddenTest(const std::string& name, const std::function<void()>& body);

// Marks the current test as failed with a message (usually called via Expect*).
void Fail(const std::string& message);

// Same, plus the pieces of a comparison (kind is "value" or "output"). The web app reads
// them (see TF_EVENTS_STDERR in test_framework.cpp) to draw a diff; the console output is
// the same either way.
void Fail(const std::string& message, const char* kind, const std::string& what,
          const std::string& expected, const std::string& actual);

// Runs `body`, captures everything it prints to std::cout, and compares it to
// `expected` the way CodeRunner does (trailing whitespace on each line and at
// the end of the output is ignored).
void ExpectOutput(const std::string& expected, const std::function<void()>& body);

// Runs `body` and returns what it printed to std::cout (nothing is shown).
std::string Capture(const std::function<void()>& body);

// ---- value expectations ----
template <typename T>
std::string Str(const T& v) {
  std::ostringstream os;
  os << std::boolalpha << v;
  return os.str();
}

template <typename A, typename B>
void ExpectEq(const A& actual, const B& expected, const std::string& what = "value") {
  if (!(actual == expected)) {
    Fail(what + ": expected " + Str(expected) + " but got " + Str(actual), "value", what,
         Str(expected), Str(actual));
  }
}

void ExpectTrue(bool condition, const std::string& what);
void ExpectNear(double actual, double expected, const std::string& what = "value",
                double tol = 1e-4);
void ExpectComplexNear(std::complex<double> actual, std::complex<double> expected,
                       const std::string& what = "value", double tol = 1e-4);

// Prints a vector like "[1, 2, 3]" - handy for ExpectEq on vectors.
template <typename T>
std::string VecStr(const std::vector<T>& v) {
  std::ostringstream os;
  os << "[";
  for (size_t i = 0; i < v.size(); ++i) os << (i ? ", " : "") << v[i];
  os << "]";
  return os.str();
}

}  // namespace tf

// Utility provided by the course exams: turns "-0.0000" into "0.0000" when printing.
inline void SanitiseNegativeZero(std::complex<double>* v, int n) {
  for (int i = 0; i < n; ++i) {
    double re = v[i].real(), im = v[i].imag();
    if (std::fabs(re) < 5e-5) re = 0.0;
    if (std::fabs(im) < 5e-5) im = 0.0;
    v[i] = std::complex<double>(re, im);
  }
}

#define TF_CONCAT2(a, b) a##b
#define TF_CONCAT(a, b) TF_CONCAT2(a, b)
// Put at the bottom of a question file: REGISTER_QUESTION(1, "Title", RunQ01);
#define REGISTER_QUESTION(num, title, fn) \
  static ::tf::Registrar TF_CONCAT(tf_registrar_, num)(num, title, fn)
