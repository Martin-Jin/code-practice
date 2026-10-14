template <typename It, typename T>
It FindFirst(It first, It last, const T& value) {
  for (It it = first; it != last; ++it) {
    if (*it == value) return it;
  }
  return last;
}
