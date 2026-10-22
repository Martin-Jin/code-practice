// ============================================================================
// Question 100  (50 marks)  -  Quick revision: implement every data structure
// Topic: Whole-course revision (lists, stack, queue, BST, AVL, complex
//        arithmetic, DFT/FFT, Strategy pattern, recursion)
//
// Requirements for Quick revision: implement every data structure
//
// This is one big guided question made of 11 independent parts. Every part
// gives you the class or declaration to implement and a numbered recipe in the
// comments of the stub: follow the steps in order and you have a working
// version. Parts do not depend on each other, so do them in any order.
//
//   Part  1  Singly linked list   ~List, PushFront, PushBack, InsertAt, Remove, Reverse
//   Part  2  Doubly linked list   ~List, PushFront, PushBack, Remove
//   Part  3  Stack (linked list)  ~LStack, Push, Pop, Peek
//   Part  4  Circular queue       constructor, ~CQueue, Enqueue, Dequeue, Peek
//   Part  5  Binary search tree   Insert, Contains, Height, FindMin, Remove, InOrder, Destroy
//   Part  6  AVL tree             Height, Balance, UpdateHeight, rotations, Rebalance, Insert
//   Part  7  Complex arithmetic   Multiply, Conjugate, Magnitude, Phase, Divide, Twiddle
//   Part  8  DFT                  NaiveDft, NaiveIdft
//   Part  9  FFT                  IsPowerOfTwo, ditfft2, Ifft
//   Part 10  Strategy pattern     LinearSearch, BinarySearch, Searcher
//   Part 11  Recursion            Gcd, Power, Hanoi
//
// Task
// Implement every function / class marked in the stub. Do not change the
// PROVIDED CODE. Member functions are defined outside their class, as in the
// course exams (for example  void sll::List::PushFront(const int& v) { ... }).
//
// Note: there are 29 visible test cases and 11 hidden test cases
// (every part has at least two visible tests and one hidden test).
// ============================================================================
#include <algorithm>

#include "../framework/test_framework.h"

namespace q100 {
using namespace std;
typedef complex<double> cd;

// ------------------------- PROVIDED CODE (do not edit) -----------------------

// ---- Part 1: singly linked list ----
// Nodes count themselves in Node::alive so the tests can detect leaks.
namespace sll {
struct Node {
  int data;
  Node* next;
  explicit Node(const int& v) : data(v), next(nullptr) { ++alive; }
  ~Node() { --alive; }
  static inline int alive = 0;
};

class List {
 public:
  List() : head_(nullptr), size_(0) {}
  ~List();  // delete every node
  List(const List&) = delete;
  List& operator=(const List&) = delete;

  void PushFront(const int& v);          // add at the front
  void PushBack(const int& v);           // add at the back
  bool InsertAt(int index, const int& v);  // insert so v ends up at position index
                                          // (0..Size() allowed); false if out of range
  bool Remove(const int& v);             // remove the FIRST node holding v; false if absent
  void Reverse();                        // reverse the list in place (relink, no new nodes)

  int Size() const { return size_; }
  vector<int> ToVector() const {
    vector<int> out;
    for (const Node* c = head_; c != nullptr && out.size() < 1000; c = c->next) out.push_back(c->data);
    return out;
  }

 private:
  Node* head_;
  int size_;
};
}  // namespace sll

// ---- Part 2: doubly linked list ----
namespace dll {
struct Node {
  int data;
  Node* prev;
  Node* next;
  explicit Node(const int& v) : data(v), prev(nullptr), next(nullptr) { ++alive; }
  ~Node() { --alive; }
  static inline int alive = 0;
};

class List {
 public:
  List() : head_(nullptr), tail_(nullptr), size_(0) {}
  ~List();
  List(const List&) = delete;
  List& operator=(const List&) = delete;

  void PushFront(const int& v);
  void PushBack(const int& v);
  bool Remove(const int& v);  // remove the first node holding v; false if absent

  int Size() const { return size_; }
  vector<int> ToVector() const {  // walks head -> tail using next
    vector<int> out;
    for (const Node* c = head_; c != nullptr && out.size() < 1000; c = c->next) out.push_back(c->data);
    return out;
  }
  vector<int> ToVectorReverse() const {  // walks tail -> head using prev
    vector<int> out;
    for (const Node* c = tail_; c != nullptr && out.size() < 1000; c = c->prev) out.push_back(c->data);
    return out;
  }

 private:
  Node* head_;
  Node* tail_;
  int size_;
};
}  // namespace dll

// ---- Part 3: stack on a linked list ----
namespace stk {
struct Node {
  int data;
  Node* next;
  explicit Node(const int& v) : data(v), next(nullptr) { ++alive; }
  ~Node() { --alive; }
  static inline int alive = 0;
};

class LStack {
 public:
  LStack() : top_(nullptr), size_(0) {}
  ~LStack();
  LStack(const LStack&) = delete;
  LStack& operator=(const LStack&) = delete;

  void Push(const int& v);
  bool Pop(int& out);          // removes the top into out; false if empty
  bool Peek(int& out) const;   // copies the top into out without removing; false if empty

  int Size() const { return size_; }
  bool Empty() const { return top_ == nullptr; }

 private:
  Node* top_;
  int size_;
};
}  // namespace stk

// ---- Part 4: circular queue ----
namespace que {
class CQueue {
 public:
  explicit CQueue(int capacity);  // capacity >= 1
  ~CQueue();
  CQueue(const CQueue&) = delete;
  CQueue& operator=(const CQueue&) = delete;

  bool Enqueue(const int& v);  // false if full
  bool Dequeue(int& out);      // false if empty
  bool Peek(int& out) const;   // false if empty

  int Size() const { return count_; }
  int Capacity() const { return cap_; }

 private:
  int* data_;
  int cap_;
  int head_;   // index of the front element
  int count_;  // number of stored elements
};
}  // namespace que

// ---- Part 5: binary search tree (no duplicates) ----
namespace bst {
struct Node {
  int data;
  Node* left;
  Node* right;
  explicit Node(const int& v) : data(v), left(nullptr), right(nullptr) { ++alive; }
  ~Node() { --alive; }
  static inline int alive = 0;
};

Node* Insert(Node* n, const int& v);          // returns the new root of this subtree; ignores duplicates
bool Contains(const Node* n, const int& v);
int Height(const Node* n);                    // empty tree = -1, single node = 0
Node* FindMin(Node* n);                       // leftmost node; nullptr for an empty tree
Node* Remove(Node* n, const int& v);          // returns the new root of this subtree
void InOrder(const Node* n, vector<int>& out);  // append values in ascending order
void Destroy(Node* n);                        // delete every node
}  // namespace bst

// ---- Part 6: AVL tree ----
namespace avl {
struct Node {
  int data;
  Node* left;
  Node* right;
  int height;  // cached: leaf = 0
  explicit Node(const int& v) : data(v), left(nullptr), right(nullptr), height(0) { ++alive; }
  ~Node() { --alive; }
  static inline int alive = 0;
};

int Height(const Node* n);       // nullptr = -1, otherwise the cached height
int Balance(const Node* n);      // Height(left) - Height(right); nullptr = 0
void UpdateHeight(Node* n);      // recompute n->height from its children
Node* RotateRight(Node* k2);     // k2->left becomes the subtree root; returns it
Node* RotateLeft(Node* k1);      // k1->right becomes the subtree root; returns it
Node* Rebalance(Node* n);        // fix n if |Balance| > 1 (single or double rotation)
Node* Insert(Node* n, const int& v);  // BST insert + UpdateHeight + Rebalance on the way up

inline void Destroy(Node* n) {
  if (n == nullptr) return;
  Destroy(n->left);
  Destroy(n->right);
  delete n;
}
}  // namespace avl

// ---- Part 7: complex arithmetic (use only real(), imag(), sqrt, atan2, polar) ----
cd Multiply(const cd& a, const cd& b);   // (a+bi)(c+di), WITHOUT using operator*
cd Conjugate(const cd& z);               // a - bi
double Magnitude(const cd& z);           // |z|
double Phase(const cd& z);               // arg(z) in (-pi, pi]
cd Divide(const cd& a, const cd& b);     // a / b; returns 0 if b == 0
cd Twiddle(int k, int N);                // W_N^k = e^(-i*2*pi*k/N)

// ---- Part 8: DFT (course convention: forward carries 1/N, inverse has none) ----
void NaiveDft(const cd* x, cd* X, int N);   // X_k = (1/N) sum_n x_n e^(-i2pi kn/N)
void NaiveIdft(const cd* X, cd* x, int N);  // x_n = sum_k X_k e^(+i2pi kn/N)

// ---- Part 9: FFT ----
bool IsPowerOfTwo(int N);
void ditfft2(const cd* x, cd* X, int N, int s);  // unnormalised radix-2 FFT, x read with stride s
void Ifft(const cd* X, cd* x, int N);            // inverse of Fft() below, built on ditfft2

// Normalised FFT: matches NaiveDft.
void Fft(const vector<cd>& x, vector<cd>& X) {
  int N = static_cast<int>(x.size());
  X.assign(N, cd(0, 0));
  ditfft2(x.data(), X.data(), N, 1);
  for (int k = 0; k < N; ++k) X[k] /= N;
}

// ---- Part 10: Strategy pattern ----
class SearchStrategy {
 public:
  virtual ~SearchStrategy() {}
  // Index of target in data, or -1 if absent.
  virtual int Search(const vector<int>& data, int target) const = 0;
};

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
// ===== PART 1: singly linked list =====
// Recipe: always (a) make/locate the nodes, (b) link the NEW node first,
// (c) only then move the existing pointer. Update size_ last.

sll::List::~List() {
  // 1. while head_ is not nullptr:
  // 2.   save head_->next in a temporary, delete head_, set head_ to the saved pointer.
  // 3. size_ = 0.
}

void sll::List::PushFront(const int& v) {
  // 1. Node* node = new Node(v);
  // 2. node->next = head_;   (link BEFORE moving head_)
  // 3. head_ = node;
  // 4. ++size_;
}

void sll::List::PushBack(const int& v) {
  // 1. Node* node = new Node(v);
  // 2. Empty list (head_ == nullptr)? head_ = node.
  // 3. Otherwise walk cur from head_ while cur->next != nullptr (stop ON the last node),
  //    then cur->next = node.
  // 4. ++size_;
}

bool sll::List::InsertAt(int index, const int& v) {
  // 1. index < 0 or index > size_  ->  return false.
  // 2. index == 0  ->  PushFront(v) and return true.
  // 3. Walk prev from head_ index-1 steps: prev is the node BEFORE the gap.
  // 4. node = new Node(v); node->next = prev->next; prev->next = node;  (this order!)
  // 5. ++size_; return true.
  return false;
}

bool sll::List::Remove(const int& v) {
  // 1. Empty list -> return false.
  // 2. Head holds v: doomed = head_; head_ = head_->next.
  // 3. Otherwise walk prev while prev->next != nullptr && prev->next->data != v.
  //    prev->next == nullptr -> not found, return false.
  //    Else doomed = prev->next; prev->next = doomed->next  (bypass it).
  // 4. delete doomed; --size_; return true.
  return false;
}

void sll::List::Reverse() {
  // Keep three pointers: prev = nullptr, cur = head_.
  // While cur != nullptr:
  //   1. Node* next = cur->next;   (remember the rest)
  //   2. cur->next = prev;         (flip the link)
  //   3. prev = cur;  4. cur = next;
  // Finally head_ = prev.
}

// ===== PART 2: doubly linked list =====
// Recipe: every insert/remove touches TWO links (next and prev) and may touch
// head_ and/or tail_. An empty list has head_ == tail_ == nullptr.

dll::List::~List() {
  // Same as the singly linked list, plus tail_ = nullptr and size_ = 0.
}

void dll::List::PushFront(const int& v) {
  // 1. node = new Node(v); node->next = head_;
  // 2. head_ != nullptr ? head_->prev = node : (list was empty) tail_ = node;
  // 3. head_ = node; ++size_;
}

void dll::List::PushBack(const int& v) {
  // Mirror image of PushFront: node->prev = tail_;
  // tail_ != nullptr ? tail_->next = node : head_ = node;  then tail_ = node; ++size_;
}

bool dll::List::Remove(const int& v) {
  // 1. Walk cur from head_ until cur == nullptr or cur->data == v. nullptr -> return false.
  // 2. Left side:  cur->prev != nullptr ? cur->prev->next = cur->next : head_ = cur->next;
  // 3. Right side: cur->next != nullptr ? cur->next->prev = cur->prev : tail_ = cur->prev;
  // 4. delete cur; --size_; return true.
  return false;
}

// ===== PART 3: stack on a linked list =====
// Recipe: the stack is a singly linked list that only ever changes at the front.
// top_ is the head: Push = PushFront, Pop = remove front.

stk::LStack::~LStack() {
  // Delete every node from top_ down (save next, delete, move on). size_ = 0.
}

void stk::LStack::Push(const int& v) {
  // node = new Node(v); node->next = top_; top_ = node; ++size_;
}

bool stk::LStack::Pop(int& out) {
  // 1. top_ == nullptr -> return false.
  // 2. out = top_->data; doomed = top_; top_ = top_->next; delete doomed; --size_;
  // 3. return true.
  return false;
}

bool stk::LStack::Peek(int& out) const {
  // Like Pop but do not remove anything: false if empty, else out = top_->data; true.
  return false;
}

// ===== PART 4: circular queue =====
// Recipe: a fixed array plus head_ (front index) and count_. The back slot is
// (head_ + count_) % cap_; the % makes indices wrap round the end of the array.

que::CQueue::CQueue(int capacity) : data_(nullptr), cap_(0), head_(0), count_(0) {
  // 1. cap_ = capacity;
  // 2. data_ = new int[cap_];
}

que::CQueue::~CQueue() {
  // delete[] data_;
}

bool que::CQueue::Enqueue(const int& v) {
  // 1. count_ == cap_ -> return false (full).
  // 2. data_[(head_ + count_) % cap_] = v;
  // 3. ++count_; return true.
  return false;
}

bool que::CQueue::Dequeue(int& out) {
  // 1. count_ == 0 -> return false (empty).
  // 2. out = data_[head_];
  // 3. head_ = (head_ + 1) % cap_;  --count_;  return true.
  return false;
}

bool que::CQueue::Peek(int& out) const {
  // Like Dequeue without moving head_ or changing count_.
  return false;
}

// ===== PART 5: binary search tree =====
// Recipe: every function is "base case on nullptr, otherwise compare with
// n->data and recurse left or right". Functions that change the tree return
// the subtree root and the caller stores it:  n->left = Insert(n->left, v);

bst::Node* bst::Insert(Node* n, const int& v) {
  // 1. n == nullptr -> return new Node(v).
  // 2. v < n->data: n->left = Insert(n->left, v);  v > n->data: n->right = Insert(n->right, v);
  //    (equal: do nothing)
  // 3. return n;
  return n;
}

bool bst::Contains(const Node* n, const int& v) {
  // nullptr -> false; equal -> true; otherwise search left (v smaller) or right (v larger).
  return false;
}

int bst::Height(const Node* n) {
  // nullptr -> -1;  otherwise 1 + max(Height(left), Height(right)).
  return 0;
}

bst::Node* bst::FindMin(Node* n) {
  // nullptr -> nullptr. Otherwise keep going to n->left while it exists; return that node.
  return nullptr;
}

bst::Node* bst::Remove(Node* n, const int& v) {
  // 1. n == nullptr -> return nullptr.
  // 2. v < n->data: n->left = Remove(n->left, v);  v > n->data: n->right = Remove(n->right, v);
  // 3. Found it (v == n->data), three cases:
  //    a. no children: delete n; return nullptr;
  //    b. one child:   child = the non-null one; delete n; return child;
  //    c. two children: s = FindMin(n->right) (in-order successor);
  //       n->data = s->data; n->right = Remove(n->right, s->data);
  // 4. return n;
  return n;
}

void bst::InOrder(const Node* n, vector<int>& out) {
  // In-order = left, then this node, then right (gives ascending order).
}

void bst::Destroy(Node* n) {
  // Post-order: Destroy(left), Destroy(right), then delete n. nullptr -> return.
}

// ===== PART 6: AVL tree =====
// Recipe: an AVL tree is a BST that fixes itself on the way back up the
// recursion. Height(nullptr) = -1. Balance = Height(left) - Height(right).
// Fix when Balance > 1 (left heavy) or < -1 (right heavy).

int avl::Height(const Node* n) {
  // nullptr -> -1, otherwise n->height.
  return 0;
}

int avl::Balance(const Node* n) {
  // nullptr -> 0, otherwise Height(n->left) - Height(n->right).
  return 0;
}

void avl::UpdateHeight(Node* n) {
  // if n != nullptr: n->height = 1 + max(Height(n->left), Height(n->right));
}

avl::Node* avl::RotateRight(Node* k2) {
  // k2 is the unbalanced node, k1 = k2->left rises to the top.
  // 1. k1 = k2->left;
  // 2. k2->left = k1->right;   (k1's right subtree moves across)
  // 3. k1->right = k2;
  // 4. UpdateHeight(k2) FIRST (it is now lower), then UpdateHeight(k1).
  // 5. return k1;
  return k2;
}

avl::Node* avl::RotateLeft(Node* k1) {
  // Mirror image: k2 = k1->right; k1->right = k2->left; k2->left = k1;
  // UpdateHeight(k1), UpdateHeight(k2); return k2;
  return k1;
}

avl::Node* avl::Rebalance(Node* n) {
  // 1. n == nullptr -> return nullptr. balance = Balance(n).
  // 2. balance > 1 (left heavy):
  //      if Balance(n->left) < 0 (left-right case): n->left = RotateLeft(n->left);
  //      return RotateRight(n);
  // 3. balance < -1 (right heavy):
  //      if Balance(n->right) > 0 (right-left case): n->right = RotateRight(n->right);
  //      return RotateLeft(n);
  // 4. otherwise return n.
  return n;
}

avl::Node* avl::Insert(Node* n, const int& v) {
  // 1. n == nullptr -> return new Node(v).
  // 2. Recurse left/right exactly like the BST (duplicates: return n unchanged).
  // 3. UpdateHeight(n);
  // 4. return Rebalance(n);
  return n;
}

// ===== PART 7: complex arithmetic =====
// Recipe: z = a + bi  ->  z.real() = a, z.imag() = b.
//   (a+bi)(c+di) = (ac - bd) + (ad + bc)i      conj(a+bi) = a - bi
//   |z| = sqrt(a^2 + b^2)                      arg(z) = atan2(b, a)   (y first!)
//   z1 / z2 = z1 * conj(z2) / |z2|^2           W_N^k = polar(1.0, -2*pi*k/N)

cd Multiply(const cd& a, const cd& b) {
  // return cd(real part, imag part) using the formula above.
  return cd(0, 0);
}

cd Conjugate(const cd& z) {
  return cd(0, 0);
}

double Magnitude(const cd& z) {
  return 0.0;
}

double Phase(const cd& z) {
  return 0.0;
}

cd Divide(const cd& a, const cd& b) {
  // 1. denom = b.real()^2 + b.imag()^2; denom == 0 -> return cd(0, 0).
  // 2. top = Multiply(a, Conjugate(b));
  // 3. return cd(top.real() / denom, top.imag() / denom);
  return cd(0, 0);
}

cd Twiddle(int k, int N) {
  return cd(0, 0);
}

// ===== PART 8: DFT =====
// Recipe: two nested loops. Outer loop = output bin k, inner loop = input
// sample n. Accumulate  x[n] * polar(1.0, -2*pi*k*n/N)  into a sum starting at
// 0, then divide by N for the forward transform. The inverse flips the sign of
// the exponent and has NO 1/N.

void NaiveDft(const cd* x, cd* X, int N) {
  // for k: sum = 0; for n: sum += x[n] * polar(1.0, -2.0 * M_PI * k * n / N);
  //        X[k] = sum / double(N);
}

void NaiveIdft(const cd* X, cd* x, int N) {
  // for n: sum = 0; for k: sum += X[k] * polar(1.0, +2.0 * M_PI * k * n / N);
  //        x[n] = sum;   (no division)
}

// ===== PART 9: FFT =====
// Recipe (decimation in time): split into even and odd samples, transform
// each half recursively, then combine with "butterflies" using twiddle factors.
// x is read with stride s (x[0], x[s], x[2s], ...); results go contiguously to X.

bool IsPowerOfTwo(int N) {
  // A positive power of two has exactly one bit set: N > 0 && (N & (N - 1)) == 0.
  return false;
}

void ditfft2(const cd* x, cd* X, int N, int s) {
  // 1. Base case N == 1: X[0] = x[0]; return.
  // 2. ditfft2(x,     X,         N/2, 2*s);   // even samples -> first half
  // 3. ditfft2(x + s, X + N/2,   N/2, 2*s);   // odd samples  -> second half
  // 4. for k = 0 .. N/2-1:
  //      p = X[k];  q = polar(1.0, -2*pi*k/N) * X[k + N/2];
  //      X[k] = p + q;  X[k + N/2] = p - q;
}

void Ifft(const cd* X, cd* x, int N) {
  // Inverse via the conjugate trick: x = conj( ditfft2( conj(X) ) ).
  // 1. N <= 0 -> return.
  // 2. Copy conj(X[k]) into a temporary vector<cd>.
  // 3. ditfft2(temporary.data(), x, N, 1);
  // 4. Replace every x[n] by conj(x[n]).   (no 1/N: Fft() already divided by N)
}

// ===== PART 10: Strategy pattern =====
// Recipe: the abstract SearchStrategy is the interface. Each concrete strategy
// overrides Search(). The context (Searcher) holds a NON-owning pointer to the
// current strategy and delegates to it, so strategies can be swapped at runtime.

class LinearSearch : public SearchStrategy {
 public:
  int Search(const vector<int>& data, int target) const override {
    // Check data[0], data[1], ... and return the index of the first match; else -1.
    return -1;
  }
};

class BinarySearch : public SearchStrategy {
 public:
  int Search(const vector<int>& data, int target) const override {
    // data is sorted. low = 0, high = size - 1.
    // while low <= high: mid = low + (high - low) / 2;
    //   equal -> return mid; data[mid] < target -> low = mid + 1; else high = mid - 1.
    // Not found -> -1.
    return -1;
  }
};

class Searcher {
 public:
  Searcher() : strategy_(nullptr) {}
  void SetStrategy(SearchStrategy* strategy) {
    // store the pointer
  }
  int Find(const vector<int>& data, int target) const {
    // No strategy set -> -1, otherwise delegate to strategy_->Search(data, target).
    return -1;
  }

 private:
  SearchStrategy* strategy_;
};

// ===== PART 11: recursion =====
// Recipe: (1) base case that needs no recursion, (2) a recursive call on a
// strictly smaller problem, (3) combine the result.

int Gcd(int a, int b) {
  // Euclid: Gcd(a, 0) = a;  otherwise Gcd(b, a % b).
  return 0;
}

long long Power(long long base, int exp) {
  // Fast exponentiation (exp >= 0): Power(b, 0) = 1.
  // half = Power(base, exp / 2); even exp -> half * half; odd exp -> half * half * base.
  return 0;
}

void Hanoi(int n, char from, char to, char via) {
  // Print "Move disk <k> from <X> to <Y>" lines (one per line, endl) that move n disks.
  // n == 0 -> print nothing.
  // 1. Hanoi(n - 1, from, via, to);   // clear the n-1 smaller disks out of the way
  // 2. print the move of disk n from `from` to `to`;
  // 3. Hanoi(n - 1, via, to, from);   // put the smaller disks back on top
}
#else
#include "../solutions/q100.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
namespace {
string V(const vector<int>& v) { return tf::VecStr(v); }

// ---- AVL helpers ----
// Recomputes real heights; returns -2 if any node is out of balance, has a
// wrong cached height, or the tree is implausibly deep.
int CheckAvl(const avl::Node* n, int depth = 0) {
  if (!n) return -1;
  if (depth > 40) return -2;
  int hl = CheckAvl(n->left, depth + 1), hr = CheckAvl(n->right, depth + 1);
  if (hl == -2 || hr == -2) return -2;
  if (abs(hl - hr) > 1 || n->height != 1 + max(hl, hr)) return -2;
  return n->height;
}

avl::Node* MakeAvl(int data, avl::Node* l, avl::Node* r, int height) {
  avl::Node* n = new avl::Node(data);
  n->left = l;
  n->right = r;
  n->height = height;
  return n;
}

void AvlInorder(const avl::Node* n, vector<int>& out) {
  if (!n) return;
  AvlInorder(n->left, out);
  out.push_back(n->data);
  AvlInorder(n->right, out);
}

// Inserts the values into an AVL tree and checks root, height, order and balance.
void AvlInsertAndCheck(const vector<int>& values, int root, int height, const vector<int>& inorder) {
  avl::Node* t = nullptr;
  for (int v : values) t = avl::Insert(t, v);
  tf::ExpectEq(t ? t->data : -1, root, "root value");
  tf::ExpectEq(avl::Height(t), height, "tree height");
  vector<int> got;
  AvlInorder(t, got);
  tf::ExpectEq(V(got), V(inorder), "inorder traversal");
  tf::ExpectTrue(CheckAvl(t) != -2, "every node balanced with a correct cached height");
  avl::Destroy(t);
}

// Checks root/left/right data and the root's cached height of a rebalanced subtree.
void ExpectShape(const avl::Node* n, int root, int left, int right, int height) {
  if (n == nullptr || n->left == nullptr || n->right == nullptr) {
    tf::Fail("expected a root with two children");
    return;
  }
  tf::ExpectEq(n->data, root, "new root");
  tf::ExpectEq(n->left->data, left, "left child");
  tf::ExpectEq(n->right->data, right, "right child");
  tf::ExpectEq(n->height, height, "root height");
}

// ---- BST helper ----
bst::Node* BuildBst(const vector<int>& values) {
  bst::Node* t = nullptr;
  for (int v : values) t = bst::Insert(t, v);
  return t;
}

string BstOrder(const bst::Node* t) {
  vector<int> out;
  bst::InOrder(t, out);
  return V(out);
}

// ---- DFT helpers (reference implementation independent of Part 8) ----
vector<cd> RefDft(const vector<cd>& x) {
  int N = static_cast<int>(x.size());
  vector<cd> X(N);
  for (int k = 0; k < N; ++k) {
    for (int n = 0; n < N; ++n) X[k] += x[n] * polar(1.0, -2.0 * M_PI * k * n / N);
    X[k] /= N;
  }
  return X;
}

vector<cd> Mixed(int N) {
  vector<cd> x(N);
  for (int n = 0; n < N; ++n) x[n] = cd(((n * 7) % 5) - 2, ((n * 3) % 4) - 1.5);
  return x;
}

void ExpectSpectrum(const vector<cd>& got, const vector<cd>& want) {
  tf::ExpectEq(got.size(), want.size(), "length");
  for (size_t k = 0; k < min(got.size(), want.size()); ++k)
    tf::ExpectComplexNear(got[k], want[k], "bin " + to_string(k), 1e-9);
}
}  // namespace

void RunQ100() {
  // ===== PART 1: singly linked list =====
  tf::Test("Part 1 SLL: PushFront / PushBack keep the right order", [] {
    sll::List l;
    l.PushBack(2);
    l.PushBack(3);
    l.PushFront(1);
    tf::ExpectEq(V(l.ToVector()), V({1, 2, 3}), "list");
    tf::ExpectEq(l.Size(), 3, "size");
  });
  tf::Test("Part 1 SLL: InsertAt head, middle, tail and out of range", [] {
    sll::List l;
    for (int v : {1, 3, 5}) l.PushBack(v);
    tf::ExpectTrue(l.InsertAt(1, 2), "insert at 1");
    tf::ExpectTrue(l.InsertAt(0, 0), "insert at head");
    tf::ExpectTrue(l.InsertAt(5, 6), "insert at tail (index == size)");
    tf::ExpectEq(V(l.ToVector()), V({0, 1, 2, 3, 5, 6}), "list");
    tf::ExpectTrue(!l.InsertAt(9, 7), "index too large");
    tf::ExpectTrue(!l.InsertAt(-1, 7), "negative index");
    tf::ExpectEq(l.Size(), 6, "size unchanged by failed inserts");
  });
  tf::Test("Part 1 SLL: Remove head, middle, tail and missing", [] {
    sll::List l;
    for (int v : {1, 2, 3, 4, 5}) l.PushBack(v);
    tf::ExpectTrue(l.Remove(1), "remove head");
    tf::ExpectTrue(l.Remove(3), "remove middle");
    tf::ExpectTrue(l.Remove(5), "remove tail");
    tf::ExpectTrue(!l.Remove(9), "remove missing");
    tf::ExpectEq(V(l.ToVector()), V({2, 4}), "list");
    tf::ExpectEq(l.Size(), 2, "size");
  });
  tf::Test("Part 1 SLL: Reverse", [] {
    sll::List l;
    for (int v : {1, 2, 3, 4}) l.PushBack(v);
    l.Reverse();
    tf::ExpectEq(V(l.ToVector()), V({4, 3, 2, 1}), "reversed");
    l.PushBack(0);  // the new tail must be correct
    tf::ExpectEq(V(l.ToVector()), V({4, 3, 2, 1, 0}), "after PushBack");
  });
  tf::HiddenTest("Part 1 SLL: edge cases and no leaks", [] {
    int before = sll::Node::alive;
    {
      sll::List e;
      e.Reverse();
      tf::ExpectTrue(!e.Remove(1), "remove from empty");
      tf::ExpectTrue(e.InsertAt(0, 7), "insert into empty at 0");
      e.Reverse();
      tf::ExpectEq(V(e.ToVector()), V({7}), "single element");
      tf::ExpectTrue(e.Remove(7), "remove only element");
      tf::ExpectEq(e.Size(), 0, "empty again");
      e.PushBack(1);
      e.PushBack(2);
      e.PushBack(2);
      e.Remove(2);  // only the first 2 goes
      tf::ExpectEq(V(e.ToVector()), V({1, 2}), "only first match removed");
    }
    tf::ExpectEq(sll::Node::alive, before, "nodes alive after the list is destroyed");
  });

  // ===== PART 2: doubly linked list =====
  tf::Test("Part 2 DLL: PushFront / PushBack link both directions", [] {
    dll::List l;
    l.PushBack(2);
    l.PushBack(3);
    l.PushFront(1);
    tf::ExpectEq(V(l.ToVector()), V({1, 2, 3}), "forward");
    tf::ExpectEq(V(l.ToVectorReverse()), V({3, 2, 1}), "backward");
    tf::ExpectEq(l.Size(), 3, "size");
  });
  tf::Test("Part 2 DLL: Remove head, middle, tail keeps both directions right", [] {
    dll::List l;
    for (int v : {1, 2, 3, 4, 5}) l.PushBack(v);
    tf::ExpectTrue(l.Remove(3), "remove middle");
    tf::ExpectEq(V(l.ToVector()), V({1, 2, 4, 5}), "forward after middle");
    tf::ExpectEq(V(l.ToVectorReverse()), V({5, 4, 2, 1}), "backward after middle");
    tf::ExpectTrue(l.Remove(1), "remove head");
    tf::ExpectTrue(l.Remove(5), "remove tail");
    tf::ExpectEq(V(l.ToVector()), V({2, 4}), "forward after ends");
    tf::ExpectEq(V(l.ToVectorReverse()), V({4, 2}), "backward after ends");
    tf::ExpectTrue(!l.Remove(42), "remove missing");
  });
  tf::Test("Part 2 DLL: emptying the list resets head and tail", [] {
    dll::List l;
    l.PushBack(1);
    tf::ExpectTrue(l.Remove(1), "remove only element");
    tf::ExpectEq(V(l.ToVector()), V({}), "forward empty");
    tf::ExpectEq(V(l.ToVectorReverse()), V({}), "backward empty");
    l.PushFront(5);
    l.PushBack(6);
    tf::ExpectEq(V(l.ToVector()), V({5, 6}), "forward after refill");
    tf::ExpectEq(V(l.ToVectorReverse()), V({6, 5}), "backward after refill");
  });
  tf::HiddenTest("Part 2 DLL: no leaks after Remove and destruction", [] {
    int before = dll::Node::alive;
    {
      dll::List l;
      for (int v : {1, 2, 3, 4}) l.PushFront(v);
      l.Remove(2);
      tf::ExpectEq(dll::Node::alive, before + 3, "Remove must delete the node");
    }
    tf::ExpectEq(dll::Node::alive, before, "nodes alive after the list is destroyed");
  });

  // ===== PART 3: stack =====
  tf::Test("Part 3 Stack: LIFO order", [] {
    stk::LStack s;
    for (int v : {1, 2, 3}) s.Push(v);
    tf::ExpectEq(s.Size(), 3, "size");
    int out = 0;
    vector<int> popped;
    while (popped.size() < 5 && s.Pop(out)) popped.push_back(out);
    tf::ExpectEq(V(popped), V({3, 2, 1}), "pop order");
    tf::ExpectTrue(s.Empty(), "empty after popping everything");
  });
  tf::Test("Part 3 Stack: Peek does not remove, Pop/Peek on empty return false", [] {
    stk::LStack s;
    int out = -99;
    tf::ExpectTrue(!s.Pop(out), "pop empty");
    tf::ExpectTrue(!s.Peek(out), "peek empty");
    tf::ExpectEq(out, -99, "out untouched when empty");
    s.Push(8);
    s.Push(9);
    tf::ExpectTrue(s.Peek(out), "peek");
    tf::ExpectEq(out, 9, "peeked value");
    tf::ExpectEq(s.Size(), 2, "size after peek");
  });
  tf::HiddenTest("Part 3 Stack: no leaks after Pop and destruction", [] {
    int before = stk::Node::alive;
    {
      stk::LStack s;
      for (int i = 0; i < 10; ++i) s.Push(i);
      int out;
      s.Pop(out);
      s.Pop(out);
      tf::ExpectEq(stk::Node::alive, before + 8, "Pop must delete the node");
      tf::ExpectEq(s.Size(), 8, "size");
    }
    tf::ExpectEq(stk::Node::alive, before, "nodes alive after the stack is destroyed");
  });

  // ===== PART 4: circular queue =====
  tf::Test("Part 4 CQueue: FIFO order and full / empty", [] {
    que::CQueue q(3);
    tf::ExpectEq(q.Capacity(), 3, "capacity");
    tf::ExpectTrue(q.Enqueue(1) && q.Enqueue(2) && q.Enqueue(3), "fill it");
    tf::ExpectTrue(!q.Enqueue(4), "enqueue when full");
    int out = 0;
    tf::ExpectTrue(q.Peek(out), "peek");
    tf::ExpectEq(out, 1, "front");
    vector<int> got;
    while (got.size() < 5 && q.Dequeue(out)) got.push_back(out);
    tf::ExpectEq(V(got), V({1, 2, 3}), "dequeue order");
    tf::ExpectTrue(!q.Dequeue(out), "dequeue when empty");
  });
  tf::Test("Part 4 CQueue: indices wrap round the end of the array", [] {
    que::CQueue q(3);
    q.Enqueue(1);
    q.Enqueue(2);
    q.Enqueue(3);
    int out = 0;
    q.Dequeue(out);
    tf::ExpectTrue(q.Enqueue(4), "enqueue into the freed slot");
    tf::ExpectEq(q.Size(), 3, "size");
    vector<int> got;
    while (got.size() < 5 && q.Dequeue(out)) got.push_back(out);
    tf::ExpectEq(V(got), V({2, 3, 4}), "order after wrap-round");
  });
  tf::HiddenTest("Part 4 CQueue: many cycles through a small queue", [] {
    que::CQueue q(4);
    int next_in = 0, next_out = 0, out = 0;
    for (int round = 0; round < 50; ++round) {
      for (int i = 0; i < 3; ++i) tf::ExpectTrue(q.Enqueue(next_in++), "enqueue");
      for (int i = 0; i < 3; ++i) {
        tf::ExpectTrue(q.Dequeue(out), "dequeue");
        tf::ExpectEq(out, next_out++, "FIFO value");
      }
    }
    tf::ExpectEq(q.Size(), 0, "empty at the end");
    que::CQueue one(1);
    tf::ExpectTrue(one.Enqueue(7) && !one.Enqueue(8), "capacity-1 queue");
  });

  // ===== PART 5: binary search tree =====
  tf::Test("Part 5 BST: Insert gives sorted in-order and ignores duplicates", [] {
    bst::Node* t = BuildBst({50, 30, 70, 20, 40, 60, 80, 30, 50});
    tf::ExpectEq(BstOrder(t), V({20, 30, 40, 50, 60, 70, 80}), "in-order");
    bst::Destroy(t);
  });
  tf::Test("Part 5 BST: Contains, Height and FindMin", [] {
    bst::Node* t = BuildBst({50, 30, 70, 20, 40, 60, 80});
    tf::ExpectTrue(bst::Contains(t, 60) && bst::Contains(t, 50), "present values");
    tf::ExpectTrue(!bst::Contains(t, 65) && !bst::Contains(nullptr, 1), "absent values");
    tf::ExpectEq(bst::Height(t), 2, "height of a perfect 7-node tree");
    tf::ExpectEq(bst::Height(nullptr), -1, "height of the empty tree");
    bst::Node* m = bst::FindMin(t);
    tf::ExpectEq(m ? m->data : -1, 20, "minimum");
    tf::ExpectTrue(bst::FindMin(nullptr) == nullptr, "FindMin of empty tree");
    bst::Destroy(t);
  });
  tf::Test("Part 5 BST: Remove a leaf, a node with one child, a node with two children", [] {
    bst::Node* t = BuildBst({50, 30, 70, 20, 40, 60, 80});
    t = bst::Remove(t, 20);  // leaf
    tf::ExpectEq(BstOrder(t), V({30, 40, 50, 60, 70, 80}), "after removing leaf 20");
    t = bst::Remove(t, 30);  // now has one child (40)
    tf::ExpectEq(BstOrder(t), V({40, 50, 60, 70, 80}), "after removing 30 (one child)");
    t = bst::Remove(t, 50);  // root with two children
    tf::ExpectEq(BstOrder(t), V({40, 60, 70, 80}), "after removing root 50 (two children)");
    tf::ExpectEq(t ? t->data : -1, 60, "root replaced by its in-order successor");
    t = bst::Remove(t, 99);
    tf::ExpectEq(BstOrder(t), V({40, 60, 70, 80}), "removing a missing value changes nothing");
    bst::Destroy(t);
  });
  tf::HiddenTest("Part 5 BST: Remove frees nodes, Destroy frees everything", [] {
    int before = bst::Node::alive;
    bst::Node* t = BuildBst({5, 3, 8, 1, 4, 7, 9});
    t = bst::Remove(t, 3);
    t = bst::Remove(t, 5);
    tf::ExpectEq(bst::Node::alive, before + 5, "Remove must delete one node each time");
    bst::Destroy(t);
    tf::ExpectEq(bst::Node::alive, before, "nodes alive after Destroy");
    bst::Node* single = bst::Remove(BuildBst({1}), 1);
    tf::ExpectTrue(single == nullptr, "removing the only node gives the empty tree");
    tf::ExpectEq(bst::Node::alive, before, "no node left");
  });

  // ===== PART 6: AVL tree =====
  tf::Test("Part 6 AVL: Height, Balance, UpdateHeight", [] {
    avl::Node* a = new avl::Node(1);
    avl::Node* b = new avl::Node(2);
    b->left = a;  // b has a left child only; b->height is still 0
    tf::ExpectEq(avl::Height(nullptr), -1, "Height(nullptr)");
    tf::ExpectEq(avl::Height(a), 0, "Height(leaf)");
    tf::ExpectEq(avl::Balance(nullptr), 0, "Balance(nullptr)");
    tf::ExpectEq(avl::Balance(b), 1, "Balance of a left-leaning node");
    avl::UpdateHeight(b);
    tf::ExpectEq(b->height, 1, "UpdateHeight");
    avl::UpdateHeight(nullptr);  // must not crash
    avl::Destroy(b);
  });
  tf::Test("Part 6 AVL: rotations keep order and fix heights", [] {
    // 30 -> left 20 -> left 10
    avl::Node* t = MakeAvl(30, MakeAvl(20, MakeAvl(10, nullptr, nullptr, 0), nullptr, 1), nullptr, 2);
    t = avl::RotateRight(t);
    ExpectShape(t, 20, 10, 30, 1);
    t = avl::RotateLeft(t);  // rotating 20(10, 30) left lifts 30: 30 -> left 20 -> left 10
    tf::ExpectEq(t->data, 30, "root after RotateLeft");
    tf::ExpectEq(t->height, 2, "height after RotateLeft");
    tf::ExpectEq(t->left->data, 20, "left child after RotateLeft");
    tf::ExpectEq(t->left->height, 1, "left child height after RotateLeft");
    avl::Destroy(t);
  });
  tf::Test("Part 6 AVL: Insert ascending and descending gives a perfect tree", [] {
    AvlInsertAndCheck({1, 2, 3, 4, 5, 6, 7}, 4, 2, {1, 2, 3, 4, 5, 6, 7});
    AvlInsertAndCheck({7, 6, 5, 4, 3, 2, 1}, 4, 2, {1, 2, 3, 4, 5, 6, 7});
  });
  tf::Test("Part 6 AVL: Rebalance handles all four cases", [] {
    // Left-left: 30 -> 20 -> 10
    avl::Node* ll = avl::Rebalance(MakeAvl(30, MakeAvl(20, MakeAvl(10, nullptr, nullptr, 0), nullptr, 1), nullptr, 2));
    ExpectShape(ll, 20, 10, 30, 1);
    avl::Destroy(ll);
    // Left-right: 30 -> 10 -> right 20
    avl::Node* lr = avl::Rebalance(MakeAvl(30, MakeAvl(10, nullptr, MakeAvl(20, nullptr, nullptr, 0), 1), nullptr, 2));
    ExpectShape(lr, 20, 10, 30, 1);
    avl::Destroy(lr);
    // Right-right: 10 -> 20 -> 30
    avl::Node* rr = avl::Rebalance(MakeAvl(10, nullptr, MakeAvl(20, nullptr, MakeAvl(30, nullptr, nullptr, 0), 1), 2));
    ExpectShape(rr, 20, 10, 30, 1);
    avl::Destroy(rr);
    // Right-left: 10 -> 30 -> left 20
    avl::Node* rl = avl::Rebalance(MakeAvl(10, nullptr, MakeAvl(30, MakeAvl(20, nullptr, nullptr, 0), nullptr, 1), 2));
    ExpectShape(rl, 20, 10, 30, 1);
    avl::Destroy(rl);
    tf::ExpectTrue(avl::Rebalance(nullptr) == nullptr, "Rebalance(nullptr)");
  });
  tf::HiddenTest("Part 6 AVL: zigzag, duplicates, large inputs and no leaks", [] {
    int before = avl::Node::alive;
    AvlInsertAndCheck({10, 30, 20}, 20, 1, {10, 20, 30});
    AvlInsertAndCheck({30, 10, 20}, 20, 1, {10, 20, 30});
    AvlInsertAndCheck({50, 20, 80, 10, 30, 25}, 30, 2, {10, 20, 25, 30, 50, 80});
    AvlInsertAndCheck({5, 3, 8, 5, 3, 8, 5}, 5, 1, {3, 5, 8});
    vector<int> hundred;
    for (int i = 1; i <= 100; ++i) hundred.push_back(i);
    AvlInsertAndCheck(hundred, 64, 6, hundred);
    tf::ExpectEq(avl::Node::alive, before, "Insert must not allocate nodes for duplicates");
  });

  // ===== PART 7: complex arithmetic =====
  tf::Test("Part 7 Complex: Multiply, Conjugate, Magnitude", [] {
    tf::ExpectComplexNear(Multiply(cd(1, 2), cd(3, 4)), cd(-5, 10), "(1+2i)(3+4i)");
    tf::ExpectComplexNear(Multiply(cd(0, 1), cd(0, 1)), cd(-1, 0), "i*i");
    tf::ExpectComplexNear(Conjugate(cd(3, -4)), cd(3, 4), "conj(3-4i)");
    tf::ExpectNear(Magnitude(cd(3, 4)), 5.0, "|3+4i|");
    tf::ExpectNear(Magnitude(cd(0, -2)), 2.0, "|-2i|");
  });
  tf::Test("Part 7 Complex: Phase, Divide, Twiddle", [] {
    tf::ExpectNear(Phase(cd(0, 1)), M_PI / 2, "arg(i)");
    tf::ExpectNear(Phase(cd(-1, 0)), M_PI, "arg(-1)");
    tf::ExpectNear(Phase(cd(-1, -1)), -3 * M_PI / 4, "arg(-1-i) is in the third quadrant");
    tf::ExpectComplexNear(Divide(cd(1, 2), cd(3, 4)), cd(0.44, 0.08), "(1+2i)/(3+4i)");
    tf::ExpectComplexNear(Twiddle(0, 8), cd(1, 0), "W_8^0");
    tf::ExpectComplexNear(Twiddle(1, 4), cd(0, -1), "W_4^1");
    tf::ExpectComplexNear(Twiddle(2, 4), cd(-1, 0), "W_4^2");
  });
  tf::HiddenTest("Part 7 Complex: Divide by zero, and agreement with std::complex", [] {
    tf::ExpectComplexNear(Divide(cd(5, 5), cd(0, 0)), cd(0, 0), "divide by zero");
    for (int k = 0; k < 8; ++k) {
      cd a(k - 3.5, 2.0 - k), b(0.5 * k + 1, -1.25);
      tf::ExpectComplexNear(Multiply(a, b), a * b, "Multiply vs std");
      tf::ExpectComplexNear(Divide(a, b), a / b, "Divide vs std");
      tf::ExpectNear(Magnitude(a), abs(a), "Magnitude vs std");
      tf::ExpectNear(Phase(a), arg(a), "Phase vs std");
      tf::ExpectComplexNear(Twiddle(k, 8), exp(cd(0, -2.0 * M_PI * k / 8)), "Twiddle vs exp");
    }
  });

  // ===== PART 8: DFT =====
  tf::Test("Part 8 DFT: NaiveDft of [1,2,3,4]", [] {
    vector<cd> x = {cd(1, 0), cd(2, 0), cd(3, 0), cd(4, 0)};
    vector<cd> X(4);
    NaiveDft(x.data(), X.data(), 4);
    ExpectSpectrum(X, {cd(2.5, 0), cd(-0.5, 0.5), cd(-0.5, 0), cd(-0.5, -0.5)});
  });
  tf::Test("Part 8 DFT: NaiveIdft undoes NaiveDft", [] {
    vector<cd> x = Mixed(8), X(8), back(8);
    NaiveDft(x.data(), X.data(), 8);
    NaiveIdft(X.data(), back.data(), 8);
    ExpectSpectrum(back, x);
  });
  tf::HiddenTest("Part 8 DFT: impulse is flat, N = 1, matches the reference", [] {
    vector<cd> imp(8, cd(0, 0)), X(8);
    imp[0] = cd(1, 0);
    NaiveDft(imp.data(), X.data(), 8);
    ExpectSpectrum(X, vector<cd>(8, cd(0.125, 0)));
    cd one(5, -2), out;
    NaiveDft(&one, &out, 1);
    tf::ExpectComplexNear(out, cd(5, -2), "N = 1");
    vector<cd> x = Mixed(6), got(6);
    NaiveDft(x.data(), got.data(), 6);
    ExpectSpectrum(got, RefDft(x));
  });

  // ===== PART 9: FFT =====
  tf::Test("Part 9 FFT: IsPowerOfTwo", [] {
    for (int n : {1, 2, 4, 8, 64, 1024}) tf::ExpectTrue(IsPowerOfTwo(n), to_string(n) + " is a power of two");
    for (int n : {0, 3, 6, 12, 100, -4}) tf::ExpectTrue(!IsPowerOfTwo(n), to_string(n) + " is not");
  });
  tf::Test("Part 9 FFT: ditfft2 matches the DFT for N = 1, 2, 4, 8", [] {
    for (int N : {1, 2, 4, 8}) {
      vector<cd> x = Mixed(N), X;
      Fft(x, X);
      ExpectSpectrum(X, RefDft(x));
    }
    vector<cd> ramp = {cd(1, 0), cd(2, 0), cd(3, 0), cd(4, 0)}, X;
    Fft(ramp, X);
    ExpectSpectrum(X, {cd(2.5, 0), cd(-0.5, 0.5), cd(-0.5, 0), cd(-0.5, -0.5)});
  });
  tf::Test("Part 9 FFT: Ifft undoes Fft", [] {
    for (int N : {2, 8}) {
      vector<cd> x = Mixed(N), X, back(N);
      Fft(x, X);
      Ifft(X.data(), back.data(), N);
      ExpectSpectrum(back, x);
    }
  });
  tf::HiddenTest("Part 9 FFT: N = 16 and N = 32, and a cosine lands in bins 1 and N-1", [] {
    for (int N : {16, 32}) {
      vector<cd> x = Mixed(N), X;
      Fft(x, X);
      ExpectSpectrum(X, RefDft(x));
    }
    vector<cd> c(8), X;
    for (int n = 0; n < 8; ++n) c[n] = cd(cos(2.0 * M_PI * n / 8.0), 0);
    Fft(c, X);
    for (int k = 0; k < 8; ++k)
      tf::ExpectComplexNear(X[k], (k == 1 || k == 7) ? cd(0.5, 0) : cd(0, 0), "bin " + to_string(k), 1e-9);
  });

  // ===== PART 10: Strategy pattern =====
  tf::Test("Part 10 Strategy: both strategies find present values", [] {
    const vector<int> sorted = {1, 3, 5, 7, 9, 11, 13};
    LinearSearch linear;
    BinarySearch binary;
    Searcher searcher;
    searcher.SetStrategy(&linear);
    tf::ExpectEq(searcher.Find(sorted, 7), 3, "linear");
    searcher.SetStrategy(&binary);
    tf::ExpectEq(searcher.Find(sorted, 7), 3, "binary (swapped at run time)");
    for (size_t i = 0; i < sorted.size(); ++i)
      tf::ExpectEq(binary.Search(sorted, sorted[i]), static_cast<int>(i), "binary index");
  });
  tf::Test("Part 10 Strategy: misses, no strategy set, unsorted data for linear", [] {
    const vector<int> sorted = {1, 3, 5, 7};
    LinearSearch linear;
    BinarySearch binary;
    Searcher none;
    tf::ExpectEq(none.Find(sorted, 3), -1, "no strategy");
    for (int missing : {0, 2, 8}) {
      tf::ExpectEq(linear.Search(sorted, missing), -1, "linear miss");
      tf::ExpectEq(binary.Search(sorted, missing), -1, "binary miss");
    }
    tf::ExpectEq(linear.Search({9, 2, 7, 4}, 7), 2, "linear on unsorted data");
    tf::ExpectEq(linear.Search({4, 4, 4}, 4), 0, "first match");
  });
  tf::HiddenTest("Part 10 Strategy: empty and single-element vectors", [] {
    LinearSearch linear;
    BinarySearch binary;
    tf::ExpectEq(linear.Search({}, 1), -1, "linear empty");
    tf::ExpectEq(binary.Search({}, 1), -1, "binary empty");
    tf::ExpectEq(binary.Search({5}, 5), 0, "binary single hit");
    tf::ExpectEq(binary.Search({5}, 4), -1, "binary single miss");
    vector<int> big;
    for (int i = 0; i < 1000; ++i) big.push_back(2 * i);
    tf::ExpectEq(binary.Search(big, 1998), 999, "last element");
    tf::ExpectEq(binary.Search(big, 0), 0, "first element");
    tf::ExpectEq(binary.Search(big, 777), -1, "odd value is absent");
  });

  // ===== PART 11: recursion =====
  tf::Test("Part 11 Recursion: Gcd and Power", [] {
    tf::ExpectEq(Gcd(48, 18), 6, "Gcd(48,18)");
    tf::ExpectEq(Gcd(17, 5), 1, "coprime");
    tf::ExpectEq(Gcd(7, 0), 7, "Gcd(7,0)");
    tf::ExpectEq(Gcd(0, 5), 5, "Gcd(0,5)");
    tf::ExpectEq(Power(2, 10), 1024LL, "2^10");
    tf::ExpectEq(Power(3, 0), 1LL, "3^0");
    tf::ExpectEq(Power(5, 1), 5LL, "5^1");
  });
  tf::Test("Part 11 Recursion: Hanoi with 2 and 3 disks", [] {
    tf::ExpectOutput(
        "Move disk 1 from A to B\n"
        "Move disk 2 from A to C\n"
        "Move disk 1 from B to C\n",
        [] { Hanoi(2, 'A', 'C', 'B'); });
    tf::ExpectOutput(
        "Move disk 1 from A to C\n"
        "Move disk 2 from A to B\n"
        "Move disk 1 from C to B\n"
        "Move disk 3 from A to C\n"
        "Move disk 1 from B to A\n"
        "Move disk 2 from B to C\n"
        "Move disk 1 from A to C\n",
        [] { Hanoi(3, 'A', 'C', 'B'); });
  });
  tf::HiddenTest("Part 11 Recursion: Hanoi(0), Hanoi(1), Hanoi(5) length, big Power", [] {
    tf::ExpectOutput("", [] { Hanoi(0, 'A', 'C', 'B'); });
    tf::ExpectOutput("Move disk 1 from X to Z\n", [] { Hanoi(1, 'X', 'Z', 'Y'); });
    string out = tf::Capture([] { Hanoi(5, 'A', 'C', 'B'); });
    tf::ExpectEq(count(out.begin(), out.end(), '\n'), 31, "2^5 - 1 moves");
    tf::ExpectEq(Power(2, 40), 1099511627776LL, "2^40 needs 64 bits");
    tf::ExpectEq(Power(7, 13), 96889010407LL, "7^13");
  });
}

}  // namespace q100

REGISTER_QUESTION(100, "Quick revision: implement every data structure", q100::RunQ100);
