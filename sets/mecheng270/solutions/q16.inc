template <typename T>
CQueue<T>::CQueue(size_t maxSize)
    : data(new T[maxSize]), capacity(maxSize), front(0), back(maxSize - 1), size(0) {}

template <typename T>
void CQueue<T>::Enqueue(const T& value) {
  if (size == capacity) throw overflow_error("Queue is full");
  back = (back + 1) % capacity;
  data[back] = value;
  ++size;
}
