// ============================================================================
// Question 19  (5 marks)  -  Queue: Hot Potato
// Topic: Stacks & queues
//
// Requirements for Queue: Hot Potato
//
// Players numbered 1..n stand in a circle in order (player 1 at the front of
// the line). A potato is passed along the line: the player at the front takes
// it, and the potato is passed k times in total. After k passes, the player
// holding the potato is eliminated. Passing continues from the player after
// the one who was eliminated. This repeats until a single player remains.
//
// Task
// Implement int HotPotato(int n, int k) which returns the number of the last
// remaining player. Use a queue (std::queue<int> from <queue> is allowed):
// to pass the potato, dequeue the front player and enqueue them at the back;
// the k-th player to be handed the potato is removed instead of re-queued.
//
// Example: n = 5, k = 2 -> players are eliminated in the order 2, 4, 1, 5,
// leaving player 3.
//
// You may assume n >= 1 and k >= 1.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include <queue>

#include "framework/test_framework.h"

namespace q19 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
// Returns the number of the last remaining player (players are 1..n).
int HotPotato(int n, int k);

// ======================= YOUR ANSWER STARTS HERE ==============================
#ifndef USE_SOLUTIONS
int HotPotato(int n, int k) {
  // Your implementation here
  return -1;
}
#else
#include "../solutions/q19.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE ===============================

// ------------------------------- TESTS ---------------------------------------
void RunQ19() {
  tf::Test("n = 5, k = 2", [] {
    tf::ExpectOutput("Survivor: 3\n", [] { cout << "Survivor: " << HotPotato(5, 2) << endl; });
  });

  tf::Test("n = 7, k = 3", [] {
    tf::ExpectOutput("Survivor: 4\n", [] { cout << "Survivor: " << HotPotato(7, 3) << endl; });
  });

  tf::Test("k = 1 eliminates in order, last player survives", [] {
    tf::ExpectOutput("Survivor: 6\n", [] { cout << "Survivor: " << HotPotato(6, 1) << endl; });
  });

  tf::Test("single player", [] {
    tf::ExpectOutput("Survivor: 1\n", [] { cout << "Survivor: " << HotPotato(1, 5) << endl; });
  });

  tf::HiddenTest("k larger than n", [] {
    tf::ExpectOutput("Survivor: 2\n", [] { cout << "Survivor: " << HotPotato(4, 5) << endl; });
  });

  tf::HiddenTest("n = 10, k = 2", [] {
    tf::ExpectOutput("Survivor: 5\n", [] { cout << "Survivor: " << HotPotato(10, 2) << endl; });
  });

  tf::HiddenTest("n = 41, k = 3 (classic Josephus)", [] {
    tf::ExpectOutput("Survivor: 31\n", [] { cout << "Survivor: " << HotPotato(41, 3) << endl; });
  });
}

}  // namespace q19

REGISTER_QUESTION(19, "Queue: Hot Potato", q19::RunQ19);
