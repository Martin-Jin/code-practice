// ============================================================================
// Question 45  (4 marks)  -  Fix the bugs: BinarySearchCount()
// Topic: Algorithms and search (binary search)
//
// Requirements for Fix the bugs: BinarySearchCount()
//
// The function BinarySearchCount(v, key, probes) searches the ascending sorted
// vector `v` for `key` using binary search. It should:
//   - return the index of `key` in `v`, or -1 if `key` is not present;
//   - set `probes` to the number of times it looked at (probed) an element of
//     `v` while searching. Every iteration of the search probes exactly one
//     element (the middle one). An empty vector needs 0 probes.
// A correct binary search needs at most 1 + log2(N) probes (rounded down)
// for a vector of N elements, even when the key is absent.
//
// Task
// The code in the answer box below has several bugs: the loop condition, the
// way the search range is updated, and the way probes are counted. Fix them.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q45 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
int BinarySearchCount(const vector<int>& v, int key, int& probes);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int BinarySearchCount(const vector<int>& v, int key, int& probes) {
  int low = 0;
  int high = static_cast<int>(v.size()) - 1;
  probes = 0;
  while (low < high) {
    int mid = low + (high - low) / 2;
    if (v[mid] == key) {
      return mid;
    } else if (v[mid] < key) {
      ++probes;
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return -1;
}
#else
#include "../solutions/q45.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
static vector<int> OneToN(int n) {
  vector<int> v;
  for (int i = 1; i <= n; ++i) v.push_back(i);
  return v;
}

static void Check(const vector<int>& v, int key, int want_index, int want_probes) {
  int probes = -99;
  int idx = BinarySearchCount(v, key, probes);
  tf::ExpectEq(idx, want_index, "index for key " + to_string(key));
  tf::ExpectEq(probes, want_probes, "probes for key " + to_string(key));
}

void RunQ45() {
  tf::Test("key in the middle is found in one probe", [] {
    Check(OneToN(15), 8, 7, 1);
  });

  tf::Test("key at the left and right ends", [] {
    Check(OneToN(15), 1, 0, 4);
    Check(OneToN(15), 15, 14, 4);
  });

  tf::Test("key in the interior", [] {
    Check(OneToN(15), 5, 4, 4);
    Check(OneToN(15), 11, 10, 4);
  });

  tf::Test("missing key reports -1 and the probe count", [] {
    Check(OneToN(15), 100, -1, 4);
    Check(OneToN(15), 0, -1, 4);
  });

  tf::HiddenTest("empty and single-element vectors", [] {
    Check(vector<int>(), 3, -1, 0);
    Check(vector<int>{42}, 42, 0, 1);
    Check(vector<int>{42}, 7, -1, 1);
  });

  tf::HiddenTest("two elements", [] {
    Check(vector<int>{3, 9}, 3, 0, 1);
    Check(vector<int>{3, 9}, 9, 1, 2);
    Check(vector<int>{3, 9}, 5, -1, 2);
  });

  tf::HiddenTest("worst case needs 1 + log2(N) probes", [] {
    vector<int> v;
    for (int i = 0; i < 1023; ++i) v.push_back(2 * i);  // even numbers 0..2044
    Check(v, 1022, 511, 1);
    Check(v, 777, -1, 10);   // odd -> absent
    Check(v, 0, 0, 10);
    Check(v, 2044, 1022, 10);
    Check(v, 5000, -1, 10);
  });
}

}  // namespace q45

REGISTER_QUESTION(45, "Fix the bugs: BinarySearchCount()", q45::RunQ45);
