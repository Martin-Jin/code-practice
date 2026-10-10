void SinglyLinkedList::Print() const {
  cout << "List:";
  if (head == nullptr) cout << " empty";
  for (Node* cur = head; cur != nullptr; cur = cur->next) {
    cout << (cur == head ? " " : " -> ") << cur->data;
  }
  cout << endl;
}
