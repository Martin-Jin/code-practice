// ============================================================================
// Question 71  (6 marks)  -  Expression trees: Eval()
// Topic: Expression trees
//
// Requirements for Expression trees: Eval()
//
// You have been provided with an expression tree Node struct (operators in
// internal nodes, operands in leaves), the helper is_op(), IsNumber() (true if
// a token is an optional sign, digits and at most one '.'), and Mk() / Free()
// for building and freeing trees.
//
// Task
// Implement double Eval(Node* n, const unordered_map<string, double>& env)
// as a POST-ORDER traversal (evaluate both children, then apply the operator):
//   - number leaf (IsNumber)   -> its value (use stod)
//   - identifier leaf          -> its value in env; if it is not in env throw
//                                 std::runtime_error
//   - operator + - * / ^       -> combine the left and right values; ^ is pow()
//   - division by zero         -> throw std::runtime_error
//   - nullptr                  -> 0.0
// Take care with non-commutative operators: left OP right, in that order.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include <cmath>
#include <stdexcept>
#include <unordered_map>

#include "../../framework/test_framework.h"

namespace q71 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Node {
  string tok;  // operator or operand
  Node* left;
  Node* right;
  Node(const string& t) : tok(t), left(nullptr), right(nullptr) {}
};

static inline bool is_op(const string& t) {
  return t.size() == 1 && string("+-*/^").find(t[0]) != string::npos;
}

static bool IsNumber(const string& t) {
  size_t i = 0;
  if (i < t.size() && (t[i] == '+' || t[i] == '-')) ++i;
  int digits = 0, dots = 0;
  for (; i < t.size(); ++i) {
    if (t[i] >= '0' && t[i] <= '9') {
      ++digits;
    } else if (t[i] == '.') {
      ++dots;
    } else {
      return false;
    }
  }
  return digits > 0 && dots <= 1;
}

Node* Mk(const string& t, Node* l = nullptr, Node* r = nullptr) {
  Node* n = new Node(t);
  n->left = l;
  n->right = r;
  return n;
}

void Free(Node* n) {
  if (!n) return;
  Free(n->left);
  Free(n->right);
  delete n;
}

double Eval(Node* n, const unordered_map<string, double>& env);

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
double Eval(Node* n, const unordered_map<string, double>& env) {
  // TODO: post-order evaluation.
  return 0.0;
}
#else
#include "../solutions/q71.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static bool Throws(Node* t, const unordered_map<string, double>& env) {
  try {
    Eval(t, env);
  } catch (const runtime_error&) {
    return true;
  }
  return false;
}

// (3 + 5) * (10 - 2)
static Node* Sixty4() {
  return Mk("*", Mk("+", Mk("3"), Mk("5")), Mk("-", Mk("10"), Mk("2")));
}

// x * (y + 2) - x / y
static Node* Xy() {
  return Mk("-", Mk("*", Mk("x"), Mk("+", Mk("y"), Mk("2"))),
            Mk("/", Mk("x"), Mk("y")));
}

void RunQ71() {
  tf::Test("(3 + 5) * (10 - 2) = 64", [] {
    Node* t = Sixty4();
    tf::ExpectNear(Eval(t, {}), 64.0, "value");
    Free(t);
  });

  tf::Test("x * (y + 2) - x / y with x=6, y=3 = 28", [] {
    Node* t = Xy();
    tf::ExpectNear(Eval(t, {{"x", 6.0}, {"y", 3.0}}), 28.0, "value");
    Free(t);
  });

  tf::Test("single leaf: number and variable", [] {
    Node* a = Mk("12.5");
    Node* b = Mk("z");
    tf::ExpectNear(Eval(a, {}), 12.5, "number leaf");
    tf::ExpectNear(Eval(b, {{"z", -4.0}}), -4.0, "variable leaf");
    Free(a);
    Free(b);
  });

  tf::Test("unknown variable throws runtime_error", [] {
    Node* t = Mk("+", Mk("x"), Mk("q"));
    tf::ExpectTrue(Throws(t, {{"x", 1.0}}), "q is not in env");
    Free(t);
  });

  tf::HiddenTest("non-commutative operators", [] {
    Node* a = Mk("-", Mk("10"), Mk("4"));
    Node* b = Mk("/", Mk("12"), Mk("4"));
    Node* c = Mk("^", Mk("2"), Mk("5"));
    tf::ExpectNear(Eval(a, {}), 6.0, "10 - 4");
    tf::ExpectNear(Eval(b, {}), 3.0, "12 / 4");
    tf::ExpectNear(Eval(c, {}), 32.0, "2 ^ 5");
    Free(a);
    Free(b);
    Free(c);
  });

  tf::HiddenTest("right-leaning power 2 ^ (3 ^ 2) = 512", [] {
    Node* t = Mk("^", Mk("2"), Mk("^", Mk("3"), Mk("2")));
    tf::ExpectNear(Eval(t, {}), 512.0, "value");
    Free(t);
  });

  tf::HiddenTest("division by zero throws runtime_error", [] {
    Node* t = Mk("/", Mk("1"), Mk("0"));
    tf::ExpectTrue(Throws(t, {}), "1 / 0");
    Free(t);
    Node* u = Mk("/", Mk("1"), Mk("-", Mk("x"), Mk("x")));
    tf::ExpectTrue(Throws(u, {{"x", 2.0}}), "1 / (x - x)");
    Free(u);
  });
}

}  // namespace q71

REGISTER_QUESTION(71, "Expression trees: Eval()", q71::RunQ71);
