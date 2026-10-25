template <typename Container>
string JoinWithIterators(const Container& c) {
  ostringstream out;
  for (auto it = c.begin(); it != c.end(); ++it) {
    if (it != c.begin()) out << " ";
    out << *it;
  }
  return out.str();
}
