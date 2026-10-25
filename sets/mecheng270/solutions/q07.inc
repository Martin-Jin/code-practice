void SinglyLinkedList::RemoveTail() {
  if (head == nullptr) {
    cout << "List is empty" << endl;
    return;
  }
  if (head == tail) {
    delete head;
    head = tail = nullptr;
  } else {
    Node* prev = head;
    while (prev->next != tail) prev = prev->next;
    delete tail;
    prev->next = nullptr;
    tail = prev;
  }
  --size;
}
