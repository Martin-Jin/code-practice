int SinglyLinkedList::Head() const {
  if (head == nullptr) {
    cout << "List is empty" << endl;
    return -1;
  }
  return head->data;
}

int SinglyLinkedList::Tail() const {
  if (tail == nullptr) {
    cout << "List is empty" << endl;
    return -1;
  }
  return tail->data;
}
