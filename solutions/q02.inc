void SinglyLinkedList::Remove(int pos) {
  if (pos < 0 || pos >= size) {
    cout << "Index out of range" << endl;
    return;
  }
  Node* victim = nullptr;
  if (pos == 0) {
    victim = head;
    head = head->next;
    if (head == nullptr) tail = nullptr;
  } else {
    Node* prev = head;
    for (int i = 0; i < pos - 1; ++i) prev = prev->next;
    victim = prev->next;
    prev->next = victim->next;
    if (victim == tail) tail = prev;
  }
  delete victim;
  --size;
}
