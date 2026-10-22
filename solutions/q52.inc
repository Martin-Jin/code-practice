double TimeMicros(const function<void()>& f, int repeats) {
  if (repeats <= 0) return 0.0;
  auto start = chrono::steady_clock::now();
  for (int i = 0; i < repeats; ++i) f();
  auto end = chrono::steady_clock::now();
  double total = chrono::duration<double, micro>(end - start).count();
  return total / repeats;
}
