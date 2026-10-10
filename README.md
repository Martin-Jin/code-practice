# MECHENG270 Part 2 practice questions

50 CodeRunner-style C++ practice questions for MECHENG270 Part 2: linked lists, stacks and queues, binary search trees, recursion, AVL trees, searching, complex arithmetic, DFT/FFT and the Strategy pattern. Each question is one file with its own tests, and you pick which one to run by changing a single number.

## Contents

| File / folder | What it is for |
|---|---|
| [INDEX.md](INDEX.md) | Table of all 50 questions with title, marks and topic. Start here to pick one. |
| `questions/qNN_*.cpp` | One question per file: the task text, the provided code, your answer area and the tests. |
| `main.cpp` | The runner. Change `kQuestion` to choose a question. |
| `framework/` | The small test framework (you never need to edit it). |
| `solutions/qNN.inc` | Reference solutions. **Spoilers** — only look after you've tried. |
| `CMakeLists.txt` | Optional CMake build. |

## Quick start

1. Install a C++17 compiler (g++ or clang++). CMake is optional.
2. Open `main.cpp` and set the question number:

   ```cpp
   constexpr int kQuestion = 7;   // 1..50 runs that question, 0 runs all of them
   ```

3. Open `questions/q07_*.cpp` and read the task in the comment at the top.
4. Write your answer between the two markers (this is the part you would paste into CodeRunner):

   ```cpp
   // ======================= YOUR ANSWER STARTS HERE ==============================
   ...
   // ======================== YOUR ANSWER ENDS HERE ===============================
   ```

   Leave the `PROVIDED CODE` and the tests alone.
5. Build and run from the repo folder:

   ```bash
   g++ -std=gnu++17 -I. main.cpp framework/test_framework.cpp questions/*.cpp -o practice
   ./practice          # practice.exe on Windows
   ```

   Or with CMake:

   ```bash
   cmake -S . -B build
   cmake --build build
   ./build/practice
   ```

6. Read the result. Passing looks like this:

   ```
   === Question 1: Singly linked-list: Insert() ===
     [visible] insert at head ... PASS
     [hidden] out of range positions ... PASS
     -> ALL PASSED (7/7 tests passed)
   ```

   A failing test shows what it expected and what your code produced. Fix, rebuild, repeat.

Changing `kQuestion` only recompiles `main.cpp`, so switching questions is fast. Every question file is compiled each time, so a question you haven't started still builds (its stub just fails its tests).

## How the tests work

- **Visible / hidden:** the `[visible]` tests mirror the examples in the question text. The `[hidden]` tests cover edge cases (empty input, out of range, single element), like CodeRunner's hidden tests. Don't read the test code first if you want a realistic attempt.
- **Output checks:** tests that compare printed output ignore trailing whitespace, exactly like CodeRunner.
- **Crash or hang:** the name of the running test is printed before it runs, so if your code crashes you can see which test caused it.
- **Recursion required:** some tasks say "must use recursion". The tests can't enforce that, so check yourself.
- **Marks:** each question header lists estimated marks (3 = short, 8 = long). See [INDEX.md](INDEX.md).

## Run everything

Set `kQuestion = 0` to run all 50 questions and print a summary. Un-attempted questions will fail, which is expected.

## Check the reference solutions (optional)

The solutions are compiled instead of your answers when you define `USE_SOLUTIONS`. All 332 tests should pass:

```bash
g++ -std=gnu++17 -DUSE_SOLUTIONS -I. main.cpp framework/test_framework.cpp questions/*.cpp -o practice_solutions
```

With CMake: `cmake -S . -B build -DUSE_SOLUTIONS=ON`.

## Windows notes

- With MSYS2/MinGW, add `C:\msys64\mingw64\bin` to your `PATH` before running `g++`.
- Use `gnu++17` (not `c++17`) so that `M_PI` is available. The framework also defines `_USE_MATH_DEFINES` for MSVC.

## Adding a question

1. Copy an existing `questions/qNN_*.cpp` and its `solutions/qNN.inc`.
2. Give it a new number and a **new namespace** (`namespace qNN`). All questions link into one program, so shared names like `Node` would otherwise clash.
3. End the file with `REGISTER_QUESTION(NN, "Title", qNN::RunQNN);`.
4. Add a row to [INDEX.md](INDEX.md).
