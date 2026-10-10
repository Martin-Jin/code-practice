// ============================================================================
// Question 35  (4 marks)  -  Recursion: fix IsPalindrome()
// Topic: Recursion
//
// Requirements for Recursion: fix IsPalindrome()
//
// You have been provided with a recursive function
// `bool IsPalindrome(const string& s, int lo, int hi)` that should return true
// if the characters of s from index lo to index hi (both inclusive) read the
// same forwards and backwards. It is called as
// IsPalindrome(s, 0, (int)s.size() - 1). The empty string and single characters
// are palindromes; comparison is case-sensitive.
//
// Task
// The code terminates but gives WRONG ANSWERS for some inputs because of two bugs
// (one in the base case, one in the comparison). Find and fix them. Keep the
// function recursive.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q35 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
bool IsPalindrome(const string& s, int lo, int hi);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
bool IsPalindrome(const string& s, int lo, int hi) {
  if (lo >= hi - 1) {
    return true;
  }
  if (s[lo] != s[hi - 1]) {
    return false;
  }
  return IsPalindrome(s, lo + 1, hi - 1);
}
#else
#include "../solutions/q35.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
static bool Check(const string& s) { return IsPalindrome(s, 0, static_cast<int>(s.size()) - 1); }

void RunQ35() {
  tf::Test("odd-length palindrome", [] { tf::ExpectEq(Check("racecar"), true, "racecar"); });
  tf::Test("even-length palindrome", [] { tf::ExpectEq(Check("abba"), true, "abba"); });
  tf::Test("not a palindrome", [] { tf::ExpectEq(Check("hello"), false, "hello"); });
  tf::Test("empty and single character", [] {
    tf::ExpectEq(Check(""), true, "empty string");
    tf::ExpectEq(Check("x"), true, "x");
  });

  tf::HiddenTest("two characters", [] {
    tf::ExpectEq(Check("aa"), true, "aa");
    tf::ExpectEq(Check("ab"), false, "ab");
  });

  tf::HiddenTest("only the middle pair differs", [] {
    tf::ExpectEq(Check("abca"), false, "abca");
    tf::ExpectEq(Check("xyzzy"), false, "xyzzy");
    tf::ExpectEq(Check("abccba"), true, "abccba");
  });

  tf::HiddenTest("case-sensitive and longer strings", [] {
    tf::ExpectEq(Check("Aba"), false, "Aba");
    tf::ExpectEq(Check("madamimadam"), true, "madamimadam");
    tf::ExpectEq(Check("abcdefgfedcbX"), false, "abcdefgfedcbX");
    tf::ExpectEq(Check("1221"), true, "1221");
  });
}

}  // namespace q35

REGISTER_QUESTION(35, "Recursion: fix IsPalindrome()", q35::RunQ35);
