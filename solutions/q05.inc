void SinglyLinkedList::Reverse() {
  Node* prev = nullptr;
  Node* cur = head;
  tail = head;
  while (cur != nullptr) {
    Node* next = cur->next;
    cur->next = prev;
    prev = cur;
    cur = next;
  }
  head = prev;
}
