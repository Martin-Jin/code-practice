int SinglyLinkedList::IndexOf(const int& value) const {
  int index = 0;
  for (Node* cur = head; cur != nullptr; cur = cur->next) {
    if (cur->data == value) return index;
    ++index;
  }
  return -1;
}

bool SinglyLinkedList::Contains(const int& value) const {
  return IndexOf(value) != -1;
}
