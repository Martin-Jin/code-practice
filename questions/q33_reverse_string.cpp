// ============================================================================
// Question 33  (3 marks)  -  Recursion: ReverseString()
// Topic: Recursion
//
// Requirements for Recursion: ReverseString()
//
// Task
// Write a recursive function `string ReverseString(const string& s)` that
// returns the characters of s in reverse order. For example "stack" becomes
// "kcats". The empty string reverses to the empty string.
// Your function must be recursive; loops and std::reverse are not allowed.
// Hint: reverse(s) = reverse(everything after the first character) + first char.
//
// Note: there are four visible test cases and two hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q33 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
string ReverseString(const string& s);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
string ReverseString(const string& s) {
  // Your implementation here
  return "";
}
#else
#include "../solutions/q33.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ33() {
  tf::Test("empty string", [] { tf::ExpectEq(ReverseString(""), "", "ReverseString(\"\")"); });
  tf::Test("single character", [] { tf::ExpectEq(ReverseString("a"), "a", "ReverseString(\"a\")"); });
  tf::Test("word", [] { tf::ExpectEq(ReverseString("stack"), "kcats", "ReverseString(\"stack\")"); });
  tf::Test("even length", [] { tf::ExpectEq(ReverseString("abcd"), "dcba", "ReverseString(\"abcd\")"); });

  tf::HiddenTest("palindrome is unchanged", [] {
    tf::ExpectEq(ReverseString("racecar"), "racecar", "ReverseString(\"racecar\")");
  });

  tf::HiddenTest("spaces, digits and punctuation", [] {
    tf::ExpectEq(ReverseString("Hello, World 42!"), "!24 dlroW ,olleH", "mixed characters");
    tf::ExpectEq(ReverseString("  ab"), "ba  ", "leading spaces");
  });
}

}  // namespace q33

REGISTER_QUESTION(33, "Recursion: ReverseString()", q33::RunQ33);
