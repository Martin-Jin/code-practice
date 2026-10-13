// ============================================================================
// Question 9  (4 marks)  -  Singly linked-list: PrintReverse()
// Topic: Linked lists & List ADT, recursion
//
// Requirements for Singly linked-list: PrintReverse()
//
// You have been provided with a partially complete implementation of a singly
// linked list abstract data type (nodes hold an int and a `next` pointer; the
// list keeps `head`, `tail` and `size`). Nodes only point forwards.
//
// Task
// Implement SinglyLinkedList::PrintReverse() const, which prints the list from
// the LAST element back to the first on ONE line, starting with "Reversed: "
// and separating values with " -> ", e.g.
//     Reversed: 30 -> 20 -> 10
// An empty list prints
//     Reversed: empty
// The output ends with a newline. The list itself must not change (do not
// reverse it, and do not copy it into another container).
//
// Hint: use the private recursive helper PrintReverse(Node*) const, which is
// declared for you. Recurse first, print afterwards.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q09 {
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

  // Prints node's value after everything that follows it (and the arrows).
  void PrintReverse(Node* node) const;

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

  // Function PrintReverse() prints the whole list, last element first.
  void PrintReverse() const;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void SinglyLinkedList::PrintReverse(Node* node) const {
  // Your implementation here
}

void SinglyLinkedList::PrintReverse() const {
  // Your implementation here
}
#else
#include "../solutions/q09.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ09() {
  tf::Test("several elements", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(10);
    my_list->Add(20);
    my_list->Add(30);
    tf::ExpectOutput("Reversed: 30 -> 20 -> 10\n", [&] { my_list->PrintReverse(); });
    delete my_list;
  });

  tf::Test("empty list", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    tf::ExpectOutput("Reversed: empty\n", [&] { my_list->PrintReverse(); });
    delete my_list;
  });

  tf::Test("single element has no arrow", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(5);
    tf::ExpectOutput("Reversed: 5\n", [&] { my_list->PrintReverse(); });
    delete my_list;
  });

  tf::HiddenTest("negative values and zero", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(-4);
    my_list->Add(0);
    my_list->Add(12);
    my_list->Add(-4);
    tf::ExpectOutput("Reversed: -4 -> 12 -> 0 -> -4\n", [&] { my_list->PrintReverse(); });
    delete my_list;
  });

  tf::HiddenTest("the list is not changed", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(2);
    my_list->Add(3);
    tf::ExpectOutput(
        "Reversed: 3 -> 2 -> 1\nList: 1 -> 2 -> 3\nReversed: 3 -> 2 -> 1\nSize: 3\n", [&] {
          my_list->PrintReverse();
          my_list->Print();
          my_list->PrintReverse();
          cout << "Size: " << my_list->Size() << endl;
        });
    delete my_list;
  });

  tf::HiddenTest("longer list", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    for (int i = 1; i <= 8; ++i) my_list->Add(i * i);
    tf::ExpectOutput("Reversed: 64 -> 49 -> 36 -> 25 -> 16 -> 9 -> 4 -> 1\n",
                     [&] { my_list->PrintReverse(); });
    delete my_list;
  });
}

}  // namespace q09

REGISTER_QUESTION(9, "Singly linked-list: PrintReverse()", q09::RunQ09);
