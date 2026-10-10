int HotPotato(int n, int k) {
  queue<int> players;
  for (int i = 1; i <= n; ++i) players.push(i);
  while (players.size() > 1) {
    for (int pass = 1; pass < k; ++pass) {
      players.push(players.front());
      players.pop();
    }
    players.pop();  // the k-th player is eliminated
  }
  return players.front();
}
