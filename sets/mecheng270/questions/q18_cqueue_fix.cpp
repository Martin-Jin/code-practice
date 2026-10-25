// ============================================================================
// Question 18  (4 marks)  -  Fix the buggy circular queue CQueue
// Topic: Stack and queue (circular array)
//
// Requirements for Fix the buggy circular queue CQueue
//
// A templated queue, CQueue<T>, is implemented with a circular array (ring
// buffer). It tracks `front` (index of the front element), `back` (index of the
// last element) and `size` explicitly, so "empty" is size == 0 and "full" is
// size == capacity. The class below is meant to behave as follows:
//   - Enqueue(value) adds at the back, wrapping around the end of the array;
//     it throws std::overflow_error("Queue is full") if the queue is full.
//   - Dequeue() removes and returns the front element, wrapping `front`; it
//     throws std::out_of_range("Queue is empty") if the queue is empty.
//   - Peek() returns the front element without removing it; it throws
//     std::out_of_range("Queue is empty") if the queue is empty.
//   - Size() returns the number of elements currently stored.
//
// Task
// The implementation contains several bugs. Find and fix them so the queue
// behaves as specified. You may change anything inside the answer box, but the
// public interface (constructor, Enqueue, Dequeue, Peek, Size) must stay.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include <stdexcept>
#include <string>

#include "framework/test_framework.h"

namespace q18 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// (nothing: the whole class is in the answer box)

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
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
      : data(new T[maxSize]()), capacity(maxSize), front(0), back(0), size(0) {}
  ~CQueue() { delete[] data; }

  size_t Size() const { return size; }

  T Peek() const { return data[front]; }

  void Enqueue(const T& value) {
    if (size == capacity) throw overflow_error("Queue is full");
    back = back + 1;
    if (back < capacity) data[back] = value;  // keep the write inside the array
    ++size;
  }

  T Dequeue() {
    if (size == 0) throw out_of_range("Queue is empty");
    T value = data[front];
    front = (front + 1) % capacity;
    return value;
  }
};
#else
#include "../solutions/q18.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
template <typename E, typename F>
bool Throws(F f) {
  try {
    f();
  } catch (const E&) {
    return true;
  }
  return false;
}

void RunQ18() {
  tf::Test("first element enqueued is at the front", [] {
    CQueue<int> q(4);
    q.Enqueue(7);
    tf::ExpectEq(q.Peek(), 7, "Peek");
    tf::ExpectEq(q.Size(), size_t(1), "size");
  });

  tf::Test("FIFO order and size tracking", [] {
    CQueue<int> q(5);
    q.Enqueue(1);
    q.Enqueue(2);
    q.Enqueue(3);
    tf::ExpectEq(q.Dequeue(), 1, "first Dequeue");
    tf::ExpectEq(q.Size(), size_t(2), "size after one Dequeue");
    tf::ExpectEq(q.Dequeue(), 2, "second Dequeue");
    tf::ExpectEq(q.Dequeue(), 3, "third Dequeue");
    tf::ExpectEq(q.Size(), size_t(0), "size after emptying");
  });

  tf::Test("full queue throws overflow_error", [] {
    CQueue<int> q(3);
    q.Enqueue(1);
    q.Enqueue(2);
    q.Enqueue(3);
    tf::ExpectTrue(Throws<overflow_error>([&] { q.Enqueue(4); }), "4th Enqueue should throw");
    tf::ExpectEq(q.Size(), size_t(3), "size");
  });

  tf::Test("empty queue throws out_of_range", [] {
    CQueue<int> q(3);
    tf::ExpectTrue(Throws<out_of_range>([&] { q.Dequeue(); }), "Dequeue on empty queue");
    tf::ExpectTrue(Throws<out_of_range>([&] { q.Peek(); }), "Peek on empty queue");
  });

  tf::HiddenTest("wraparound keeps FIFO order", [] {
    CQueue<int> q(3);
    q.Enqueue(1);
    q.Enqueue(2);
    q.Enqueue(3);
    tf::ExpectEq(q.Dequeue(), 1, "Dequeue 1");
    tf::ExpectEq(q.Dequeue(), 2, "Dequeue 2");
    q.Enqueue(4);
    q.Enqueue(5);
    tf::ExpectEq(q.Size(), size_t(3), "size");
    tf::ExpectEq(q.Dequeue(), 3, "Dequeue 3");
    tf::ExpectEq(q.Dequeue(), 4, "Dequeue 4");
    tf::ExpectEq(q.Dequeue(), 5, "Dequeue 5");
  });

  tf::HiddenTest("refill after emptying, many cycles", [] {
    CQueue<string> q(2);
    for (int i = 0; i < 6; ++i) {
      string a = "a" + to_string(i), b = "b" + to_string(i);
      q.Enqueue(a);
      q.Enqueue(b);
      tf::ExpectTrue(Throws<overflow_error>([&] { q.Enqueue("x"); }), "full in round " + a);
      tf::ExpectEq(q.Dequeue(), a, "Dequeue a");
      tf::ExpectEq(q.Peek(), b, "Peek b");
      tf::ExpectEq(q.Dequeue(), b, "Dequeue b");
    }
    tf::ExpectEq(q.Size(), size_t(0), "size at the end");
  });

  tf::HiddenTest("capacity 1 queue", [] {
    CQueue<int> q(1);
    q.Enqueue(9);
    tf::ExpectEq(q.Peek(), 9, "Peek");
    tf::ExpectTrue(Throws<overflow_error>([&] { q.Enqueue(1); }), "second Enqueue should throw");
    tf::ExpectEq(q.Dequeue(), 9, "Dequeue");
    q.Enqueue(8);
    tf::ExpectEq(q.Dequeue(), 8, "Dequeue after re-Enqueue");
    tf::ExpectTrue(Throws<out_of_range>([&] { q.Peek(); }), "Peek on empty queue");
  });
}

}  // namespace q18

REGISTER_QUESTION(18, "Fix the buggy circular queue CQueue", q18::RunQ18);
