SinglyLinkedList::~SinglyLinkedList() {
  Node* cur = head;
  while (cur != nullptr) {
    Node* next = cur->next;  // save before deleting
    delete cur;
    cur = next;
  }
  head = tail = nullptr;
  size = 0;
}
