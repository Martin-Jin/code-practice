void SinglyLinkedList::PrintReverse(Node* node) const {
  if (node == nullptr) return;     // base case: past the end of the list
  PrintReverse(node->next);        // everything after this node comes first
  cout << node->data;
  if (node != head) cout << " -> ";  // the head is printed last, so no arrow
}

void SinglyLinkedList::PrintReverse() const {
  cout << "Reversed: ";
  if (head == nullptr) {
    cout << "empty";
  } else {
    PrintReverse(head);
  }
  cout << endl;
}
