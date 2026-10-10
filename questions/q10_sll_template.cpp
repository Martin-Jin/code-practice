// ============================================================================
// Question 10  (5 marks)  -  Templated singly linked-list: Add() and FindKth()
// Topic: Linked lists & List ADT (templates)
//
// Requirements for Templated singly linked-list: Add() and FindKth()
//
// You have been provided with a partially complete templated singly linked
// list, SinglyLinkedList<T>. Nodes are hidden inside the class; the list keeps
// `head`, `tail` and `size`.
//
// Task
// Implement the following two member functions (defined outside the class):
//   - void Add(const T& value)
//       Append `value` at the end of the list. head, tail and size must all be
//       kept correct (careful with the empty list).
//   - T FindKth(size_t k) const
//       Return the element at position k (0-indexed). If k >= size, throw
//       std::out_of_range("Index out of range").
//
// Your code must work for any element type T (the tests use int and string).
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include <stdexcept>
#include <string>

#include "../framework/test_framework.h"

namespace q10 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
template <typename T>
class SinglyLinkedList {
 private:
  struct Node {
    T data;
    Node* next;
    Node(const T& value) : data(value), next(nullptr) {}
  };
  Node* head;
  Node* tail;
  size_t size;

 public:
  SinglyLinkedList() : head(nullptr), tail(nullptr), size(0) {}
  ~SinglyLinkedList() {
    while (head) {
      Node* t = head;
      head = head->next;
      delete t;
    }
  }

  size_t Size() const { return size; }

  T Head() const {
    if (!head) throw out_of_range("List is empty");
    return head->data;
  }
  T Tail() const {
    if (!tail) throw out_of_range("List is empty");
    return tail->data;
  }

  // Function Add(value) appends value at the end of the list.
  void Add(const T& value);
  // Function FindKth(k) returns the element at position k (0-indexed).
  T FindKth(size_t k) const;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
template <typename T>
void SinglyLinkedList<T>::Add(const T& value) {
  // Your implementation here
}

template <typename T>
T SinglyLinkedList<T>::FindKth(size_t k) const {
  // Your implementation here
  return T();
}
#else
#include "../solutions/q10.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
template <typename F>
string OutOfRangeMessage(F f) {
  try {
    f();
  } catch (const out_of_range& e) {
    return e.what();
  }
  return "<no exception>";
}

void RunQ10() {
  tf::Test("int list: Add then FindKth", [] {
    SinglyLinkedList<int> list;
    list.Add(10);
    list.Add(20);
    list.Add(30);
    tf::ExpectEq(list.Size(), size_t(3), "size");
    tf::ExpectEq(list.FindKth(0), 10, "FindKth(0)");
    tf::ExpectEq(list.FindKth(1), 20, "FindKth(1)");
    tf::ExpectEq(list.FindKth(2), 30, "FindKth(2)");
  });

  tf::Test("string list: Add then FindKth", [] {
    SinglyLinkedList<string> list;
    list.Add("alpha");
    list.Add("beta");
    list.Add("gamma");
    tf::ExpectEq(list.FindKth(0), "alpha", "FindKth(0)");
    tf::ExpectEq(list.FindKth(2), "gamma", "FindKth(2)");
    tf::ExpectEq(list.Size(), size_t(3), "size");
  });

  tf::Test("Add keeps head and tail correct", [] {
    SinglyLinkedList<int> list;
    list.Add(5);
    tf::ExpectEq(list.Head(), 5, "head after first Add");
    tf::ExpectEq(list.Tail(), 5, "tail after first Add");
    list.Add(6);
    list.Add(7);
    tf::ExpectEq(list.Head(), 5, "head after three Adds");
    tf::ExpectEq(list.Tail(), 7, "tail after three Adds");
  });

  tf::Test("FindKth out of range throws", [] {
    SinglyLinkedList<int> list;
    list.Add(1);
    list.Add(2);
    tf::ExpectEq(OutOfRangeMessage([&] { list.FindKth(2); }), "Index out of range",
                 "message for k == size");
    tf::ExpectEq(OutOfRangeMessage([&] { list.FindKth(100); }), "Index out of range",
                 "message for k >> size");
  });

  tf::HiddenTest("FindKth on an empty list throws", [] {
    SinglyLinkedList<string> list;
    tf::ExpectEq(OutOfRangeMessage([&] { list.FindKth(0); }), "Index out of range",
                 "message on empty list");
    tf::ExpectEq(list.Size(), size_t(0), "size");
  });

  tf::HiddenTest("single element list", [] {
    SinglyLinkedList<string> list;
    list.Add("only");
    tf::ExpectEq(list.FindKth(0), "only", "FindKth(0)");
    tf::ExpectEq(OutOfRangeMessage([&] { list.FindKth(1); }), "Index out of range",
                 "message for k == 1");
  });

  tf::HiddenTest("many elements, every position", [] {
    SinglyLinkedList<int> list;
    for (int i = 0; i < 50; ++i) list.Add(i * i);
    tf::ExpectEq(list.Size(), size_t(50), "size");
    for (int i = 0; i < 50; ++i) {
      tf::ExpectEq(list.FindKth(i), i * i, "FindKth(" + to_string(i) + ")");
    }
    tf::ExpectEq(list.Tail(), 49 * 49, "tail");
  });
}

}  // namespace q10

REGISTER_QUESTION(10, "Templated singly linked-list: Add() and FindKth()", q10::RunQ10);
