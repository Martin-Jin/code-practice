void SinglyLinkedList::Insert(int pos, const int& value) {
  if (pos < 0 || pos > size) {
    cout << "Index out of range" << endl;
    return;
  }
  if (pos == size) {
    Add(value);
    return;
  }
  Node* n = new Node(value);
  if (pos == 0) {
    n->next = head;
    head = n;
  } else {
    Node* prev = head;
    for (int i = 0; i < pos - 1; ++i) prev = prev->next;
    n->next = prev->next;
    prev->next = n;
  }
  ++size;
}
