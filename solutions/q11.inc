void AIntList::Insert(int pos, int value) {
  if (pos < 0 || pos > listSize || listSize >= maxSize) return;
  for (int i = listSize; i > pos; --i) {
    listArray[i] = listArray[i - 1];
  }
  listArray[pos] = value;
  ++listSize;
}
