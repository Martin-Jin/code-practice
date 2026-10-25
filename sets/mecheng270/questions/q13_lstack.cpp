// ============================================================================
// Question 13  (4 marks)  -  Stack built on a linked-list: LStack<T>
// Topic: Stack and queue
//
// Requirements for Stack built on a linked-list: LStack<T>
//
// You have been provided with a complete templated singly linked-list,
// SinglyLinkedList<T>, and a partially complete stack class LStack<T> that
// stores its elements in such a list. The top of the stack must correspond to
// the HEAD of the list, so that every stack operation is O(1).
//
// Task
// Implement the following LStack<T> member functions (defined outside the
// class) using only the list's Head(), Insert() and Remove():
//   - T Top()                  return the top element without removing it
//   - void Push(const T& value) put value on top of the stack
//   - T Pop()                  remove the top element and return it
// Top() and Pop() must throw std::out_of_range if the stack is empty.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include <stdexcept>
#include <string>

#include "framework/test_framework.h"

namespace q13 {
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

  // Returns the first element; throws out_of_range if the list is empty.
  T Head() const {
    if (!head) throw out_of_range("List is empty");
    return head->data;
  }

  // Inserts value at position pos (0 <= pos <= size); throws out_of_range otherwise.
  void Insert(size_t pos, const T& value) {
    if (pos > size) throw out_of_range("Index out of range");
    Node* n = new Node(value);
    if (pos == 0) {
      n->next = head;
      head = n;
      if (!tail) tail = n;
    } else {
      Node* prev = head;
      for (size_t i = 0; i < pos - 1; ++i) prev = prev->next;
      n->next = prev->next;
      prev->next = n;
      if (!n->next) tail = n;
    }
    ++size;
  }

  // Removes the element at position pos (0 <= pos < size); throws out_of_range otherwise.
  void Remove(size_t pos) {
    if (pos >= size) throw out_of_range("Index out of range");
    Node* del;
    if (pos == 0) {
      del = head;
      head = head->next;
      if (!head) tail = nullptr;
    } else {
      Node* prev = head;
      for (size_t i = 0; i < pos - 1; ++i) prev = prev->next;
      del = prev->next;
      prev->next = del->next;
      if (del == tail) tail = prev;
    }
    delete del;
    --size;
  }
};

template <typename T>
class LStack {
 private:
  SinglyLinkedList<T> list;

 public:
  LStack() : list() {}

  size_t Size() const { return list.Size(); }
  bool IsEmpty() const { return list.Size() == 0; }

  T Top();
  void Push(const T& value);
  T Pop();
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
template <typename T>
T LStack<T>::Top() {
  // Your implementation here
  return T();
}

template <typename T>
void LStack<T>::Push(const T& value) {
  // Your implementation here
}

template <typename T>
T LStack<T>::Pop() {
  // Your implementation here
  return T();
}
#else
#include "../solutions/q13.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
template <typename F>
bool ThrowsOutOfRange(F f) {
  try {
    f();
  } catch (const out_of_range&) {
    return true;
  }
  return false;
}

void RunQ13() {
  tf::Test("Push then Top", [] {
    LStack<int> s;
    s.Push(1);
    s.Push(2);
    s.Push(3);
    tf::ExpectEq(s.Top(), 3, "Top");
    tf::ExpectEq(s.Size(), size_t(3), "size");
  });

  tf::Test("Pop returns elements in LIFO order", [] {
    LStack<int> s;
    s.Push(10);
    s.Push(20);
    s.Push(30);
    tf::ExpectEq(s.Pop(), 30, "first Pop");
    tf::ExpectEq(s.Pop(), 20, "second Pop");
    tf::ExpectEq(s.Pop(), 10, "third Pop");
    tf::ExpectTrue(s.IsEmpty(), "stack is empty after popping everything");
  });

  tf::Test("Top does not remove the element", [] {
    LStack<string> s;
    s.Push("a");
    s.Push("b");
    tf::ExpectEq(s.Top(), "b", "first Top");
    tf::ExpectEq(s.Top(), "b", "second Top");
    tf::ExpectEq(s.Size(), size_t(2), "size");
  });

  tf::Test("Pop on an empty stack throws out_of_range", [] {
    LStack<int> s;
    tf::ExpectTrue(ThrowsOutOfRange([&] { s.Pop(); }), "Pop on empty stack should throw");
  });

  tf::HiddenTest("Top on an empty stack throws out_of_range", [] {
    LStack<int> s;
    tf::ExpectTrue(ThrowsOutOfRange([&] { s.Top(); }), "Top on empty stack should throw");
    s.Push(1);
    s.Pop();
    tf::ExpectTrue(ThrowsOutOfRange([&] { s.Top(); }), "Top after emptying should throw");
  });

  tf::HiddenTest("interleaved Push and Pop", [] {
    LStack<int> s;
    s.Push(1);
    s.Push(2);
    tf::ExpectEq(s.Pop(), 2, "Pop 1");
    s.Push(3);
    s.Push(4);
    tf::ExpectEq(s.Pop(), 4, "Pop 2");
    tf::ExpectEq(s.Pop(), 3, "Pop 3");
    tf::ExpectEq(s.Top(), 1, "Top");
    tf::ExpectEq(s.Size(), size_t(1), "size");
  });

  tf::HiddenTest("stack reverses a sequence of strings", [] {
    LStack<string> s;
    const string words[] = {"one", "two", "three", "four", "five"};
    for (const string& w : words) s.Push(w);
    string out;
    while (!s.IsEmpty()) out += s.Pop() + " ";
    tf::ExpectEq(out, "five four three two one ", "popped sequence");
  });
}

}  // namespace q13

REGISTER_QUESTION(13, "Stack built on a linked-list: LStack<T>", q13::RunQ13);
