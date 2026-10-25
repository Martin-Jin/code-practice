// ============================================================================
// Question 2  (5 marks)  -  Singly linked-list: Remove()
// Topic: Linked lists & List ADT
//
// Requirements for Singly linked-list: Remove()
//
// You have been provided with a partially complete implementation of a singly
// linked list abstract data type (nodes hold an int and a `next` pointer; the
// list keeps `head`, `tail` and `size`).
//
// Task
// Implement SinglyLinkedList::Remove(int pos). It removes the node at position
// `pos` (0-indexed) and frees its memory.
//   - pos == 0        -> remove the head
//   - pos == size-1   -> remove the tail
//   - anything in between is a middle removal
//   - pos < 0 or pos >= size -> print "Index out of range" and change nothing.
// head, tail and size must all stay correct (e.g. removing the only element
// leaves an empty list).
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q02 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Node {
  int data;
  Node* next;
  Node(const int& value) : data(value), next(nullptr) {}
};

class SinglyLinkedList {
 private:
  Node* head;
  Node* tail;
  int size;

 public:
  SinglyLinkedList() : head(nullptr), tail(nullptr), size(0) {}
  ~SinglyLinkedList() {
    while (head) {
      Node* t = head;
      head = head->next;
      delete t;
    }
  }

  void Add(const int& value) {
    Node* n = new Node(value);
    if (!head) {
      head = tail = n;
    } else {
      tail->next = n;
      tail = n;
    }
    ++size;
  }

  int Size() const { return size; }

  // Returns the last element's value, or -1 if empty (used by the tests).
  int TailValue() const { return tail ? tail->data : -1; }

  void Print() const {
    cout << "List:";
    if (!head) cout << " empty";
    for (Node* c = head; c; c = c->next) {
      cout << (c == head ? " " : " -> ") << c->data;
    }
    cout << endl;
  }

  // Function Remove(pos) removes the node at position pos (0-indexed).
  void Remove(int pos);
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void SinglyLinkedList::Remove(int pos) {
  // Your implementation here
}
#else
#include "../solutions/q02.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ02() {
  tf::Test("remove the head", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(10);
    my_list->Add(20);
    my_list->Add(30);
    tf::ExpectOutput("List: 20 -> 30\nSize: 2\n", [&] {
      my_list->Remove(0);
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::Test("remove from the middle", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    for (int i = 1; i <= 5; ++i) my_list->Add(i);
    tf::ExpectOutput("List: 1 -> 2 -> 4 -> 5\nSize: 4\n", [&] {
      my_list->Remove(2);
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::Test("remove the tail updates tail", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(2);
    my_list->Add(3);
    my_list->Remove(2);
    my_list->Add(9);  // only lands in the right place if Remove fixed up tail
    tf::ExpectOutput("List: 1 -> 2 -> 9\nSize: 3\n", [&] {
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    tf::ExpectEq(my_list->TailValue(), 9, "tail value");
    delete my_list;
  });

  tf::Test("out of range positions", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(5);
    my_list->Add(6);
    tf::ExpectOutput(
        "Index out of range\nIndex out of range\nIndex out of range\n"
        "List: 5 -> 6\nSize: 2\n",
        [&] {
          my_list->Remove(-1);
          my_list->Remove(2);
          my_list->Remove(100);
          my_list->Print();
          cout << "Size: " << my_list->Size() << endl;
        });
    delete my_list;
  });

  tf::HiddenTest("remove the only element", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(42);
    my_list->Remove(0);
    my_list->Add(7);  // head and tail must both have been reset
    tf::ExpectOutput("List: 7\nSize: 1\n", [&] {
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    tf::ExpectEq(my_list->TailValue(), 7, "tail value");
    delete my_list;
  });

  tf::HiddenTest("remove from an empty list", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    tf::ExpectOutput("Index out of range\nList: empty\nSize: 0\n", [&] {
      my_list->Remove(0);
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::HiddenTest("remove everything from the front, then from the back", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    for (int i = 1; i <= 6; ++i) my_list->Add(i);
    my_list->Remove(0);
    my_list->Remove(0);
    my_list->Remove(3);  // removes 6
    my_list->Remove(2);  // removes 5
    tf::ExpectOutput("List: 3 -> 4\nSize: 2\n", [&] {
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    tf::ExpectEq(my_list->TailValue(), 4, "tail value");
    delete my_list;
  });
}

}  // namespace q02

REGISTER_QUESTION(2, "Singly linked-list: Remove()", q02::RunQ02);
