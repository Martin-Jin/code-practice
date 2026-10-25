// ============================================================================
// Question 7  (4 marks)  -  Singly linked-list: RemoveTail()
// Topic: Linked lists & List ADT
//
// Requirements for Singly linked-list: RemoveTail()
//
// You have been provided with a partially complete implementation of a singly
// linked list abstract data type (nodes hold an int and a `next` pointer; the
// list keeps `head`, `tail` and `size`).
//
// Task
// Implement SinglyLinkedList::RemoveTail(). It deletes the last node of the list.
// Because the list is singly linked you must walk from the head to the node
// BEFORE the tail in order to update its `next` pointer.
//   - empty list    -> print "List is empty" and change nothing
//   - one element   -> the list becomes empty (head and tail both nullptr)
//   - otherwise     -> `tail` must point at the new last node
// The deleted node must be freed and `size` kept correct.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q07 {
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

  // Function RemoveTail() deletes the last node.
  void RemoveTail();
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void SinglyLinkedList::RemoveTail() {
  // Your implementation here
}
#else
#include "../solutions/q07.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ07() {
  tf::Test("remove the tail of a longer list", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(2);
    my_list->Add(3);
    tf::ExpectOutput("List: 1 -> 2\nSize: 2\n", [&] {
      my_list->RemoveTail();
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::Test("remove the tail of a two-element list", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(10);
    my_list->Add(20);
    tf::ExpectOutput("List: 10\nSize: 1\nTail: 10\n", [&] {
      my_list->RemoveTail();
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
      cout << "Tail: " << my_list->TailValue() << endl;
    });
    delete my_list;
  });

  tf::Test("remove from an empty list", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    tf::ExpectOutput("List is empty\nList: empty\nSize: 0\n", [&] {
      my_list->RemoveTail();
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::HiddenTest("remove the only element, then reuse the list", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(42);
    my_list->RemoveTail();
    my_list->Add(7);  // head and tail must both have been reset
    my_list->Add(8);
    tf::ExpectOutput("List: 7 -> 8\nSize: 2\n", [&] {
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::HiddenTest("tail pointer moves to the new last node", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    for (int i = 1; i <= 4; ++i) my_list->Add(i);
    my_list->RemoveTail();
    tf::ExpectEq(my_list->TailValue(), 3, "tail value after RemoveTail");
    my_list->Add(9);  // lands after 3 only if tail was updated
    tf::ExpectOutput("List: 1 -> 2 -> 3 -> 9\nSize: 4\n", [&] {
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::HiddenTest("repeated removal empties the list", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    for (int i = 1; i <= 3; ++i) my_list->Add(i);
    tf::ExpectOutput("List is empty\nList: empty\nSize: 0\n", [&] {
      my_list->RemoveTail();
      my_list->RemoveTail();
      my_list->RemoveTail();
      my_list->RemoveTail();  // one too many
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });
}

}  // namespace q07

REGISTER_QUESTION(7, "Singly linked-list: RemoveTail()", q07::RunQ07);
