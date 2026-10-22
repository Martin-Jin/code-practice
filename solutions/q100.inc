// ===== PART 1: singly linked list =====
sll::List::~List() {
  while (head_ != nullptr) {
    Node* next = head_->next;  // save it BEFORE deleting
    delete head_;
    head_ = next;
  }
  size_ = 0;
}

void sll::List::PushFront(const int& v) {
  Node* node = new Node(v);
  node->next = head_;  // link the new node first...
  head_ = node;        // ...then move head_
  ++size_;
}

void sll::List::PushBack(const int& v) {
  Node* node = new Node(v);
  if (head_ == nullptr) {
    head_ = node;
  } else {
    Node* cur = head_;
    while (cur->next != nullptr) cur = cur->next;  // stop ON the last node
    cur->next = node;
  }
  ++size_;
}

bool sll::List::InsertAt(int index, const int& v) {
  if (index < 0 || index > size_) return false;
  if (index == 0) {
    PushFront(v);
    return true;
  }
  Node* prev = head_;
  for (int i = 0; i < index - 1; ++i) prev = prev->next;  // node BEFORE the gap
  Node* node = new Node(v);
  node->next = prev->next;  // new node takes over the rest of the list first
  prev->next = node;
  ++size_;
  return true;
}

bool sll::List::Remove(const int& v) {
  if (head_ == nullptr) return false;
  Node* doomed = nullptr;
  if (head_->data == v) {
    doomed = head_;
    head_ = head_->next;
  } else {
    Node* prev = head_;
    while (prev->next != nullptr && prev->next->data != v) prev = prev->next;
    if (prev->next == nullptr) return false;  // not found
    doomed = prev->next;
    prev->next = doomed->next;  // bypass the doomed node
  }
  delete doomed;
  --size_;
  return true;
}

void sll::List::Reverse() {
  Node* prev = nullptr;
  Node* cur = head_;
  while (cur != nullptr) {
    Node* next = cur->next;  // 1. remember the rest
    cur->next = prev;        // 2. flip this link
    prev = cur;              // 3. step prev forward
    cur = next;              // 4. step cur forward
  }
  head_ = prev;
}

// ===== PART 2: doubly linked list =====
dll::List::~List() {
  while (head_ != nullptr) {
    Node* next = head_->next;
    delete head_;
    head_ = next;
  }
  tail_ = nullptr;
  size_ = 0;
}

void dll::List::PushFront(const int& v) {
  Node* node = new Node(v);
  node->next = head_;
  if (head_ != nullptr) {
    head_->prev = node;
  } else {
    tail_ = node;  // first node is also the tail
  }
  head_ = node;
  ++size_;
}

void dll::List::PushBack(const int& v) {
  Node* node = new Node(v);
  node->prev = tail_;
  if (tail_ != nullptr) {
    tail_->next = node;
  } else {
    head_ = node;  // first node is also the head
  }
  tail_ = node;
  ++size_;
}

bool dll::List::Remove(const int& v) {
  Node* cur = head_;
  while (cur != nullptr && cur->data != v) cur = cur->next;
  if (cur == nullptr) return false;
  if (cur->prev != nullptr) {
    cur->prev->next = cur->next;
  } else {
    head_ = cur->next;  // removing the head
  }
  if (cur->next != nullptr) {
    cur->next->prev = cur->prev;
  } else {
    tail_ = cur->prev;  // removing the tail
  }
  delete cur;
  --size_;
  return true;
}

// ===== PART 3: stack on a linked list =====
stk::LStack::~LStack() {
  while (top_ != nullptr) {
    Node* next = top_->next;
    delete top_;
    top_ = next;
  }
  size_ = 0;
}

void stk::LStack::Push(const int& v) {
  Node* node = new Node(v);
  node->next = top_;
  top_ = node;
  ++size_;
}

bool stk::LStack::Pop(int& out) {
  if (top_ == nullptr) return false;
  out = top_->data;
  Node* doomed = top_;
  top_ = top_->next;
  delete doomed;
  --size_;
  return true;
}

bool stk::LStack::Peek(int& out) const {
  if (top_ == nullptr) return false;
  out = top_->data;
  return true;
}

// ===== PART 4: circular queue =====
que::CQueue::CQueue(int capacity) : data_(nullptr), cap_(capacity), head_(0), count_(0) {
  data_ = new int[cap_];
}

que::CQueue::~CQueue() { delete[] data_; }

bool que::CQueue::Enqueue(const int& v) {
  if (count_ == cap_) return false;
  data_[(head_ + count_) % cap_] = v;  // first free slot, wrapping round
  ++count_;
  return true;
}

bool que::CQueue::Dequeue(int& out) {
  if (count_ == 0) return false;
  out = data_[head_];
  head_ = (head_ + 1) % cap_;
  --count_;
  return true;
}

bool que::CQueue::Peek(int& out) const {
  if (count_ == 0) return false;
  out = data_[head_];
  return true;
}

// ===== PART 5: binary search tree =====
bst::Node* bst::Insert(Node* n, const int& v) {
  if (n == nullptr) return new Node(v);  // found the empty spot
  if (v < n->data) {
    n->left = Insert(n->left, v);
  } else if (v > n->data) {
    n->right = Insert(n->right, v);
  }  // v == n->data: duplicate, ignore
  return n;
}

bool bst::Contains(const Node* n, const int& v) {
  if (n == nullptr) return false;
  if (v == n->data) return true;
  return v < n->data ? Contains(n->left, v) : Contains(n->right, v);
}

int bst::Height(const Node* n) {
  if (n == nullptr) return -1;
  return 1 + max(Height(n->left), Height(n->right));
}

bst::Node* bst::FindMin(Node* n) {
  if (n == nullptr) return nullptr;
  while (n->left != nullptr) n = n->left;
  return n;
}

bst::Node* bst::Remove(Node* n, const int& v) {
  if (n == nullptr) return nullptr;
  if (v < n->data) {
    n->left = Remove(n->left, v);
  } else if (v > n->data) {
    n->right = Remove(n->right, v);
  } else if (n->left == nullptr && n->right == nullptr) {
    delete n;  // leaf
    return nullptr;
  } else if (n->left == nullptr || n->right == nullptr) {
    Node* child = n->left != nullptr ? n->left : n->right;  // one child
    delete n;
    return child;
  } else {
    Node* successor = FindMin(n->right);  // two children
    n->data = successor->data;
    n->right = Remove(n->right, successor->data);
  }
  return n;
}

void bst::InOrder(const Node* n, vector<int>& out) {
  if (n == nullptr) return;
  InOrder(n->left, out);
  out.push_back(n->data);
  InOrder(n->right, out);
}

void bst::Destroy(Node* n) {
  if (n == nullptr) return;
  Destroy(n->left);  // children first (post-order), then this node
  Destroy(n->right);
  delete n;
}

// ===== PART 6: AVL tree =====
int avl::Height(const Node* n) { return n == nullptr ? -1 : n->height; }

int avl::Balance(const Node* n) { return n == nullptr ? 0 : Height(n->left) - Height(n->right); }

void avl::UpdateHeight(Node* n) {
  if (n != nullptr) n->height = 1 + max(Height(n->left), Height(n->right));
}

avl::Node* avl::RotateRight(Node* k2) {
  Node* k1 = k2->left;
  k2->left = k1->right;  // k1's right subtree moves across
  k1->right = k2;
  UpdateHeight(k2);  // lower node first
  UpdateHeight(k1);
  return k1;
}

avl::Node* avl::RotateLeft(Node* k1) {
  Node* k2 = k1->right;
  k1->right = k2->left;
  k2->left = k1;
  UpdateHeight(k1);
  UpdateHeight(k2);
  return k2;
}

avl::Node* avl::Rebalance(Node* n) {
  if (n == nullptr) return nullptr;
  int balance = Balance(n);
  if (balance > 1) {                                    // left heavy
    if (Balance(n->left) < 0) n->left = RotateLeft(n->left);  // left-right case
    return RotateRight(n);
  }
  if (balance < -1) {                                    // right heavy
    if (Balance(n->right) > 0) n->right = RotateRight(n->right);  // right-left case
    return RotateLeft(n);
  }
  return n;
}

avl::Node* avl::Insert(Node* n, const int& v) {
  if (n == nullptr) return new Node(v);
  if (v < n->data) {
    n->left = Insert(n->left, v);
  } else if (v > n->data) {
    n->right = Insert(n->right, v);
  } else {
    return n;
  }
  UpdateHeight(n);
  return Rebalance(n);
}

// ===== PART 7: complex arithmetic =====
cd Multiply(const cd& a, const cd& b) {
  return cd(a.real() * b.real() - a.imag() * b.imag(), a.real() * b.imag() + a.imag() * b.real());
}

cd Conjugate(const cd& z) { return cd(z.real(), -z.imag()); }

double Magnitude(const cd& z) { return sqrt(z.real() * z.real() + z.imag() * z.imag()); }

double Phase(const cd& z) { return atan2(z.imag(), z.real()); }

cd Divide(const cd& a, const cd& b) {
  double denom = b.real() * b.real() + b.imag() * b.imag();  // |b|^2
  if (denom == 0.0) return cd(0, 0);
  cd top = Multiply(a, Conjugate(b));
  return cd(top.real() / denom, top.imag() / denom);
}

cd Twiddle(int k, int N) { return polar(1.0, -2.0 * M_PI * k / N); }

// ===== PART 8: naive DFT and inverse DFT =====
void NaiveDft(const cd* x, cd* X, int N) {
  for (int k = 0; k < N; ++k) {
    cd sum(0, 0);
    for (int n = 0; n < N; ++n) sum += x[n] * polar(1.0, -2.0 * M_PI * k * n / N);
    X[k] = sum / static_cast<double>(N);  // forward transform carries the 1/N
  }
}

void NaiveIdft(const cd* X, cd* x, int N) {
  for (int n = 0; n < N; ++n) {
    cd sum(0, 0);
    for (int k = 0; k < N; ++k) sum += X[k] * polar(1.0, 2.0 * M_PI * k * n / N);  // +sign, no 1/N
    x[n] = sum;
  }
}

// ===== PART 9: FFT =====
bool IsPowerOfTwo(int N) { return N > 0 && (N & (N - 1)) == 0; }

void ditfft2(const cd* x, cd* X, int N, int s) {
  if (N == 1) {
    X[0] = x[0];
    return;
  }
  ditfft2(x, X, N / 2, 2 * s);              // even samples -> X[0 .. N/2-1]
  ditfft2(x + s, X + N / 2, N / 2, 2 * s);  // odd samples  -> X[N/2 .. N-1]
  for (int k = 0; k < N / 2; ++k) {
    cd p = X[k];
    cd q = polar(1.0, -2.0 * M_PI * k / N) * X[k + N / 2];
    X[k] = p + q;
    X[k + N / 2] = p - q;
  }
}

void Ifft(const cd* X, cd* x, int N) {
  if (N <= 0) return;
  vector<cd> flipped(N);
  for (int k = 0; k < N; ++k) flipped[k] = conj(X[k]);  // conj the input...
  ditfft2(flipped.data(), x, N, 1);                      // ...run the forward FFT...
  for (int n = 0; n < N; ++n) x[n] = conj(x[n]);         // ...conj the output
}

// ===== PART 10: strategy pattern =====
class LinearSearch : public SearchStrategy {
 public:
  int Search(const vector<int>& data, int target) const override {
    for (size_t i = 0; i < data.size(); ++i) {
      if (data[i] == target) return static_cast<int>(i);
    }
    return -1;
  }
};

class BinarySearch : public SearchStrategy {
 public:
  int Search(const vector<int>& data, int target) const override {
    int low = 0;
    int high = static_cast<int>(data.size()) - 1;
    while (low <= high) {
      int mid = low + (high - low) / 2;
      if (data[mid] == target) return mid;
      if (data[mid] < target) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return -1;
  }
};

class Searcher {
 public:
  Searcher() : strategy_(nullptr) {}
  void SetStrategy(SearchStrategy* strategy) { strategy_ = strategy; }
  int Find(const vector<int>& data, int target) const {
    if (strategy_ == nullptr) return -1;
    return strategy_->Search(data, target);
  }

 private:
  SearchStrategy* strategy_;  // non-owning
};

// ===== PART 11: recursion =====
int Gcd(int a, int b) {
  if (b == 0) return a;
  return Gcd(b, a % b);
}

long long Power(long long base, int exp) {
  if (exp == 0) return 1;
  long long half = Power(base, exp / 2);
  return exp % 2 == 0 ? half * half : half * half * base;
}

void Hanoi(int n, char from, char to, char via) {
  if (n == 0) return;
  Hanoi(n - 1, from, via, to);
  cout << "Move disk " << n << " from " << from << " to " << to << endl;
  Hanoi(n - 1, via, to, from);
}
