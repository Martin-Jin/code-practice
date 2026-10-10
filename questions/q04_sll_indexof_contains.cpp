// ============================================================================
// Question 4  (4 marks)  -  Singly linked-list: IndexOf() and Contains()
// Topic: Linked lists & List ADT
//
// Requirements for Singly linked-list: IndexOf() and Contains()
//
// You have been provided with a partially complete implementation of a singly
// linked list abstract data type (nodes hold an int and a `next` pointer; the
// list keeps `head`, `tail` and `size`).
//
// Task
// Implement
//   int  SinglyLinkedList::IndexOf(const int& value) const
//   bool SinglyLinkedList::Contains(const int& value) const
// IndexOf returns the 0-based position of the FIRST node holding `value`, or -1
// if the value is not in the list. Contains returns true if the value is in the
// list and false otherwise. Neither function may change the list.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q04 {
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

  void Print() const {
    cout << "List:";
    if (!head) cout << " empty";
    for (Node* c = head; c; c = c->next) {
      cout << (c == head ? " " : " -> ") << c->data;
    }
    cout << endl;
  }

  // IndexOf returns the position of the first match or -1; Contains is a yes/no.
  int IndexOf(const int& value) const;
  bool Contains(const int& value) const;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int SinglyLinkedList::IndexOf(const int& value) const {
  // Your implementation here
  return -1;
}

bool SinglyLinkedList::Contains(const int& value) const {
  // Your implementation here
  return false;
}
#else
#include "../solutions/q04.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ04() {
  tf::Test("IndexOf finds head, middle and tail", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(10);
    my_list->Add(20);
    my_list->Add(30);
    my_list->Add(40);
    tf::ExpectOutput("0\n2\n3\n", [&] {
      cout << my_list->IndexOf(10) << endl;
      cout << my_list->IndexOf(30) << endl;
      cout << my_list->IndexOf(40) << endl;
    });
    delete my_list;
  });

  tf::Test("IndexOf a missing value", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(2);
    tf::ExpectOutput("-1\n-1\n", [&] {
      cout << my_list->IndexOf(3) << endl;
      cout << my_list->IndexOf(-1) << endl;
    });
    delete my_list;
  });

  tf::Test("Contains", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(5);
    my_list->Add(6);
    my_list->Add(7);
    tf::ExpectOutput("true\ntrue\nfalse\n", [&] {
      cout << (my_list->Contains(5) ? "true" : "false") << endl;
      cout << (my_list->Contains(7) ? "true" : "false") << endl;
      cout << (my_list->Contains(8) ? "true" : "false") << endl;
    });
    delete my_list;
  });

  tf::HiddenTest("empty list", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    tf::ExpectOutput("-1\nfalse\n", [&] {
      cout << my_list->IndexOf(0) << endl;
      cout << (my_list->Contains(0) ? "true" : "false") << endl;
    });
    delete my_list;
  });

  tf::HiddenTest("duplicates return the first index", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(4);
    my_list->Add(9);
    my_list->Add(4);
    my_list->Add(9);
    tf::ExpectOutput("0\n1\n", [&] {
      cout << my_list->IndexOf(4) << endl;
      cout << my_list->IndexOf(9) << endl;
    });
    delete my_list;
  });

  tf::HiddenTest("search does not modify the list; value 0 and negatives", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(0);
    my_list->Add(-3);
    tf::ExpectOutput("0\n1\ntrue\nList: 0 -> -3\nSize: 2\n", [&] {
      cout << my_list->IndexOf(0) << endl;
      cout << my_list->IndexOf(-3) << endl;
      cout << (my_list->Contains(-3) ? "true" : "false") << endl;
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });
}

}  // namespace q04

REGISTER_QUESTION(4, "Singly linked-list: IndexOf() and Contains()", q04::RunQ04);
