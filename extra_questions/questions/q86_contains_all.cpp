// ============================================================================
// Question 86  (5 marks)  -  Many lookups with binary search
// Topic: Big O and source analysis
//
// Requirements for ContainsAll()
//
// A linear scan per lookup costs O(N), so M lookups cost O(M*N). If the data
// is sorted, binary search finds each item in O(log N), giving O(M log N).
//
// Task
// Implement bool ContainsAll(const vector<int>& sortedHaystack,
//                            const vector<int>& needles).
// sortedHaystack is sorted in increasing order (no duplicates). Return true if
// EVERY value in needles is present in sortedHaystack, otherwise false.
// An empty needles vector gives true. The total cost must be O(M log N) where
// N is the haystack size and M the number of needles.
// Write the binary search yourself: do not use std::binary_search, std::find,
// std::lower_bound or any other library search.
//
// Note: there are four visible test cases and three hidden test cases. The
// hidden tests include a speed test with N = 1,000,000 and M = 200,000.
// ============================================================================
#include <chrono>

#include "../../framework/test_framework.h"

namespace q86 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
bool ContainsAll(const vector<int>& sortedHaystack, const vector<int>& needles);

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
bool ContainsAll(const vector<int>& sortedHaystack, const vector<int>& needles) {
  // TODO: binary search for each needle
  return false;
}
#else
#include "../solutions/q86.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ86() {
  tf::Test("all needles present", [] {
    tf::ExpectEq(ContainsAll({1, 3, 5, 7, 9, 11}, {9, 1, 5}), true, "{9,1,5}");
  });
  tf::Test("one needle missing", [] {
    tf::ExpectEq(ContainsAll({1, 3, 5, 7, 9, 11}, {3, 4, 5}), false, "{3,4,5}");
  });
  tf::Test("empty needles", [] {
    tf::ExpectEq(ContainsAll({1, 2, 3}, {}), true, "empty needles");
    tf::ExpectEq(ContainsAll({}, {}), true, "both empty");
  });
  tf::Test("first and last elements", [] {
    tf::ExpectEq(ContainsAll({2, 4, 6, 8}, {2, 8}), true, "{2,8}");
    tf::ExpectEq(ContainsAll({2, 4, 6, 8}, {1}), false, "{1}");
    tf::ExpectEq(ContainsAll({2, 4, 6, 8}, {9}), false, "{9}");
  });

  tf::HiddenTest("empty haystack, non-empty needles", [] {
    tf::ExpectEq(ContainsAll({}, {1}), false, "empty haystack");
  });
  tf::HiddenTest("single-element haystack", [] {
    tf::ExpectEq(ContainsAll({5}, {5, 5}), true, "{5,5}");
    tf::ExpectEq(ContainsAll({5}, {4}), false, "{4}");
  });
  tf::HiddenTest("speed: N = 1,000,000, M = 200,000", [] {
    vector<int> hay(1000000);
    for (int i = 0; i < 1000000; ++i) hay[i] = 2 * i;
    vector<int> needles(200000);
    for (int j = 0; j < 200000; ++j) {
      needles[j] = 2 * (int)((long long)j * 7919 % 1000000);
    }
    auto t0 = chrono::steady_clock::now();
    bool all_present = ContainsAll(hay, needles);
    double secs1 = chrono::duration<double>(chrono::steady_clock::now() - t0).count();
    tf::ExpectEq(all_present, true, "all needles present");
    needles.push_back(1);  // odd, so never in the haystack (checked last)
    t0 = chrono::steady_clock::now();
    bool missing = ContainsAll(hay, needles);
    double secs2 = chrono::duration<double>(chrono::steady_clock::now() - t0).count();
    tf::ExpectEq(missing, false, "last needle missing");
    tf::ExpectTrue(secs1 < 3.0 && secs2 < 3.0,
                   "each call must finish in under 3 s (O(M log N))");
  });
}

}  // namespace q86

REGISTER_QUESTION(86, "Many lookups with binary search", q86::RunQ86);
