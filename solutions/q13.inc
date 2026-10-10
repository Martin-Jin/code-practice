template <typename T>
T LStack<T>::Top() {
  return list.Head();
}

template <typename T>
void LStack<T>::Push(const T& value) {
  list.Insert(0, value);
}

template <typename T>
T LStack<T>::Pop() {
  T t = Top();
  list.Remove(0);
  return t;
}
