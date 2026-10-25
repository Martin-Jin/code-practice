template <typename T>
T CQueue<T>::Peek() const {
  if (size == 0) throw out_of_range("Queue is empty");
  return data[front];
}

template <typename T>
T CQueue<T>::Dequeue() {
  if (size == 0) throw out_of_range("Queue is empty");
  T value = data[front];
  front = (front + 1) % capacity;
  --size;
  return value;
}
