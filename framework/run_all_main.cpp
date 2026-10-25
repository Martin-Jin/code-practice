// Runs every question of the set (used by CI and the per-change check: cmake -DRUN_ALL=ON).
// Normal use is main.cpp, where you pick one question.
#include "framework/test_framework.h"

int main() { return tf::RunQuestion(0); }
