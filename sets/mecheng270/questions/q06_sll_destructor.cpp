// ============================================================================
// Question 6  (3 marks)  -  Singly linked-list: Destructor
// Topic: Linked lists & List ADT, dynamic memory
//
// Requirements for Singly linked-list: Destructor
//
// You have been provided with a partially complete implementation of a singly
// linked list abstract data type (nodes hold an int and a `next` pointer; the
// list keeps `head`, `tail` and `size`). Every node is allocated with `new`.
//
// Task
// Implement the destructor ~SinglyLinkedList(). When a list is destroyed it must
// free EVERY node it owns (not just the head), without reading a node after it
// has been deleted. The tests count live nodes (Node::live goes up in the Node
// constructor and down in the Node destructor) to detect memory leaks.
//
// Note: there are three visible test cases and two hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q06 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Node {
  static int live;  // number of Node objects currently alive (for the tests)
  int data;
  Node* next;
  Node(const int& value) : data(value), next(nullptr) { ++live; }
  ~Node() { --live; }
};
int Node::live = 0;

class SinglyLinkedList {
 private:
  Node* head;
  Node* tail;
  int size;

 public:
  SinglyLinkedList() : head(nullptr), tail(nullptr), size(0) {}
  ~SinglyLinkedList();

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
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
SinglyLinkedList::~SinglyLinkedList() {
  // Your implementation here
}
#else
#include "../solutions/q06.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ06() {
  tf::Test("all nodes are freed", [] {
    int before = Node::live;
    SinglyLinkedList* my_list = new SinglyLinkedList();
    for (int i = 0; i < 5; ++i) my_list->Add(i);
    cout.flush();
    tf::ExpectEq(Node::live - before, 5, "live nodes while list exists");
    delete my_list;
    tf::ExpectEq(Node::live - before, 0, "live nodes after delete (leaked nodes)");
  });

  tf::Test("single node list", [] {
    int before = Node::live;
    SinglyLinkedList* my_list = new SinglyLinkedList();
    my_list->Add(99);
    delete my_list;
    tf::ExpectEq(Node::live - before, 0, "live nodes after delete (leaked nodes)");
  });

  tf::Test("empty list can be destroyed", [] {
    int before = Node::live;
    SinglyLinkedList* my_list = new SinglyLinkedList();
    delete my_list;
    tf::ExpectEq(Node::live - before, 0, "live nodes after delete");
  });

  tf::HiddenTest("list going out of scope", [] {
    int before = Node::live;
    {
      SinglyLinkedList my_list;
      for (int i = 0; i < 100; ++i) my_list.Add(i);
      tf::ExpectEq(Node::live - before, 100, "live nodes while list exists");
    }
    tf::ExpectEq(Node::live - before, 0, "live nodes after scope ends (leaked nodes)");
  });

  tf::HiddenTest("several independent lists", [] {
    int before = Node::live;
    SinglyLinkedList* a = new SinglyLinkedList();
    SinglyLinkedList* b = new SinglyLinkedList();
    for (int i = 0; i < 3; ++i) a->Add(i);
    for (int i = 0; i < 4; ++i) b->Add(i);
    delete a;
    tf::ExpectEq(Node::live - before, 4, "only list a's nodes must be freed");
    delete b;
    tf::ExpectEq(Node::live - before, 0, "live nodes after both deleted");
  });
}

}  // namespace q06

REGISTER_QUESTION(6, "Singly linked-list: Destructor", q06::RunQ06);
