long long TimeOnceMicros(const function<void()>& f) {
  auto start = chrono::steady_clock::now();
  f();
  auto end = chrono::steady_clock::now();
  return chrono::duration_cast<chrono::microseconds>(end - start).count();
}

int FasterOf(const function<void()>& a, const function<void()>& b, int repeats) {
  if (repeats <= 0) return 0;
  long long total_a = 0, total_b = 0;
  for (int i = 0; i < repeats; ++i) {
    total_a += TimeOnceMicros(a);
    total_b += TimeOnceMicros(b);
  }
  return total_b < total_a ? 1 : 0;
}
