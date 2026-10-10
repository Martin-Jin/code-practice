// ============================================================================
// Question 5  (5 marks)  -  Singly linked-list: Reverse()
// Topic: Linked lists & List ADT
//
// Requirements for Singly linked-list: Reverse()
//
// You have been provided with a partially complete implementation of a singly
// linked list abstract data type (nodes hold an int and a `next` pointer; the
// list keeps `head`, `tail` and `size`).
//
// Task
// Implement SinglyLinkedList::Reverse(). It reverses the list IN PLACE by
// re-pointing the `next` pointers of the existing nodes: do not create new nodes
// and do not copy values around. Afterwards `head` and `tail` must be swapped
// over correctly, so that later calls to Add() still append at the (new) end.
// Reversing an empty list or a one-element list changes nothing.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q05 {
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

  // Return the first / last element's value, or -1 if empty (used by the tests).
  int HeadValue() const { return head ? head->data : -1; }
  int TailValue() const { return tail ? tail->data : -1; }

  void Print() const {
    cout << "List:";
    if (!head) cout << " empty";
    for (Node* c = head; c; c = c->next) {
      cout << (c == head ? " " : " -> ") << c->data;
    }
    cout << endl;
  }

  // Function Reverse() reverses the order of the nodes in place.
  void Reverse();
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void SinglyLinkedList::Reverse() {
  // Your implementation here
}
#else
#include "../solutions/q05.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ05() {
  tf::Test("reverse several elements", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(2);
    my_list->Add(3);
    my_list->Add(4);
    tf::ExpectOutput("List: 4 -> 3 -> 2 -> 1\nSize: 4\n", [&] {
      my_list->Reverse();
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::Test("reverse two elements", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(8);
    my_list->Add(9);
    tf::ExpectOutput("List: 9 -> 8\nHead: 9\nTail: 8\n", [&] {
      my_list->Reverse();
      my_list->Print();
      cout << "Head: " << my_list->HeadValue() << endl;
      cout << "Tail: " << my_list->TailValue() << endl;
    });
    delete my_list;
  });

  tf::Test("empty and one-element lists are unchanged", [] {
    SinglyLinkedList* empty_list = new SinglyLinkedList();
    SinglyLinkedList* one_list = new SinglyLinkedList();
    one_list->Add(5);
    tf::ExpectOutput("List: empty\nList: 5\nSize: 1\n", [&] {
      empty_list->Reverse();
      empty_list->Print();
      one_list->Reverse();
      one_list->Print();
      cout << "Size: " << one_list->Size() << endl;
    });
    delete empty_list;
    delete one_list;
  });

  tf::HiddenTest("tail is updated so Add appends at the new end", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(2);
    my_list->Add(3);
    my_list->Reverse();
    my_list->Add(0);
    tf::ExpectOutput("List: 3 -> 2 -> 1 -> 0\nSize: 4\n", [&] {
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    tf::ExpectEq(my_list->HeadValue(), 3, "head value");
    tf::ExpectEq(my_list->TailValue(), 0, "tail value");
    delete my_list;
  });

  tf::HiddenTest("reversing twice restores the original", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    for (int i = 1; i <= 5; ++i) my_list->Add(i * 10);
    my_list->Reverse();
    my_list->Reverse();
    tf::ExpectOutput("List: 10 -> 20 -> 30 -> 40 -> 50\nSize: 5\n", [&] {
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    tf::ExpectEq(my_list->TailValue(), 50, "tail value");
    delete my_list;
  });

  tf::HiddenTest("reverse keeps duplicates and negative values", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(-1);
    my_list->Add(7);
    my_list->Add(7);
    my_list->Add(0);
    tf::ExpectOutput("List: 0 -> 7 -> 7 -> -1\nHead: 0\nTail: -1\n", [&] {
      my_list->Reverse();
      my_list->Print();
      cout << "Head: " << my_list->HeadValue() << endl;
      cout << "Tail: " << my_list->TailValue() << endl;
    });
    delete my_list;
  });
}

}  // namespace q05

REGISTER_QUESTION(5, "Singly linked-list: Reverse()", q05::RunQ05);
