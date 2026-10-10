// ============================================================================
// Question 17  (4 marks)  -  Circular queue CQueue: Dequeue() and Peek()
// Topic: Stack and queue (circular array)
//
// Requirements for Circular queue CQueue: Dequeue() and Peek()
//
// You have been provided with a partially complete templated queue, CQueue<T>,
// implemented with a circular array (ring buffer). It tracks `front` (index of
// the front element), `back` (index of the last element) and `size` explicitly.
// The constructor, Enqueue(), Size(), FrontIndex() and BackIndex() are provided.
//
// Task
// Implement the following member functions (defined outside the class):
//   - T Peek() const
//       Return the element at the front of the queue without removing it.
//   - T Dequeue()
//       Remove and return the element at the front of the queue. Advance
//       `front` by one slot, wrapping around the end of the array using the
//       modulus operator, and keep `size` correct.
// Both functions must throw std::out_of_range("Queue is empty") if the queue
// is empty.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include <stdexcept>
#include <string>

#include "../framework/test_framework.h"

namespace q17 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
template <typename T>
class CQueue {
 private:
  T* data;
  size_t capacity;
  size_t front;  // index of the front element
  size_t back;   // index of the last element
  size_t size;

 public:
  CQueue(size_t maxSize)
      : data(new T[maxSize]), capacity(maxSize), front(0), back(maxSize - 1), size(0) {}
  ~CQueue() { delete[] data; }

  size_t Size() const { return size; }
  size_t FrontIndex() const { return front; }
  size_t BackIndex() const { return back; }

  void Enqueue(const T& value) {
    if (size == capacity) throw overflow_error("Queue is full");
    back = (back + 1) % capacity;
    data[back] = value;
    ++size;
  }

  T Peek() const;
  T Dequeue();
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
template <typename T>
T CQueue<T>::Peek() const {
  // Your implementation here
  return T();
}

template <typename T>
T CQueue<T>::Dequeue() {
  // Your implementation here
  return T();
}
#else
#include "../solutions/q17.inc"
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

void RunQ17() {
  tf::Test("Peek returns the front without removing it", [] {
    CQueue<int> q(4);
    q.Enqueue(5);
    q.Enqueue(6);
    tf::ExpectEq(q.Peek(), 5, "first Peek");
    tf::ExpectEq(q.Peek(), 5, "second Peek");
    tf::ExpectEq(q.Size(), size_t(2), "size");
  });

  tf::Test("Dequeue returns elements in FIFO order", [] {
    CQueue<int> q(5);
    q.Enqueue(10);
    q.Enqueue(20);
    q.Enqueue(30);
    tf::ExpectEq(q.Dequeue(), 10, "first Dequeue");
    tf::ExpectEq(q.Dequeue(), 20, "second Dequeue");
    tf::ExpectEq(q.Size(), size_t(1), "size");
    tf::ExpectEq(q.Peek(), 30, "Peek of the last element");
  });

  tf::Test("Dequeue advances front and updates size", [] {
    CQueue<int> q(4);
    q.Enqueue(1);
    q.Enqueue(2);
    q.Dequeue();
    tf::ExpectEq(q.FrontIndex(), size_t(1), "front index");
    tf::ExpectEq(q.Size(), size_t(1), "size");
    q.Dequeue();
    tf::ExpectEq(q.Size(), size_t(0), "size when empty");
  });

  tf::Test("Dequeue on an empty queue throws out_of_range", [] {
    CQueue<int> q(3);
    tf::ExpectTrue(ThrowsOutOfRange([&] { q.Dequeue(); }), "Dequeue on empty queue");
    q.Enqueue(1);
    q.Dequeue();
    tf::ExpectTrue(ThrowsOutOfRange([&] { q.Dequeue(); }), "Dequeue after emptying");
  });

  tf::HiddenTest("Peek on an empty queue throws out_of_range", [] {
    CQueue<string> q(3);
    tf::ExpectTrue(ThrowsOutOfRange([&] { q.Peek(); }), "Peek on empty queue");
    q.Enqueue("x");
    q.Dequeue();
    tf::ExpectTrue(ThrowsOutOfRange([&] { q.Peek(); }), "Peek after emptying");
  });

  tf::HiddenTest("front wraps around the end of the array", [] {
    CQueue<int> q(3);
    q.Enqueue(1);
    q.Enqueue(2);
    q.Enqueue(3);
    tf::ExpectEq(q.Dequeue(), 1, "Dequeue 1");
    tf::ExpectEq(q.Dequeue(), 2, "Dequeue 2");
    q.Enqueue(4);
    q.Enqueue(5);
    tf::ExpectEq(q.Dequeue(), 3, "Dequeue 3 (front reaches the last slot)");
    tf::ExpectEq(q.FrontIndex(), size_t(0), "front wrapped to slot 0");
    tf::ExpectEq(q.Peek(), 4, "Peek after wrap");
    tf::ExpectEq(q.Dequeue(), 4, "Dequeue 4");
    tf::ExpectEq(q.Dequeue(), 5, "Dequeue 5");
    tf::ExpectEq(q.Size(), size_t(0), "size");
  });

  tf::HiddenTest("capacity 1 queue and many cycles", [] {
    CQueue<int> q(1);
    for (int i = 0; i < 5; ++i) {
      q.Enqueue(i);
      tf::ExpectEq(q.Peek(), i, "Peek " + to_string(i));
      tf::ExpectEq(q.Dequeue(), i, "Dequeue " + to_string(i));
    }
    tf::ExpectTrue(ThrowsOutOfRange([&] { q.Dequeue(); }), "empty at the end");
  });
}

}  // namespace q17

REGISTER_QUESTION(17, "Circular queue CQueue: Dequeue() and Peek()", q17::RunQ17);
