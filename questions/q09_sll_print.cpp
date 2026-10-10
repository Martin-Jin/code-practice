// ============================================================================
// Question 9  (3 marks)  -  Singly linked-list: Print()
// Topic: Linked lists & List ADT
//
// Requirements for Singly linked-list: Print()
//
// You have been provided with a partially complete implementation of a singly
// linked list abstract data type (nodes hold an int and a `next` pointer; the
// list keeps `head`, `tail` and `size`).
//
// Task
// Implement SinglyLinkedList::Print() const. It prints the list on ONE line,
// starting with "List: ", with the values separated by " -> ", e.g.
//     List: 10 -> 20 -> 30
// An empty list prints
//     List: empty
// The output ends with a newline. Print() must not change the list.
//
// Note: there are three visible test cases and two hidden test cases.
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

  // Function Print() prints the whole list on one line.
  void Print() const;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void SinglyLinkedList::Print() const {
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
    tf::ExpectOutput("List: 10 -> 20 -> 30\n", [&] { my_list->Print(); });
    delete my_list;
  });

  tf::Test("empty list", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    tf::ExpectOutput("List: empty\n", [&] { my_list->Print(); });
    delete my_list;
  });

  tf::Test("single element has no arrow", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(5);
    tf::ExpectOutput("List: 5\n", [&] { my_list->Print(); });
    delete my_list;
  });

  tf::HiddenTest("negative values and zero", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(-4);
    my_list->Add(0);
    my_list->Add(12);
    my_list->Add(-4);
    tf::ExpectOutput("List: -4 -> 0 -> 12 -> -4\n", [&] { my_list->Print(); });
    delete my_list;
  });

  tf::HiddenTest("printing twice does not change the list", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(2);
    tf::ExpectOutput("List: 1 -> 2\nList: 1 -> 2\nSize: 2\n", [&] {
      my_list->Print();
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });
}

}  // namespace q09

REGISTER_QUESTION(9, "Singly linked-list: Print()", q09::RunQ09);
