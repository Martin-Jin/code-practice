template <typename T>
void SinglyLinkedList<T>::Add(const T& value) {
  Node* n = new Node(value);
  if (!head) {
    head = tail = n;
  } else {
    tail->next = n;
    tail = n;
  }
  ++size;
}

template <typename T>
T SinglyLinkedList<T>::FindKth(size_t k) const {
  if (k >= size) throw out_of_range("Index out of range");
  Node* curr = head;
  while (k--) curr = curr->next;
  return curr->data;
}
