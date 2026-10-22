// ============================================================================
// Question 67  (5 marks)  -  Stable sort of records
// Topic: Sorting algorithms
//
// Requirements for Stable sort
//
// A sort is stable if records with equal keys keep their original relative
// order. Selection sort is NOT stable: on {2a, 2b, 1c} pass 0 swaps 1c with
// 2a, giving {1c, 2b, 2a}, and the two equal keys have changed places.
//
// Implement void StableSortByKey(vector<Record>& r). It sorts the records into
// ascending order of `key`, in place, and must be stable. Use insertion sort:
// save the record, shift larger-key records one slot right, and write it back.
// The shifting test must use a strict > on the keys (using >= breaks
// stability). `tag` is not compared; it only identifies the record.
//
// Example: {2a, 2b, 1c} becomes {1c, 2a, 2b}.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../../framework/test_framework.h"

namespace q67 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Record {
  int key;
  char tag;
};

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
void StableSortByKey(vector<Record>& r) {
  // TODO: stable insertion sort by key.
}
#else
#include "../solutions/q67.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
// "2a" means key 2, tag 'a'. Build records from a string like "2a 2b 1c".
static vector<Record> Records(const string& s) {
  vector<Record> v;
  istringstream in(s);
  string tok;
  while (in >> tok) v.push_back({tok[0] - '0', tok[1]});
  return v;
}

static string Show(const vector<Record>& v) {
  string s;
  for (size_t i = 0; i < v.size(); ++i) {
    if (i) s += " ";
    s += to_string(v[i].key) + v[i].tag;
  }
  return s;
}

static void Check(const string& in, const string& expected) {
  vector<Record> r = Records(in);
  StableSortByKey(r);
  tf::ExpectEq(Show(r), expected, "records after sort");
}

void RunQ67() {
  tf::Test("{2a,2b,1c}", [] { Check("2a 2b 1c", "1c 2a 2b"); });

  tf::Test("distinct keys", [] { Check("4a 2b 5c 1d 3e", "1d 2b 3e 4a 5c"); });

  tf::Test("already sorted with equal keys",
           [] { Check("1a 1b 2c 2d", "1a 1b 2c 2d"); });

  tf::Test("reverse order of keys", [] { Check("3a 2b 1c", "1c 2b 3a"); });

  tf::HiddenTest("many equal keys keep input order",
                 [] { Check("3a 1b 3c 1d 3e 1f", "1b 1d 1f 3a 3c 3e"); });

  tf::HiddenTest("all keys equal: nothing moves", [] { Check("5a 5b 5c 5d", "5a 5b 5c 5d"); });

  tf::HiddenTest("empty and single record", [] {
    Check("", "");
    Check("7z", "7z");
  });
}

}  // namespace q67

REGISTER_QUESTION(67, "Stable sort of records", q67::RunQ67);
