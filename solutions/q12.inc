void AIntList::Remove(int pos) {
  if (pos < 0 || pos >= listSize) return;
  for (int i = pos; i < listSize - 1; ++i) {
    listArray[i] = listArray[i + 1];
  }
  --listSize;
}

int AIntList::FindKth(int k) const {
  return (k < 0 || k > listSize - 1) ? 0 : listArray[k];
}
