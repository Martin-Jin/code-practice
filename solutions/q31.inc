void Hanoi(int n, char from, char to, char via) {
  if (n <= 0) return;                 // base case: nothing to move
  Hanoi(n - 1, from, via, to);        // park the n-1 smaller disks on the spare peg
  cout << "Move disk " << n << " from " << from << " to " << to << endl;
  Hanoi(n - 1, via, to, from);        // bring them back on top of disk n
}
