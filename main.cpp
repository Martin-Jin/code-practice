// ============================================================================
//  MECHENG270 practice questions - test runner
//
//  Change kQuestion to pick which question to test:
//      1..86  -> run just that question
//      0      -> run every question (summary at the end)
//
//  Then build & run (see README.md). Each question lives in
//  questions/qNN_*.cpp - write your answer between the
//  "YOUR ANSWER STARTS HERE / ENDS HERE" markers in that file.
// ============================================================================
#include "framework/test_framework.h"

constexpr int kQuestion = 5;

int main() { return tf::RunQuestion(kQuestion); }
    