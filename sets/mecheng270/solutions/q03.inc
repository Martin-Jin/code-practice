void SinglyLinkedList::InsertSorted(const int& value) {
  Node* n = new Node(value);
  if (!head || value < head->data) {
    n->next = head;
    head = n;
    if (!tail) tail = n;
  } else {
    // Stop at the last node whose value is <= the new one.
    Node* prev = head;
    while (prev->next && prev->next->data <= value) prev = prev->next;
    n->next = prev->next;
    prev->next = n;
    if (!n->next) tail = n;
  }
  ++size;
}
