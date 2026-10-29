// ============================================================================
// Question 8  (4 marks)  -  Strings: IsPalindrome()
// Topic: Strings
//
// Requirements for Strings: IsPalindrome()
//
// Task
// Implement `bool IsPalindrome(const string& text)`. It returns true if the
// letters of `text` read the same forwards and backwards. Ignore upper or lower
// case, and ignore every character that is not a letter (spaces, digits and
// punctuation). A string with no letters counts as a palindrome.
//
// Note: there are three visible test cases and two hidden test cases.
// ============================================================================
#include <cctype>
#include <string>

#include "framework/test_framework.h"

namespace q08 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
bool IsPalindrome(const string& text);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
bool IsPalindrome(const string& text) {
  // Your implementation here
  return false;
}
#else
#include "../solutions/q08.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ08() {
  tf::Test("a simple palindrome", [] {
    tf::ExpectEq(IsPalindrome("level"), true, "IsPalindrome(\"level\")");
  });

  tf::Test("not a palindrome", [] {
    tf::ExpectEq(IsPalindrome("hello"), false, "IsPalindrome(\"hello\")");
  });

  tf::Test("case is ignored", [] {
    tf::ExpectEq(IsPalindrome("Racecar"), true, "IsPalindrome(\"Racecar\")");
  });

  tf::HiddenTest("spaces and punctuation are ignored", [] {
    tf::ExpectEq(IsPalindrome("A man, a plan, a canal: Panama!"), true,
                 "IsPalindrome(\"A man, a plan, a canal: Panama!\")");
    tf::ExpectEq(IsPalindrome("Not a palindrome."), false,
                 "IsPalindrome(\"Not a palindrome.\")");
  });

  tf::HiddenTest("empty, no letters and a single letter", [] {
    tf::ExpectEq(IsPalindrome(""), true, "IsPalindrome(\"\")");
    tf::ExpectEq(IsPalindrome("123 !?"), true, "IsPalindrome(\"123 !?\")");
    tf::ExpectEq(IsPalindrome("x"), true, "IsPalindrome(\"x\")");
  });
}

}  // namespace q08

REGISTER_QUESTION(8, "Strings: IsPalindrome()", q08::RunQ08);
