template <typename T>
class CQueue {
 private:
  T* data;
  size_t capacity;
  size_t front;  // index of the front element
  size_t back;   // index of the last element
  size_t size;

 public:
  CQueue(size_t maxSize)
      : data(new T[maxSize]()), capacity(maxSize), front(0), back(maxSize - 1), size(0) {}
  ~CQueue() { delete[] data; }

  size_t Size() const { return size; }

  T Peek() const {
    if (size == 0) throw out_of_range("Queue is empty");
    return data[front];
  }

  void Enqueue(const T& value) {
    if (size == capacity) throw overflow_error("Queue is full");
    back = (back + 1) % capacity;
    data[back] = value;
    ++size;
  }

  T Dequeue() {
    if (size == 0) throw out_of_range("Queue is empty");
    T value = data[front];
    front = (front + 1) % capacity;
    --size;
    return value;
  }
};
