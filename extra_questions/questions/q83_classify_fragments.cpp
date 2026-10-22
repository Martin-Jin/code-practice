// ============================================================================
// Question 83  (5 marks)  -  Big O of code fragments
// Topic: Big O and source analysis
//
// Requirements for ClassifyFragment()
//
// Eight code fragments are shown below. N is the size of the input, data[] is
// an array of N ints, and BinarySearch(data, N, key) is the standard binary
// search from the course (O(log N)). All loop bodies not shown are O(1).
//
//   Fragment 1:                        Fragment 2:
//     x = a * b + 7;                     for (i = 0; i < N; ++i)
//     y = x - 3;                           sum += data[i];
//     z = x * y;
//
//   Fragment 3:                        Fragment 4:
//     for (i = 0; i < N; ++i)            for (i = 0; i < N; ++i)
//       sum += data[i];                    for (j = 0; j < N; ++j)
//     for (j = 0; j < N; ++j)                ++count;
//       prod *= data[j];
//
//   Fragment 5:                        Fragment 6:
//     for (i = N; i >= 1; i /= 2)        if (calibrated) {
//       ++count;                           result = gain * data[0];
//                                        } else {
//                                          result = 0;
//                                          for (i = 0; i < N; ++i)
//                                            result += data[i];
//                                        }
//
//   Fragment 7:                        Fragment 8:
//     for (i = 0; i < N; ++i)            x = 0;
//       BinarySearch(data, N, i);        for (i = 0; i < N; ++i)
//                                          for (j = 0; j < N; ++j)
//                                            ++x;
//                                        for (k = 0; k < N; ++k)
//                                          ++x;
//
// Task
// Implement string ClassifyFragment(int id). For id 1..8 it returns the
// tightest Big O class of that fragment as exactly one of these strings:
//   "O(1)", "O(log N)", "O(N)", "O(N log N)", "O(N^2)"
// For any other id return "unknown".
//
// Note: there are four visible test cases and four hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q83 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
string ClassifyFragment(int id);

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
string ClassifyFragment(int id) {
  // TODO: return the Big O class of fragment `id`
  return "unknown";
}
#else
#include "../solutions/q83.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static void Check(int id, const string& expected) {
  tf::ExpectEq(ClassifyFragment(id), expected, "fragment " + to_string(id));
}

void RunQ83() {
  tf::Test("fragment 1 (fixed statements)", [] { Check(1, "O(1)"); });
  tf::Test("fragment 2 (single loop)", [] { Check(2, "O(N)"); });
  tf::Test("fragment 3 (two loops in sequence)", [] { Check(3, "O(N)"); });
  tf::Test("fragment 4 (nested loops)", [] { Check(4, "O(N^2)"); });

  tf::HiddenTest("fragment 5 (halving loop)", [] { Check(5, "O(log N)"); });
  tf::HiddenTest("fragment 6 (if/else, larger branch)", [] { Check(6, "O(N)"); });
  tf::HiddenTest("fragment 7 (N binary searches)", [] { Check(7, "O(N log N)"); });
  tf::HiddenTest("fragment 8 (nested loops then a loop)", [] { Check(8, "O(N^2)"); });
}

}  // namespace q83

REGISTER_QUESTION(83, "Big O of code fragments", q83::RunQ83);
