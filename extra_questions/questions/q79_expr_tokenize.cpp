// ============================================================================
// Question 79  (4 marks)  -  Expression trees: Tokenize()
// Topic: Expression trees
//
// Requirements for Expression trees: Tokenize()
//
// Before an infix expression can be converted to postfix it has to be split
// into tokens. People do not always put spaces between them: x*(y+2)-12.5/y is
// a perfectly good expression.
//
// Task
// Implement vector<string> Tokenize(const string& text). Split the text into
// tokens, in order, ignoring spaces (and any other whitespace):
//   - numbers: a run of digits and '.' characters, e.g. 12, 12.5, 0.25
//   - identifiers: a letter or '_' followed by any letters, digits or '_'
//     characters, e.g. x, rate_2
//   - operators + - * / ^ and brackets ( ) : one token per character
// You do NOT need to handle unary minus: a '-' is always a one-character
// operator token. The input contains only the characters listed above. An
// empty or all-space string gives an empty vector.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include <cctype>

#include "../../framework/test_framework.h"

namespace q79 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
vector<string> Tokenize(const string& text);

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
vector<string> Tokenize(const string& text) {
  // TODO: scan the text with an index, grouping digits and identifiers.
  return vector<string>();
}
#else
#include "../solutions/q79.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static void Check(const string& text, const vector<string>& expected) {
  tf::ExpectEq(tf::VecStr(Tokenize(text)), tf::VecStr(expected), "tokens");
}

void RunQ79() {
  tf::Test("no spaces: x*(y+2)-12.5/y", [] {
    Check("x*(y+2)-12.5/y",
          {"x", "*", "(", "y", "+", "2", ")", "-", "12.5", "/", "y"});
  });

  tf::Test("spaced: ( 3 + 5 ) * ( 10 - 2 )", [] {
    Check("( 3 + 5 ) * ( 10 - 2 )",
          {"(", "3", "+", "5", ")", "*", "(", "10", "-", "2", ")"});
  });

  tf::Test("multi-digit numbers", [] {
    Check("123*4567", {"123", "*", "4567"});
  });

  tf::HiddenTest("empty and all-space strings", [] {
    Check("", {});
    Check("    ", {});
  });

  tf::HiddenTest("identifiers with digits and underscores", [] {
    Check("foo_1+bar2", {"foo_1", "+", "bar2"});
    Check("_t^2", {"_t", "^", "2"});
  });

  tf::HiddenTest("irregular spacing and a lone token", [] {
    Check("  2 ^3^  2 ", {"2", "^", "3", "^", "2"});
    Check("  speed ", {"speed"});
    Check("0.25 -x", {"0.25", "-", "x"});
  });
}

}  // namespace q79

REGISTER_QUESTION(79, "Expression trees: Tokenize()", q79::RunQ79);
