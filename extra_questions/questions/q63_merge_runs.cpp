// ============================================================================
// Question 63  (5 marks)  -  Merging two sorted runs
// Topic: Sorting algorithms
//
// Requirements for Merge
//
// Implement void Merge(vector<Item>& a, int L, int m, int R). The span
// a[L..m] and the span a[m+1..R] are each already sorted by key (ascending).
// Merge must rearrange a[L..R] in place so that the whole span is sorted by
// key. Elements outside L..R must not change. Either run may be empty
// (m == L-1 or m == R).
//
// The merge must be stable: when a key in the left run equals a key in the
// right run, the left (earlier) element comes first. Use `<=` when deciding to
// take from the left run. Items are compared by `key` only; `tag` just
// identifies the item (so stability can be seen).
//
// Method: copy both runs to temporary vectors, then repeatedly write the
// smaller head back into a[k], then copy whatever remains of either run.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q63 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Item {
  int key;
  char tag;
};

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
void Merge(vector<Item>& a, int L, int m, int R) {
  // TODO: merge the sorted runs a[L..m] and a[m+1..R] in place.
}
#else
#include "../solutions/q63.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
// "2a" means key 2, tag 'a'. Build items from a string like "1a 3b 5c".
static vector<Item> Items(const string& s) {
  vector<Item> v;
  istringstream in(s);
  string tok;
  while (in >> tok) v.push_back({tok[0] - '0', tok[1]});
  return v;
}

static string Show(const vector<Item>& v) {
  string s;
  for (size_t i = 0; i < v.size(); ++i) {
    if (i) s += " ";
    s += to_string(v[i].key) + v[i].tag;
  }
  return s;
}

static void Check(const string& in, int L, int m, int R, const string& expected) {
  vector<Item> a = Items(in);
  Merge(a, L, m, R);
  tf::ExpectEq(Show(a), expected, "array after Merge");
}

void RunQ63() {
  tf::Test("interleaved runs",
           [] { Check("1a 3b 5c 2d 4e 6f", 0, 2, 5, "1a 2d 3b 4e 5c 6f"); });

  tf::Test("right run entirely smaller",
           [] { Check("5a 6b 1c 2d", 0, 1, 3, "1c 2d 5a 6b"); });

  tf::Test("ties take the left element first (stable)",
           [] { Check("1a 2b 2c 2d 2e 3f", 0, 2, 5, "1a 2b 2c 2d 2e 3f"); });

  tf::Test("runs already in order",
           [] { Check("1a 4b 6c 8d", 0, 1, 3, "1a 4b 6c 8d"); });

  tf::HiddenTest("only the span L..R is touched",
                 [] { Check("9x 8y 1a 3b 2c 9z 9w", 2, 3, 4, "9x 8y 1a 2c 3b 9z 9w"); });

  tf::HiddenTest("one empty side", [] {
    Check("1a 2b 3c", 0, 2, 2, "1a 2b 3c");    // empty right run (m == R)
    Check("1a 2b 3c", 0, -1, 2, "1a 2b 3c");   // empty left run (m == L-1)
  });

  tf::HiddenTest("equal keys across runs stay in input order",
                 [] { Check("2a 2b 1c 2d 2e", 0, 1, 4, "1c 2a 2b 2d 2e"); });
}

}  // namespace q63

REGISTER_QUESTION(63, "Merging two sorted runs", q63::RunQ63);
