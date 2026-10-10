// ============================================================================
// Question 8  (4 marks)  -  Singly linked-list: Fix the Insert() function
// Topic: Linked lists & List ADT, debugging
//
// Requirements for Singly linked-list: Fix the Insert() function
//
// You have been provided with an implementation of a singly linked list abstract
// data type (nodes hold an int and a `next` pointer; the list keeps `head`,
// `tail` and `size`). The function Insert(int pos, const int& value) is meant to
// insert `value` so that it ends up at position `pos` (0-indexed):
//   - pos == 0       -> insert at the head
//   - pos == size    -> insert at the tail (append)
//   - 0 < pos < size -> insert in the middle
//   - pos < 0 or pos > size -> print "Index out of range" and change nothing.
//
// Task
// The Insert() code in the answer box contains several bugs. Find and fix them
// so that head, tail and size are all correct after every call.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include "../framework/test_framework.h"

namespace q08 {
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
  if (pos < 0 || pos > size) {
    cout << "Index out of range" << endl;
    return;
  }
  Node* n = new Node(value);
  if (pos == 0) {
    if (!head) tail = n;
    head = n;
  } else {
    Node* prev = head;
    for (int i = 0; i < pos && prev->next != nullptr; ++i) prev = prev->next;
    n->next = prev->next;
    prev->next = n;
  }
}
#else
#include "../solutions/q08.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ08() {
  tf::Test("insert at head of a non-empty list", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(20);
    my_list->Add(30);
    tf::ExpectOutput("List: 10 -> 20 -> 30\n", [&] {
      my_list->Insert(0, 10);
      my_list->Print();
    });
    delete my_list;
  });

  tf::Test("insert in the middle", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(2);
    my_list->Add(4);
    my_list->Add(5);
    tf::ExpectOutput("List: 1 -> 2 -> 3 -> 4 -> 5\n", [&] {
      my_list->Insert(2, 3);
      my_list->Print();
    });
    delete my_list;
  });

  tf::Test("size is incremented", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Insert(0, 5);
    my_list->Insert(1, 6);
    my_list->Insert(1, 7);
    tf::ExpectOutput("Size: 3\n", [&] { cout << "Size: " << my_list->Size() << endl; });
    delete my_list;
  });

  tf::HiddenTest("append then Add: tail must be updated", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(2);
    my_list->Insert(2, 3);
    my_list->Add(4);
    tf::ExpectOutput("List: 1 -> 2 -> 3 -> 4\n", [&] { my_list->Print(); });
    tf::ExpectEq(my_list->TailValue(), 4, "tail value");
    delete my_list;
  });

  tf::HiddenTest("insert into empty list then append", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Insert(0, 42);
    my_list->Insert(1, 43);
    tf::ExpectOutput("List: 42 -> 43\nSize: 2\n", [&] {
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    tf::ExpectEq(my_list->TailValue(), 43, "tail value");
    delete my_list;
  });

  tf::HiddenTest("out of range, and repeated head inserts", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(7);
    for (int i = 1; i <= 3; ++i) my_list->Insert(0, i);
    tf::ExpectOutput(
        "Index out of range\nIndex out of range\nList: 3 -> 2 -> 1 -> 7\nSize: 4\n", [&] {
          my_list->Insert(-1, 99);
          my_list->Insert(5, 99);
          my_list->Print();
          cout << "Size: " << my_list->Size() << endl;
        });
    delete my_list;
  });
}

}  // namespace q08

REGISTER_QUESTION(8, "Singly linked-list: Fix the Insert() function", q08::RunQ08);
