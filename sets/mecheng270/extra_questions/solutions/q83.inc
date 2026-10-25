string ClassifyFragment(int id) {
  switch (id) {
    case 1: return "O(1)";
    case 2: return "O(N)";
    case 3: return "O(N)";
    case 4: return "O(N^2)";
    case 5: return "O(log N)";
    case 6: return "O(N)";
    case 7: return "O(N log N)";
    case 8: return "O(N^2)";
    default: return "unknown";
  }
}
