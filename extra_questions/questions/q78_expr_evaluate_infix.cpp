// ============================================================================
// Question 78  (5 marks)  -  Expression trees: EvaluateInfix()
// Topic: Expression trees
//
// Requirements for Expression trees: EvaluateInfix()
//
// Putting the expression-tree pieces together: infix -> postfix (shunting-
// yard) -> tree (stack) -> value (post-order). You have been provided with
// correct implementations of
//   vector<string> InfixToPostfix(const vector<string>& infix)  (throws on
//                                          mismatched brackets)
//   Node* BuildFromPostfix(const vector<string>& pf)  (throws on malformed
//                                          postfix, e.g. an empty vector)
//   double Eval(Node* n, const unordered_map<string, double>& env)  (throws
//                         std::runtime_error for an unknown variable or a
//                         division by zero)
//   void Destroy(Node* n)                          (frees a whole tree)
// The Node struct keeps a static count `live` of nodes that are alive.
//
// Task
// Implement double EvaluateInfix(const vector<string>& infix,
// const unordered_map<string, double>& env). It converts the (already
// tokenised) infix expression to postfix, builds the tree, evaluates it and
// returns the value. The tree must be freed on EVERY path, including when
// Eval() throws: let the exception propagate to the caller, but only after
// freeing the tree. The tests check this with the live-node counter.
//
// Note: there are four visible test cases and three hidden test cases.
// ============================================================================
#include <cmath>
#include <stdexcept>
#include <unordered_map>

#include "../../framework/test_framework.h"

namespace q78 {
using namespace std;

// ------------------------- PROVIDED CODE (do not edit) -----------------------
struct Node {
  static inline int live = 0;  // number of Nodes currently allocated
  string tok;                  // operator or operand
  Node* left;
  Node* right;
  Node(const string& t) : tok(t), left(nullptr), right(nullptr) { ++live; }
  ~Node() { --live; }
};

static inline bool is_op(const string& t) {
  return t.size() == 1 && string("+-*/^").find(t[0]) != string::npos;
}

static inline int prec(const string& op) {
  if (op == "^") return 4;
  if (op == "*" || op == "/") return 3;
  if (op == "+" || op == "-") return 2;
  return 1;
}

static inline bool right_assoc(const string& op) { return op == "^"; }

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

void Destroy(Node* n) {
  if (!n) return;
  Destroy(n->left);
  Destroy(n->right);
  delete n;
}

vector<string> InfixToPostfix(const vector<string>& infix) {
  vector<string> out, st;
  for (size_t i = 0; i < infix.size(); ++i) {
    const string& t = infix[i];
    if (is_op(t)) {
      while (!st.empty() && is_op(st.back())) {
        int p_top = prec(st.back()), p_in = prec(t);
        if (!(p_top > p_in || (p_top == p_in && !right_assoc(t)))) break;
        out.push_back(st.back());
        st.pop_back();
      }
      st.push_back(t);
    } else if (t == "(") {
      st.push_back(t);
    } else if (t == ")") {
      while (!st.empty() && st.back() != "(") {
        out.push_back(st.back());
        st.pop_back();
      }
      if (st.empty()) throw runtime_error("mismatched ')'");
      st.pop_back();
    } else {
      out.push_back(t);
    }
  }
  while (!st.empty()) {
    if (st.back() == "(") throw runtime_error("mismatched '('");
    out.push_back(st.back());
    st.pop_back();
  }
  return out;
}

Node* BuildFromPostfix(const vector<string>& pf) {
  vector<Node*> st;
  for (size_t i = 0; i < pf.size(); ++i) {
    const string& t = pf[i];
    if (!is_op(t)) {
      st.push_back(new Node(t));
    } else {
      if (st.size() < 2) {
        for (size_t k = 0; k < st.size(); ++k) Destroy(st[k]);
        throw runtime_error("malformed postfix: stack underflow");
      }
      Node* r = st.back();
      st.pop_back();
      Node* l = st.back();
      st.pop_back();
      Node* n = new Node(t);
      n->left = l;
      n->right = r;
      st.push_back(n);
    }
  }
  if (st.size() != 1) {
    for (size_t k = 0; k < st.size(); ++k) Destroy(st[k]);
    throw runtime_error("malformed postfix: leftover trees");
  }
  return st.back();
}

double Eval(Node* n, const unordered_map<string, double>& env) {
  if (!n) return 0.0;
  if (!is_op(n->tok)) {  // leaf
    if (IsNumber(n->tok)) return stod(n->tok);
    auto it = env.find(n->tok);
    if (it == env.end()) throw runtime_error("unknown variable: " + n->tok);
    return it->second;
  }
  double a = Eval(n->left, env);
  double b = Eval(n->right, env);
  if (n->tok == "+") return a + b;
  if (n->tok == "-") return a - b;
  if (n->tok == "*") return a * b;
  if (n->tok == "/") {
    if (b == 0.0) throw runtime_error("division by zero");
    return a / b;
  }
  return pow(a, b);  // "^"
}

double EvaluateInfix(const vector<string>& infix,
                     const unordered_map<string, double>& env);

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
double EvaluateInfix(const vector<string>& infix,
                     const unordered_map<string, double>& env) {
  // TODO: InfixToPostfix -> BuildFromPostfix -> Eval -> Destroy.
  return 0.0;
}
#else
#include "../solutions/q78.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static bool Throws(const vector<string>& infix,
                   const unordered_map<string, double>& env) {
  try {
    EvaluateInfix(infix, env);
  } catch (const runtime_error&) {
    return true;
  }
  return false;
}

void RunQ78() {
  tf::Test("( 3 + 5 ) * ( 10 - 2 ) = 64", [] {
    int before = Node::live;
    tf::ExpectNear(EvaluateInfix({"(", "3", "+", "5", ")", "*", "(", "10", "-", "2", ")"}, {}),
                   64.0, "value");
    tf::ExpectEq(Node::live - before, 0, "nodes still alive");
  });

  tf::Test("2 ^ 3 ^ 2 = 512", [] {
    tf::ExpectNear(EvaluateInfix({"2", "^", "3", "^", "2"}, {}), 512.0, "value");
  });

  tf::Test("x * ( y + 2 ) - x / y with x=6, y=3 = 28", [] {
    tf::ExpectNear(EvaluateInfix({"x", "*", "(", "y", "+", "2", ")", "-", "x", "/", "y"},
                                 {{"x", 6.0}, {"y", 3.0}}),
                   28.0, "value");
  });

  tf::Test("left-associative subtraction: 10 - 4 - 3 = 3", [] {
    tf::ExpectNear(EvaluateInfix({"10", "-", "4", "-", "3"}, {}), 3.0, "value");
  });

  tf::HiddenTest("unknown variable throws and frees the tree", [] {
    int before = Node::live;
    tf::ExpectTrue(Throws({"x", "+", "q", "*", "2"}, {{"x", 1.0}}), "q is not in env");
    tf::ExpectEq(Node::live - before, 0, "nodes still alive");
  });

  tf::HiddenTest("division by zero throws and frees the tree", [] {
    int before = Node::live;
    tf::ExpectTrue(Throws({"1", "/", "(", "2", "-", "2", ")"}, {}), "1 / (2 - 2)");
    tf::ExpectEq(Node::live - before, 0, "nodes still alive");
  });

  tf::HiddenTest("bad input propagates runtime_error", [] {
    tf::ExpectTrue(Throws({"(", "1", "+", "2"}, {}), "mismatched bracket");
    tf::ExpectTrue(Throws({}, {}), "empty expression");
    tf::ExpectNear(EvaluateInfix({"7"}, {}), 7.0, "lone number");
  });
}

}  // namespace q78

REGISTER_QUESTION(78, "Expression trees: EvaluateInfix()", q78::RunQ78);
