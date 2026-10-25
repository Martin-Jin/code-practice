void PrintPermutations(const string& prefix, const string& rest) {
  if (rest.empty()) {  // base case: every letter has been placed
    cout << prefix << endl;
    return;
  }
  for (size_t i = 0; i < rest.size(); ++i) {
    // Pick rest[i] next, and permute the letters that remain.
    PrintPermutations(prefix + rest[i], rest.substr(0, i) + rest.substr(i + 1));
  }
}
