// ============================================================================
// Question 16  (4 marks)  -  Circular queue CQueue: constructor and Enqueue()
// Topic: Stack and queue (circular array)
//
// Requirements for Circular queue CQueue: constructor and Enqueue()
//
// You have been provided with a partially complete templated queue, CQueue<T>,
// implemented with a circular array (ring buffer). It tracks `front` (index of
// the front element), `back` (index of the last element) and `size` explicitly,
// so "empty" is size == 0 and "full" is size == capacity.
//
// Task
// Implement the following member functions (defined outside the class):
//   - CQueue(size_t maxSize)
//       Allocate the array with room for maxSize elements and initialise the
//       members. `front` starts at 0 and `back` must start one position BEFORE
//       front (wrapped around), so that the first Enqueue lands in slot 0.
//   - void Enqueue(const T& value)
//       Add value at the back of the queue, wrapping around the end of the
//       array using the modulus operator. If the queue is full, throw
//       std::overflow_error("Queue is full") and change nothing.
//
// Dequeue(), Front() (the value at the front), Size(), FrontIndex(),
// BackIndex() and Capacity() are provided.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include <stdexcept>

#include "framework/test_framework.h"

namespace q16 {
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
  CQueue(size_t maxSize);
  ~CQueue() { delete[] data; }

  size_t Size() const { return size; }
  size_t Capacity() const { return capacity; }
  size_t FrontIndex() const { return front; }
  size_t BackIndex() const { return back; }

  // Value at the front of the queue (T() if the queue is empty).
  T Front() const { return size == 0 ? T() : data[front]; }

  T Dequeue() {
    if (size == 0) throw out_of_range("Queue is empty");
    T value = data[front];
    front = (front + 1) % capacity;
    --size;
    return value;
  }

  void Enqueue(const T& value);
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
template <typename T>
CQueue<T>::CQueue(size_t maxSize) : data(nullptr), capacity(0), front(0), back(0), size(0) {
  // Your implementation here
}

template <typename T>
void CQueue<T>::Enqueue(const T& value) {
  // Your implementation here
}
#else
#include "../solutions/q16.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
template <typename F>
bool ThrowsOverflow(F f) {
  try {
    f();
  } catch (const overflow_error&) {
    return true;
  }
  return false;
}

void RunQ16() {
  tf::Test("constructor: empty queue with back before front", [] {
    CQueue<int> q(5);
    tf::ExpectEq(q.Size(), size_t(0), "size");
    tf::ExpectEq(q.Capacity(), size_t(5), "capacity");
    tf::ExpectEq(q.FrontIndex(), size_t(0), "front index");
    tf::ExpectEq(q.BackIndex(), size_t(4), "back index");
  });

  tf::Test("first Enqueue lands in slot 0", [] {
    CQueue<int> q(4);
    q.Enqueue(42);
    tf::ExpectEq(q.Size(), size_t(1), "size");
    tf::ExpectEq(q.Front(), 42, "front value");
    tf::ExpectEq(q.BackIndex(), size_t(0), "back index");
  });

  tf::Test("Enqueue several then Dequeue in FIFO order", [] {
    CQueue<int> q(5);
    q.Enqueue(1);
    q.Enqueue(2);
    q.Enqueue(3);
    tf::ExpectEq(q.Size(), size_t(3), "size");
    tf::ExpectEq(q.Dequeue(), 1, "first Dequeue");
    tf::ExpectEq(q.Dequeue(), 2, "second Dequeue");
    tf::ExpectEq(q.Dequeue(), 3, "third Dequeue");
  });

  tf::Test("Enqueue into a full queue throws overflow_error", [] {
    CQueue<int> q(3);
    q.Enqueue(1);
    q.Enqueue(2);
    q.Enqueue(3);
    tf::ExpectTrue(ThrowsOverflow([&] { q.Enqueue(4); }), "4th Enqueue should throw");
    tf::ExpectEq(q.Size(), size_t(3), "size unchanged");
    tf::ExpectEq(q.Front(), 1, "front unchanged");
  });

  tf::HiddenTest("back wraps around to index 0", [] {
    CQueue<int> q(3);
    q.Enqueue(1);
    q.Enqueue(2);
    q.Enqueue(3);
    tf::ExpectEq(q.BackIndex(), size_t(2), "back at the last slot");
    q.Dequeue();
    q.Dequeue();
    q.Enqueue(4);
    tf::ExpectEq(q.BackIndex(), size_t(0), "back wrapped to slot 0");
    q.Enqueue(5);
    tf::ExpectEq(q.BackIndex(), size_t(1), "back at slot 1");
    tf::ExpectEq(q.Size(), size_t(3), "size");
    tf::ExpectEq(q.Dequeue(), 3, "Dequeue 1");
    tf::ExpectEq(q.Dequeue(), 4, "Dequeue 2");
    tf::ExpectEq(q.Dequeue(), 5, "Dequeue 3");
  });

  tf::HiddenTest("capacity 1 queue", [] {
    CQueue<int> q(1);
    tf::ExpectEq(q.BackIndex(), size_t(0), "back index of empty capacity-1 queue");
    q.Enqueue(9);
    tf::ExpectTrue(ThrowsOverflow([&] { q.Enqueue(10); }), "second Enqueue should throw");
    tf::ExpectEq(q.Dequeue(), 9, "Dequeue");
    q.Enqueue(8);
    tf::ExpectEq(q.Dequeue(), 8, "Dequeue after re-Enqueue");
  });

  tf::HiddenTest("refill after wraparound, many cycles", [] {
    CQueue<int> q(4);
    int next = 0, expected = 0;
    for (int round = 0; round < 10; ++round) {
      for (int i = 0; i < 3; ++i) q.Enqueue(next++);
      for (int i = 0; i < 3; ++i) {
        tf::ExpectEq(q.Dequeue(), expected, "Dequeue in round " + to_string(round));
        ++expected;
      }
    }
    tf::ExpectEq(q.Size(), size_t(0), "size at the end");
  });
}

}  // namespace q16

REGISTER_QUESTION(16, "Circular queue CQueue: constructor and Enqueue()", q16::RunQ16);
