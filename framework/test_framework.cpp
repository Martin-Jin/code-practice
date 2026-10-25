#include "test_framework.h"

#include <algorithm>
#include <cstdio>
#include <exception>

namespace tf {

namespace {
int g_tests_run = 0;
int g_tests_failed = 0;
bool g_current_failed = false;
std::vector<std::string> g_current_messages;

std::string RStrip(const std::string& s) {
  size_t end = s.find_last_not_of(" \t\r\n");
  return end == std::string::npos ? "" : s.substr(0, end + 1);
}

// Strip trailing whitespace from every line and from the whole text.
std::string Normalise(const std::string& text) {
  std::istringstream in(text);
  std::string line, out;
  while (std::getline(in, line)) out += RStrip(line) + "\n";
  return RStrip(out);
}

struct FailureDetail {
  std::string message, kind, what, expected, actual;
};
std::vector<FailureDetail> g_current_details;

std::string Json(const std::string& s) {
  std::string out = "\"";
  for (unsigned char c : s) {
    switch (c) {
      case '"': out += "\\\""; break;
      case '\\': out += "\\\\"; break;
      case '\n': out += "\\n"; break;
      case '\r': out += "\\r"; break;
      case '\t': out += "\\t"; break;
      default:
        if (c < 0x20) {
          char buf[8];
          std::snprintf(buf, sizeof buf, "\\u%04x", c);
          out += buf;
        } else {
          out += static_cast<char>(c);
        }
    }
  }
  return out + "\"";
}

// Machine-readable test events for the web app: one JSON object on stderr, wrapped in
// control characters so it cannot be mixed up with the student's own output. Only
// compiled in when the app defines TF_EVENTS_STDERR; a normal build prints nothing extra.
void Emit(const std::string& json) {
#ifdef TF_EVENTS_STDERR
  std::cerr << '\x1e' << json << '\x1f' << std::flush;
#else
  (void)json;
#endif
}
}  // namespace

std::vector<Question>& Registry() {
  static std::vector<Question> registry;
  return registry;
}

Registrar::Registrar(int number, const char* title, void (*run)()) {
  Registry().push_back({number, title, run});
}

void Fail(const std::string& message) { Fail(message, "plain", "", "", ""); }

void Fail(const std::string& message, const char* kind, const std::string& what,
          const std::string& expected, const std::string& actual) {
  g_current_failed = true;
  g_current_messages.push_back(message);
  g_current_details.push_back({message, kind, what, expected, actual});
}

std::string Capture(const std::function<void()>& body) {
  std::ostringstream captured;
  std::streambuf* old = std::cout.rdbuf(captured.rdbuf());
  try {
    body();
  } catch (...) {
    std::cout.rdbuf(old);
    throw;
  }
  std::cout.rdbuf(old);
  return captured.str();
}

void ExpectOutput(const std::string& expected, const std::function<void()>& body) {
  std::string actual = Capture(body);
  if (Normalise(actual) != Normalise(expected)) {
    Fail("output differs\n    --- expected ---\n" + Normalise(expected) +
             "\n    --- got ---\n" + Normalise(actual) + "\n    ----------------",
         "output", "output", Normalise(expected), Normalise(actual));
  }
}

void ExpectTrue(bool condition, const std::string& what) {
  if (!condition) Fail(what + ": expected true");
}

void ExpectNear(double actual, double expected, const std::string& what, double tol) {
  if (!(std::fabs(actual - expected) <= tol)) {
    Fail(what + ": expected " + Str(expected) + " but got " + Str(actual), "value", what,
         Str(expected), Str(actual));
  }
}

void ExpectComplexNear(std::complex<double> actual, std::complex<double> expected,
                       const std::string& what, double tol) {
  if (!(std::abs(actual - expected) <= tol)) {
    Fail(what + ": expected " + Str(expected) + " but got " + Str(actual), "value", what,
         Str(expected), Str(actual));
  }
}

void Test(const std::string& name, const std::function<void()>& body, bool hidden) {
  ++g_tests_run;
  g_current_failed = false;
  g_current_messages.clear();
  g_current_details.clear();
  Emit("{\"e\":\"test_start\",\"name\":" + Json(name) + ",\"hidden\":" +
       (hidden ? "true" : "false") + "}");
  // Printed (and flushed) before running so a crash shows which test caused it.
  std::cout << "  " << (hidden ? "[hidden] " : "[visible] ") << name << " ... " << std::flush;
  try {
    body();
  } catch (const std::exception& e) {
    Fail(std::string("threw exception: ") + e.what());
  } catch (...) {
    Fail("threw an unknown exception");
  }
  if (g_current_failed) {
    ++g_tests_failed;
    std::cout << "FAIL\n";
    for (const auto& m : g_current_messages) std::cout << "    " << m << "\n";
  } else {
    std::cout << "PASS\n";
  }
  std::cout << std::flush;
  std::string failures;
  for (const auto& d : g_current_details) {
    failures += std::string(failures.empty() ? "" : ",") + "{\"message\":" + Json(d.message) +
                ",\"kind\":" + Json(d.kind) + ",\"what\":" + Json(d.what) +
                ",\"expected\":" + Json(d.expected) + ",\"actual\":" + Json(d.actual) + "}";
  }
  Emit("{\"e\":\"test_end\",\"name\":" + Json(name) + ",\"hidden\":" +
       (hidden ? "true" : "false") + ",\"passed\":" + (g_current_failed ? "false" : "true") +
       ",\"failures\":[" + failures + "]}");
}

void HiddenTest(const std::string& name, const std::function<void()>& body) {
  Test(name, body, true);
}

int RunQuestion(int number) {
  auto questions = Registry();
  std::sort(questions.begin(), questions.end(),
            [](const Question& a, const Question& b) { return a.number < b.number; });

  int failed_questions = 0;
  bool found = false;
  for (const auto& q : questions) {
    if (number != 0 && q.number != number) continue;
    found = true;
    int before_run = g_tests_run, before_failed = g_tests_failed;
    std::cout << "=== Question " << q.number << ": " << q.title << " ===\n" << std::flush;
    Emit("{\"e\":\"question\",\"number\":" + std::to_string(q.number) + ",\"title\":" +
         Json(q.title) + "}");
    q.run();
    int run = g_tests_run - before_run, failed = g_tests_failed - before_failed;
    std::cout << (failed == 0 ? "  -> ALL PASSED (" : "  -> FAILED (") << (run - failed) << "/"
              << run << " tests passed)\n\n";
    if (failed != 0) ++failed_questions;
  }
  if (!found) {
    std::cout << "No question numbered " << number << " is registered.\n";
    return 1;
  }
  if (number == 0) {
    std::cout << "Summary: " << (g_tests_run - g_tests_failed) << "/" << g_tests_run
              << " tests passed, " << failed_questions << " question(s) with failures.\n";
  }
  return g_tests_failed == 0 ? 0 : 1;
}

}  // namespace tf
