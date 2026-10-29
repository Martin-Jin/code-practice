// ============================================================================
// Question 4  (5 marks)  -  Linked list: Length() and Prepend()
// Topic: Linked lists
//
// Requirements for Linked list: Length() and Prepend()
//
// You have been provided with a singly linked list node:
//   struct Node { int value; Node* next; };
// An empty list is represented by a null head pointer.
//
// Task
// 1. Implement `int Length(const Node* head)`. It returns the number of nodes
//    in the list (0 for an empty list).
// 2. Implement `void Prepend(Node*& head, int value)`. It allocates a new node
//    holding `value` and makes it the new first node of the list.
//
// Note: there are three visible test cases and two hidden test cases.
// ============================================================================
#include "framework/test_framework.h"

namespace q04 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Node {
  int value;
  Node* next;
};

int Length(const Node* head);
void Prepend(Node*& head, int value);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int Length(const Node* head) {
  // Your implementation here
  return -1;
}

void Prepend(Node*& head, int value) {
  // Your implementation here
}
#else
#include "../solutions/q04.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
namespace {
void Free(Node* head) {
  while (head != nullptr) {
    Node* next = head->next;
    delete head;
    head = next;
  }
}
}  // namespace

void RunQ04() {
  tf::Test("length of a three-node list", [] {
    Node* c = new Node{3, nullptr};
    Node* b = new Node{2, c};
    Node* a = new Node{1, b};
    tf::ExpectEq(Length(a), 3, "Length(1 -> 2 -> 3)");
    Free(a);
  });

  tf::Test("length of an empty list", [] {
    tf::ExpectEq(Length(nullptr), 0, "Length(nullptr)");
  });

  tf::Test("prepend to an empty list", [] {
    Node* head = nullptr;
    Prepend(head, 9);
    if (head == nullptr) {
      tf::Fail("head is still nullptr after Prepend(head, 9)");
      return;
    }
    tf::ExpectEq(head->value, 9, "head->value");
    tf::ExpectTrue(head->next == nullptr, "head->next is nullptr");
    Free(head);
  });

  tf::HiddenTest("prepend puts the new node first", [] {
    Node* head = new Node{2, nullptr};
    Prepend(head, 1);
    if (head == nullptr || head->next == nullptr) {
      tf::Fail("the list should have two nodes after Prepend");
      Free(head);
      return;
    }
    tf::ExpectEq(head->value, 1, "first value");
    tf::ExpectEq(head->next->value, 2, "second value");
    tf::ExpectEq(Length(head), 2, "Length after Prepend");
    Free(head);
  });

  tf::HiddenTest("repeated prepends build the list in reverse", [] {
    Node* head = nullptr;
    for (int i = 1; i <= 4; ++i) Prepend(head, i);
    tf::ExpectEq(Length(head), 4, "Length after four Prepend calls");
    const Node* n = head;
    for (int expected = 4; expected >= 1; --expected) {
      if (n == nullptr) {
        tf::Fail("the list is shorter than expected");
        break;
      }
      tf::ExpectEq(n->value, expected, "value in order 4, 3, 2, 1");
      n = n->next;
    }
    Free(head);
  });
}

}  // namespace q04

REGISTER_QUESTION(4, "Linked list: Length() and Prepend()", q04::RunQ04);
