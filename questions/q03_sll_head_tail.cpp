// ============================================================================
// Question 3  (3 marks)  -  Singly linked-list: Head() and Tail()
// Topic: Linked lists & List ADT
//
// Requirements for Singly linked-list: Head() and Tail()
//
// You have been provided with a partially complete implementation of a singly
// linked list abstract data type (nodes hold an int and a `next` pointer; the
// list keeps `head`, `tail` and `size`).
//
// Task
// Implement the two accessor functions
//   int SinglyLinkedList::Head() const   - value stored in the first node
//   int SinglyLinkedList::Tail() const   - value stored in the last node
// If the list is empty, each function must print "List is empty" and return -1.
// Neither function may change the list.
//
// Note: there are three visible test cases and two hidden test cases.
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

  void Print() const {
    cout << "List:";
    if (!head) cout << " empty";
    for (Node* c = head; c; c = c->next) {
      cout << (c == head ? " " : " -> ") << c->data;
    }
    cout << endl;
  }

  // Head() returns the first value, Tail() the last; -1 (and a message) if empty.
  int Head() const;
  int Tail() const;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int SinglyLinkedList::Head() const {
  // Your implementation here
  return 0;
}

int SinglyLinkedList::Tail() const {
  // Your implementation here
  return 0;
}
#else
#include "../solutions/q03.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ03() {
  tf::Test("head and tail of several elements", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(10);
    my_list->Add(20);
    my_list->Add(30);
    tf::ExpectOutput("Head: 10\nTail: 30\n", [&] {
      cout << "Head: " << my_list->Head() << endl;
      cout << "Tail: " << my_list->Tail() << endl;
    });
    delete my_list;
  });

  tf::Test("head and tail of a single element", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(7);
    tf::ExpectOutput("Head: 7\nTail: 7\n", [&] {
      cout << "Head: " << my_list->Head() << endl;
      cout << "Tail: " << my_list->Tail() << endl;
    });
    delete my_list;
  });

  tf::Test("empty list", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    tf::ExpectOutput("List is empty\n-1\nList is empty\n-1\n", [&] {
      cout << my_list->Head() << endl;
      cout << my_list->Tail() << endl;
    });
    delete my_list;
  });

  tf::HiddenTest("tail follows later additions, head does not", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(1);
    my_list->Add(2);
    tf::ExpectEq(my_list->Tail(), 2, "tail after two adds");
    my_list->Add(3);
    my_list->Add(4);
    tf::ExpectOutput("Head: 1\nTail: 4\nList: 1 -> 2 -> 3 -> 4\nSize: 4\n", [&] {
      cout << "Head: " << my_list->Head() << endl;
      cout << "Tail: " << my_list->Tail() << endl;
      my_list->Print();
      cout << "Size: " << my_list->Size() << endl;
    });
    delete my_list;
  });

  tf::HiddenTest("negative values and the -1 sentinel", [] {
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(-5);
    my_list->Add(0);
    my_list->Add(-1);
    // No "List is empty" message may appear for a non-empty list.
    tf::ExpectOutput("-5\n-1\n", [&] {
      cout << my_list->Head() << endl;
      cout << my_list->Tail() << endl;
    });
    delete my_list;
  });
}

}  // namespace q03

REGISTER_QUESTION(3, "Singly linked-list: Head() and Tail()", q03::RunQ03);
