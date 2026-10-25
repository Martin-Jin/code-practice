// ============================================================================
// Question 27  (8 marks)  -  Strategy pattern: searching
// Topic: Strategy design pattern & searching
//
// Requirements for Strategy pattern: searching
//
// You have been provided with the abstract strategy class SearchStrategy:
//
//   class SearchStrategy {
//    public:
//     virtual ~SearchStrategy() {}
//     virtual int Search(const vector<int>& data, int target) const = 0;
//   };
//
// Search returns the index of `target` in `data`, or -1 if it is not present.
//
// Task
// Using the Strategy design pattern, write:
//   1. class LinearSearch : public SearchStrategy
//        Checks the elements one after another from index 0. It works on any
//        vector (sorted or not) and returns the index of the FIRST match.
//   2. class BinarySearch : public SearchStrategy
//        Repeatedly halves the search range (low/mid/high). It assumes the
//        vector is sorted in ascending order.
//   3. class Searcher (the context)
//        - Searcher()                         starts with no strategy set
//        - void SetStrategy(SearchStrategy*)  stores a (non-owning) pointer;
//                                             the strategy can be swapped at
//                                             any time
//        - int Find(const vector<int>& data, int target) const
//                                             delegates to the current strategy;
//                                             returns -1 if none has been set
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q27 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
class SearchStrategy {
 public:
  virtual ~SearchStrategy() {}
  // Returns the index of target in data, or -1 if not found.
  virtual int Search(const vector<int>& data, int target) const = 0;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
class LinearSearch : public SearchStrategy {
 public:
  int Search(const vector<int>& data, int target) const override {
    // Your implementation here
    return -2;
  }
};

class BinarySearch : public SearchStrategy {
 public:
  int Search(const vector<int>& data, int target) const override {
    // Your implementation here
    return -2;
  }
};

class Searcher {
 public:
  Searcher() {}
  void SetStrategy(SearchStrategy* strategy) {
    // Your implementation here
  }
  int Find(const vector<int>& data, int target) const {
    // Your implementation here
    return -2;
  }
};
#else
#include "../solutions/q27.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ27() {
  const vector<int> sorted = {1, 3, 5, 7, 9, 11, 13};

  tf::Test("both strategies find present values in sorted data", [&] {
    LinearSearch linear;
    BinarySearch binary;
    Searcher searcher;
    tf::ExpectOutput("Linear: 3\nBinary: 3\n", [&] {
      searcher.SetStrategy(&linear);
      cout << "Linear: " << searcher.Find(sorted, 7) << endl;
      searcher.SetStrategy(&binary);
      cout << "Binary: " << searcher.Find(sorted, 7) << endl;
    });
  });

  tf::Test("both strategies agree on every element and on misses", [&] {
    LinearSearch linear;
    BinarySearch binary;
    for (size_t i = 0; i < sorted.size(); ++i) {
      tf::ExpectEq(linear.Search(sorted, sorted[i]), static_cast<int>(i), "linear index");
      tf::ExpectEq(binary.Search(sorted, sorted[i]), static_cast<int>(i), "binary index");
    }
    for (int missing : {0, 2, 8, 14}) {
      tf::ExpectEq(linear.Search(sorted, missing), -1, "linear miss");
      tf::ExpectEq(binary.Search(sorted, missing), -1, "binary miss");
    }
  });

  tf::Test("linear search works on unsorted data", [] {
    LinearSearch linear;
    vector<int> data = {9, 2, 7, 4, 1};
    Searcher searcher;
    searcher.SetStrategy(&linear);
    tf::ExpectEq(searcher.Find(data, 7), 2, "index of 7");
    tf::ExpectEq(searcher.Find(data, 9), 0, "index of 9");
    tf::ExpectEq(searcher.Find(data, 1), 4, "index of 1");
    tf::ExpectEq(searcher.Find(data, 5), -1, "missing value");
  });

  tf::Test("strategy can be swapped at runtime", [&] {
    LinearSearch linear;
    BinarySearch binary;
    Searcher searcher;
    searcher.SetStrategy(&binary);
    tf::ExpectEq(searcher.Find(sorted, 13), 6, "binary: last element");
    searcher.SetStrategy(&linear);
    tf::ExpectEq(searcher.Find({5, 3, 8}, 8), 2, "linear on unsorted after swap");
    searcher.SetStrategy(&binary);
    tf::ExpectEq(searcher.Find(sorted, 1), 0, "binary again: first element");
  });

  tf::HiddenTest("empty and single-element vectors", [] {
    LinearSearch linear;
    BinarySearch binary;
    vector<int> empty;
    vector<int> one = {4};
    tf::ExpectEq(linear.Search(empty, 4), -1, "linear empty");
    tf::ExpectEq(binary.Search(empty, 4), -1, "binary empty");
    tf::ExpectEq(linear.Search(one, 4), 0, "linear single hit");
    tf::ExpectEq(binary.Search(one, 4), 0, "binary single hit");
    tf::ExpectEq(linear.Search(one, 5), -1, "linear single miss");
    tf::ExpectEq(binary.Search(one, 5), -1, "binary single miss");
  });

  tf::HiddenTest("no strategy set returns -1; works through base pointers", [&] {
    Searcher searcher;
    tf::ExpectEq(searcher.Find(sorted, 5), -1, "no strategy");
    SearchStrategy* strategy = new BinarySearch();
    searcher.SetStrategy(strategy);
    tf::ExpectEq(searcher.Find(sorted, 5), 2, "via base pointer");
    delete strategy;
    strategy = new LinearSearch();
    searcher.SetStrategy(strategy);
    tf::ExpectEq(searcher.Find(sorted, 11), 5, "after replacing the strategy");
    delete strategy;
  });

  tf::HiddenTest("larger sorted data and duplicates", [] {
    vector<int> big;
    for (int i = 0; i < 1000; ++i) big.push_back(i * 3);
    LinearSearch linear;
    BinarySearch binary;
    Searcher searcher;
    for (SearchStrategy* s : {static_cast<SearchStrategy*>(&linear),
                              static_cast<SearchStrategy*>(&binary)}) {
      searcher.SetStrategy(s);
      tf::ExpectEq(searcher.Find(big, 0), 0, "first");
      tf::ExpectEq(searcher.Find(big, 2997), 999, "last");
      tf::ExpectEq(searcher.Find(big, 1500), 500, "middle");
      tf::ExpectEq(searcher.Find(big, 1501), -1, "miss");
    }
    vector<int> dups = {3, 1, 3, 3};
    tf::ExpectEq(linear.Search(dups, 3), 0, "linear returns the first match");
  });
}

}  // namespace q27

REGISTER_QUESTION(27, "Strategy pattern: searching", q27::RunQ27);
