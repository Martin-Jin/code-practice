int CountSubsets(const vector<int>& v, int index, int target) {
  if (index == static_cast<int>(v.size())) {
    return target == 0 ? 1 : 0;  // base case: no elements left to choose from
  }
  int without = CountSubsets(v, index + 1, target);              // skip v[index]
  int with = CountSubsets(v, index + 1, target - v[index]);      // take v[index]
  return without + with;
}
