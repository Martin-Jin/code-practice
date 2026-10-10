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
    if (!strategy_) return -1;
    return strategy_->Search(data, target);
  }

 private:
  SearchStrategy* strategy_;
};
