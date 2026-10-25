// ============================================================================
// Question 1  (5 marks)  -  Singly linked-list: Insert()
// Topic: Linked lists & List ADT
//
// Requirements for Singly linked-list: Insert()
//
// You have been provided with a partially complete implementation of a singly
// linked list abstract data type (nodes hold an int and a `next` pointer; the
// list keeps `head`, `tail` and `size`).
//
// Task
// Implement SinglyLinkedList::Insert(int pos, const int& value). It inserts
// `value` so that it ends up at position `pos` (0-indexed), shifting later
// elements along.
//   - pos == 0      -> insert at the head
//   - pos == size   -> insert at the tail (append)
//   - 0 < pos < size-> insert in the middle
//   - pos < 0 or pos > size -> print "Index out of range" and change nothing.
// head, tail and size must all stay correct.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q01 {
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

  // Function Insert(pos, value) inserts value at position pos (0-indexed).
  void Insert(int pos, const int& value);
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
void SinglyLinkedList::Insert(int pos, const int& value) {
  // Your implementation here
}
#else
#include "../solutions/q01.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ01() {
  tf::Test("insert into empty list at 0", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    tf::ExpectOutput("List: 42\nSize: 1\n", [&] {
      my_list->Insert(0, 42);
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::Test("insert at head", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(20);
    my_list->Add(30);
    tf::ExpectOutput("List: 10 -> 20 -> 30\nSize: 3\n", [&] {
      my_list->Insert(0, 10);
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::Test("insert in the middle", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(2);
    my_list->Add(4);
    my_list->Add(5);
    tf::ExpectOutput("List: 1 -> 2 -> 3 -> 4 -> 5\nSize: 5\n", [&] {
      my_list->Insert(2, 3);
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::Test("insert at the tail updates tail", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(2);
    my_list->Insert(2, 3);
    my_list->Add(4);  // only lands in the right place if Insert fixed up tail
    tf::ExpectOutput("List: 1 -> 2 -> 3 -> 4\nSize: 4\n", [&] {
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    tf::ExpectEq(my_list->TailValue(), 4, "tail value");
    delete my_list;
  });

  tf::HiddenTest("out of range positions", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(7);
    tf::ExpectOutput("Index out of range\nIndex out of range\nList: 7\nSize: 1\n", [&] {
      my_list->Insert(-1, 99);
      my_list->Insert(2, 99);
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::HiddenTest("repeated head inserts reverse the order", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    for (int i = 1; i <= 5; ++i) my_list->Insert(0, i);
    tf::ExpectOutput("List: 5 -> 4 -> 3 -> 2 -> 1\nSize: 5\n", [&] {
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::HiddenTest("insert next to the tail keeps tail correct", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(3);
    my_list->Insert(1, 2);  // middle, not the tail
    my_list->Add(4);
    tf::ExpectOutput("List: 1 -> 2 -> 3 -> 4\nSize: 4\n", [&] {
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });
}

}  // namespace q01

REGISTER_QUESTION(1, "Singly linked-list: Insert()", q01::RunQ01);
