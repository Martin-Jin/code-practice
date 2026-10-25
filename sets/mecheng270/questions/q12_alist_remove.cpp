// ============================================================================
// Question 12  (4 marks)  -  Array list AIntList: Remove() and FindKth()
// Topic: Linked lists & List ADT (array implementation)
//
// Requirements for Array list AIntList: Remove() and FindKth()
//
// You have been provided with a partially complete array implementation of the
// List ADT, AIntList. It stores its elements in a dynamically allocated array
// of fixed capacity `maxSize`; `listSize` is the number of elements currently
// stored (they occupy indices 0 .. listSize-1).
//
// Task
// Implement two member functions:
//   - void Remove(int pos)
//       Delete the element at index pos, shifting every later element one place
//       to the left to close the gap. If pos < 0 or pos >= listSize, do nothing.
//   - int FindKth(int k) const
//       Return the element at index k. If k is out of range (k < 0 or
//       k >= listSize), return 0.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q12 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
class AIntList {
 private:
  int* listArray;  // array holding list elements
  int maxSize;     // maximum size of list
  int listSize;    // current number of list items

 public:
  AIntList(int size) : listArray(new int[size]), maxSize(size), listSize(0) {}
  ~AIntList() {
    delete[] listArray;
    listArray = nullptr;
  }

  int Size() const { return listSize; }

  void Add(int value) {
    if (listSize >= maxSize) return;  // list is full
    listArray[listSize] = value;
    ++listSize;
  }

  void Print() const {
    cout << "List:";
    for (int i = 0; i < listSize; ++i) cout << " " << listArray[i];
    cout << endl;
  }

  // Function Remove(pos) deletes the item at index pos, shifting later items left.
  void Remove(int pos);
  // Function FindKth(k) returns the item at index k, or 0 if k is out of range.
  int FindKth(int k) const;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void AIntList::Remove(int pos) {
  // Your implementation here
}

int AIntList::FindKth(int k) const {
  // Your implementation here
  return 0;
}
#else
#include "../solutions/q12.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
static AIntList* MakeList(int capacity, initializer_list<int> values) {
  AIntList* list = new AIntList(capacity);
  for (int v : values) list->Add(v);
  return list;
}

void RunQ12() {
  tf::Test("remove from the middle", [] {
    AIntList* list = MakeList(6, {1, 2, 3, 4, 5});
    tf::ExpectOutput("List: 1 2 4 5\nSize: 4\n", [&] {
      list->Remove(2);
      list->Print();
      cout << "Size: " << list->Size() << endl;
    });
    delete list;
  });

  tf::Test("remove the first and the last element", [] {
    AIntList* list = MakeList(5, {10, 20, 30, 40});
    tf::ExpectOutput("List: 20 30\nSize: 2\n", [&] {
      list->Remove(0);
      list->Remove(2);
      list->Print();
      cout << "Size: " << list->Size() << endl;
    });
    delete list;
  });

  tf::Test("FindKth returns the element at each index", [] {
    AIntList* list = MakeList(5, {4, 8, 15});
    tf::ExpectEq(list->FindKth(0), 4, "FindKth(0)");
    tf::ExpectEq(list->FindKth(1), 8, "FindKth(1)");
    tf::ExpectEq(list->FindKth(2), 15, "FindKth(2)");
    delete list;
  });

  tf::Test("FindKth sees the shift made by Remove", [] {
    AIntList* list = MakeList(5, {4, 8, 15, 16});
    list->Remove(1);
    tf::ExpectEq(list->FindKth(1), 15, "FindKth(1)");
    tf::ExpectEq(list->FindKth(2), 16, "FindKth(2)");
    tf::ExpectEq(list->FindKth(3), 0, "FindKth(3) is now out of range");
    delete list;
  });

  tf::HiddenTest("out of range Remove is ignored", [] {
    AIntList* list = MakeList(4, {1, 2, 3});
    tf::ExpectOutput("List: 1 2 3\nSize: 3\n", [&] {
      list->Remove(-1);
      list->Remove(3);
      list->Remove(50);
      list->Print();
      cout << "Size: " << list->Size() << endl;
    });
    delete list;
  });

  tf::HiddenTest("out of range FindKth returns 0", [] {
    AIntList* list = MakeList(4, {7, 8});
    tf::ExpectEq(list->FindKth(-1), 0, "FindKth(-1)");
    tf::ExpectEq(list->FindKth(2), 0, "FindKth(2)");
    tf::ExpectEq(list->FindKth(3), 0, "FindKth(3)");
    delete list;
  });

  tf::HiddenTest("remove every element one by one", [] {
    AIntList* list = MakeList(4, {1, 2, 3, 4});
    list->Remove(0);
    list->Remove(0);
    list->Remove(0);
    tf::ExpectEq(list->Size(), 1, "size");
    tf::ExpectEq(list->FindKth(0), 4, "last remaining element");
    list->Remove(0);
    tf::ExpectEq(list->Size(), 0, "size when empty");
    list->Remove(0);  // removing from an empty list does nothing
    tf::ExpectEq(list->Size(), 0, "size after removing from empty list");
    delete list;
  });
}

}  // namespace q12

REGISTER_QUESTION(12, "Array list AIntList: Remove() and FindKth()", q12::RunQ12);
