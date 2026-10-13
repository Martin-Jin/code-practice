// ============================================================================
// Question 3  (4 marks)  -  Singly linked-list: InsertSorted()
// Topic: Linked lists & List ADT
//
// Requirements for Singly linked-list: InsertSorted()
//
// You have been provided with a partially complete implementation of a singly
// linked list abstract data type (nodes hold an int and a `next` pointer; the
// list keeps `head`, `tail` and `size`).
//
// Task
// Implement SinglyLinkedList::InsertSorted(const int& value). The list is
// assumed to already be sorted in ascending order. Insert `value` at the
// position that keeps it sorted:
//   - empty list, or value smaller than every element -> new head
//   - value larger than or equal to every element     -> new tail
//   - otherwise                                       -> somewhere in the middle
// A value equal to existing elements goes after them. head, tail and size must
// all stay correct.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q03 {
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

  // Function InsertSorted(value) inserts value into an ascending sorted list.
  void InsertSorted(const int& value);
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void SinglyLinkedList::InsertSorted(const int& value) {
  // Your implementation here
}
#else
#include "../solutions/q03.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ03() {
  tf::Test("insert into empty list", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    tf::ExpectOutput("List: 5\nSize: 1\n", [&] {
      my_list->InsertSorted(5);
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    tf::ExpectEq(my_list->TailValue(), 5, "tail value");
    delete my_list;
  });

  tf::Test("smallest value becomes the head", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(10);
    my_list->Add(20);
    my_list->Add(30);
    tf::ExpectOutput("List: 5 -> 10 -> 20 -> 30\nSize: 4\n", [&] {
      my_list->InsertSorted(5);
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::Test("value goes in the middle", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(10);
    my_list->Add(20);
    my_list->Add(40);
    my_list->Add(50);
    tf::ExpectOutput("List: 10 -> 20 -> 30 -> 40 -> 50\nSize: 5\n", [&] {
      my_list->InsertSorted(30);
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::Test("largest value becomes the tail", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(2);
    my_list->InsertSorted(9);
    my_list->Add(10);  // only lands in the right place if InsertSorted fixed up tail
    tf::ExpectOutput("List: 1 -> 2 -> 9 -> 10\nSize: 4\n", [&] {
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    tf::ExpectEq(my_list->TailValue(), 10, "tail value");
    delete my_list;
  });

  tf::HiddenTest("duplicates are allowed", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(3);
    my_list->Add(3);
    my_list->Add(5);
    tf::ExpectOutput("List: 1 -> 3 -> 3 -> 3 -> 5\nSize: 5\n", [&] {
      my_list->InsertSorted(3);
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::HiddenTest("repeated InsertSorted sorts the input", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    const int values[] = {4, 1, 3, 5, 2, 0};
    for (int v : values) my_list->InsertSorted(v);
    tf::ExpectOutput("List: 0 -> 1 -> 2 -> 3 -> 4 -> 5\nSize: 6\n", [&] {
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    tf::ExpectEq(my_list->TailValue(), 5, "tail value");
    delete my_list;
  });

  tf::HiddenTest("new head on a one-element list keeps tail correct", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(10);
    my_list->InsertSorted(1);
    my_list->Add(20);
    tf::ExpectOutput("List: 1 -> 10 -> 20\nSize: 3\n", [&] {
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    tf::ExpectEq(my_list->TailValue(), 20, "tail value");
    delete my_list;
  });
}

}  // namespace q03

REGISTER_QUESTION(3, "Singly linked-list: InsertSorted()", q03::RunQ03);
