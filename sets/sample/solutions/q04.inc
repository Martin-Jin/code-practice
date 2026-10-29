int Length(const Node* head) {
  int count = 0;
  for (const Node* n = head; n != nullptr; n = n->next) ++count;
  return count;
}

void Prepend(Node*& head, int value) {
  head = new Node{value, head};
}
