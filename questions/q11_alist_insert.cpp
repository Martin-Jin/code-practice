// ============================================================================
// Question 11  (4 marks)  -  Array list AIntList: Insert()
// Topic: Linked lists & List ADT (array implementation)
//
// Requirements for Array list AIntList: Insert()
//
// You have been provided with a partially complete array implementation of the
// List ADT, AIntList. It stores its elements in a dynamically allocated array
// of fixed capacity `maxSize`; `listSize` is the number of elements currently
// stored (they occupy indices 0 .. listSize-1).
//
// Task
// Implement AIntList::Insert(int pos, int value). It inserts `value` so that
// it ends up at index `pos`, shifting the elements at pos, pos+1, ... one place
// to the right to make room.
//   - 0 <= pos <= listSize is valid (pos == listSize appends).
//   - If pos < 0 or pos > listSize, do nothing.
//   - If the list is already full (listSize == maxSize), do nothing.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q11 {
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

  int FindKth(int k) const { return (k < 0 || k > listSize - 1) ? 0 : listArray[k]; }

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

  // Function Insert(pos, value) inserts value at index pos, shifting later items right.
  void Insert(int pos, int value);
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void AIntList::Insert(int pos, int value) {
  // Your implementation here
}
#else
#include "../solutions/q11.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ11() {
  tf::Test("insert into empty list", [] {
    AIntList list(5);
    tf::ExpectOutput("List: 42\nSize: 1\n", [&] {
      list.Insert(0, 42);
      list.Print();
      cout << "Size: " << list.Size() << endl;
    });
  });

  tf::Test("insert at the front shifts everything right", [] {
    AIntList list(6);
    list.Add(20);
    list.Add(30);
    list.Add(40);
    tf::ExpectOutput("List: 10 20 30 40\nSize: 4\n", [&] {
      list.Insert(0, 10);
      list.Print();
      cout << "Size: " << list.Size() << endl;
    });
  });

  tf::Test("insert in the middle", [] {
    AIntList list(6);
    list.Add(1);
    list.Add(2);
    list.Add(4);
    list.Add(5);
    tf::ExpectOutput("List: 1 2 3 4 5\nSize: 5\n", [&] {
      list.Insert(2, 3);
      list.Print();
      cout << "Size: " << list.Size() << endl;
    });
  });

  tf::Test("insert at the end appends", [] {
    AIntList list(4);
    list.Add(1);
    list.Add(2);
    list.Insert(2, 3);
    tf::ExpectOutput("List: 1 2 3\nSize: 3\n", [&] {
      list.Print();
      cout << "Size: " << list.Size() << endl;
    });
  });

  tf::HiddenTest("insert into a full list is ignored", [] {
    AIntList list(3);
    list.Add(1);
    list.Add(2);
    list.Add(3);
    tf::ExpectOutput("List: 1 2 3\nSize: 3\n", [&] {
      list.Insert(1, 99);
      list.Insert(0, 99);
      list.Insert(3, 99);
      list.Print();
      cout << "Size: " << list.Size() << endl;
    });
  });

  tf::HiddenTest("out of range positions are ignored", [] {
    AIntList list(5);
    list.Add(7);
    list.Add(8);
    tf::ExpectOutput("List: 7 8\nSize: 2\n", [&] {
      list.Insert(-1, 99);
      list.Insert(3, 99);
      list.Insert(100, 99);
      list.Print();
      cout << "Size: " << list.Size() << endl;
    });
  });

  tf::HiddenTest("fill a list by repeated front inserts", [] {
    AIntList list(5);
    for (int i = 1; i <= 5; ++i) list.Insert(0, i);
    list.Insert(0, 6);  // full: ignored
    tf::ExpectOutput("List: 5 4 3 2 1\nSize: 5\n", [&] {
      list.Print();
      cout << "Size: " << list.Size() << endl;
    });
  });
}

}  // namespace q11

REGISTER_QUESTION(11, "Array list AIntList: Insert()", q11::RunQ11);
