# MECHENG270 Part 2 practice questions

50 CodeRunner-style C++ practice questions for MECHENG270 Part 2: linked lists, stacks and queues, binary search trees, recursion, AVL trees, searching, complex arithmetic, DFT/FFT and the Strategy pattern.

Each question is one file with its own tests. You pick which question to run by changing one number.

## What's in the repo

| File / folder | What it is for |
|---|---|
| [INDEX.md](INDEX.md) | All 50 questions with title, marks and topic. Start here to pick one. |
| `questions/` | One file per question: the task, the provided code, your answer area and the tests. |
| `main.cpp` | The runner. You change one number in it to choose a question. |
| `framework/` | The small test framework. You never need to edit it. |
| `solutions/` | Reference solutions. **Spoilers** — only look after you've tried. |
| `CMakeLists.txt` | The CMake build file. |

## One-time setup

You need:

- A C++17 compiler (g++ or clang++)
- CMake (version 3.16 or newer)

## Doing a question

### Step 1: Pick a question

Open `main.cpp` and change the number:

```cpp
constexpr int kQuestion = 7;
```

- `1` to `50` runs that one question.
- `0` runs every question and prints a summary.

### Step 2: Write your answer

1. Open the matching file in `questions/` (for example `questions/q07_sll_remove_tail.cpp`).
2. Read the task in the comment at the top.
3. Write your code between these two markers:

   ```cpp
   // ======================= YOUR ANSWER STARTS HERE ==============================
   // ======================== YOUR ANSWER ENDS HERE ===============================
   ```

   This is the part you would paste into CodeRunner. Don't edit the `PROVIDED CODE` or the tests.

### Step 3: Build

Run these from the repo folder, one at a time:

```
mkdir build
cd build
cmake ..
cmake --build .
```

You only need `mkdir build`, `cd build` and `cmake ..` the first time.

### Step 4: Run

From inside the `build` folder:

```
./practice
```

On Windows PowerShell use `.\practice.exe` instead (if you built with Visual Studio it may be `.\Debug\practice.exe`).

### Step 5: Read the result

A passing question looks like this:

```
=== Question 1: Singly linked-list: Insert() ===
  [visible] insert at head ... PASS
  [hidden] out of range positions ... PASS
  -> ALL PASSED (7/7 tests passed)
```

A failing test shows what it expected and what your code printed or returned.

### Step 6: Repeat

After every change to your answer, or to `kQuestion`, rebuild and run again. From inside `build`:

```
cmake --build .
./practice
```

## How the tests work

- **Visible tests** match the examples you would see in the question text.
- **Hidden tests** cover edge cases (empty input, out of range, single element), like CodeRunner's hidden tests. Don't read the test code first if you want a realistic attempt.
- **Printed output** is compared ignoring trailing whitespace, exactly like CodeRunner.
- **Crashes:** the name of each test is printed before it runs, so if your code crashes you can see which test caused it.
- **Recursion:** some tasks say "must use recursion". The tests can't enforce that, so check it yourself.
- **Marks:** each question header gives estimated marks (3 = short, 8 = long).
- **Questions you haven't started** still build. Their stubs just fail the tests.

## Troubleshooting

- **CMake picks the wrong compiler or generator on Windows.** Delete the `build` folder, then tell CMake which one to use. With MinGW (MSYS2):

  ```
  cmake -G "MinGW Makefiles" ..
  ```

- **`g++` or `cmake` not found.** Add the compiler's `bin` folder to your `PATH` (for MSYS2 that is `C:\msys64\mingw64\bin`).
- **Changes to `CMakeLists.txt` or new question files aren't picked up.** Run `cmake ..` again from inside `build`.

## Check the reference solutions (optional)

To build with the reference solutions instead of your answers (all 332 tests should pass), run from inside `build`:

```
cmake -DUSE_SOLUTIONS=ON ..
cmake --build .
./practice
```

Switch back to your own answers with:

```
cmake -DUSE_SOLUTIONS=OFF ..
cmake --build .
```

## Adding a question

1. Copy an existing `questions/qNN_*.cpp` and its `solutions/qNN.inc`.
2. Give it a new number and a **new namespace** (`namespace qNN`). All questions are linked into one program, so shared names like `Node` would otherwise clash.
3. End the file with `REGISTER_QUESTION(NN, "Title", qNN::RunQNN);`.
4. Add a row to [INDEX.md](INDEX.md).
5. Run `cmake ..` again from inside `build` so the new file is found.
