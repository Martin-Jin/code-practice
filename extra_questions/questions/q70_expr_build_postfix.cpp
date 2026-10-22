// ============================================================================
// Question 70  (6 marks)  -  Expression trees: BuildFromPostfix()
// Topic: Expression trees
//
// Requirements for Expression trees: BuildFromPostfix()
//
// An expression tree stores a formula as a binary tree: operators (+ - * / ^)
// are internal nodes with exactly two children and operands (numbers or
// identifiers) are leaves. You have been provided with the Node struct, the
// helper is_op(), a tree builder Mk() and Free() (frees a whole tree), and two
// printers ToPrefix() / ToPostfix() that the tests use to check your tree.
//
// Task
// Implement Node* BuildFromPostfix(const vector<string>& pf). The vector holds
// a postfix (Reverse Polish) expression, one token per element, e.g.
// {"3","5","+","10","2","-","*"}. Use a stack of Node* and make ONE pass:
//   - operand  -> push a one-node tree
//   - operator -> pop the stack: the FIRST pop is the RIGHT child, the second
//                 pop is the LEFT child; make a new node and push it
// At the end the stack must hold exactly one tree: return it.
// Throw std::runtime_error if an operator finds fewer than two trees on the
// stack (underflow) or if the stack does not end with exactly one tree
// (this includes an empty vector). Free any partial trees before throwing.
//
// Note: there are three visible test cases and three hidden test cases.
// ============================================================================
#include <stdexcept>

#include "../../framework/test_framework.h"

namespace q70 {
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

static void Collect(Node* n, bool pre, vector<string>& out) {
  if (!n) return;
  if (pre) out.push_back(n->tok);
  Collect(n->left, pre, out);
  Collect(n->right, pre, out);
  if (!pre) out.push_back(n->tok);
}

static string Join(const vector<string>& v) {
  string s;
  for (size_t i = 0; i < v.size(); ++i) s += (i ? " " : "") + v[i];
  return s;
}

string ToPrefix(Node* n) {
  vector<string> v;
  Collect(n, true, v);
  return Join(v);
}

string ToPostfix(Node* n) {
  vector<string> v;
  Collect(n, false, v);
  return Join(v);
}

Node* BuildFromPostfix(const vector<string>& pf);

// ======================= YOUR ANSWER STARTS HERE
// ==============================
#ifndef USE_SOLUTIONS
Node* BuildFromPostfix(const vector<string>& pf) {
  // TODO: one pass with a stack of Node*.
  return nullptr;
}
#else
#include "../solutions/q70.inc"
#endif
// ======================== YOUR ANSWER ENDS HERE
// ===============================

// ------------------------------- TESTS ---------------------------------------
static bool Throws(const vector<string>& pf) {
  try {
    Free(BuildFromPostfix(pf));
  } catch (const runtime_error&) {
    return true;
  }
  return false;
}

void RunQ70() {
  tf::Test("(3 + 5) * (10 - 2)", [] {
    Node* t = BuildFromPostfix({"3", "5", "+", "10", "2", "-", "*"});
    tf::ExpectEq(ToPrefix(t), string("* + 3 5 - 10 2"), "prefix");
    tf::ExpectEq(ToPostfix(t), string("3 5 + 10 2 - *"), "postfix");
    Free(t);
  });

  tf::Test("single operand", [] {
    Node* t = BuildFromPostfix({"x"});
    tf::ExpectTrue(t != nullptr, "tree is not null");
    if (t) {
      tf::ExpectEq(t->tok, string("x"), "root token");
      tf::ExpectTrue(!t->left && !t->right, "leaf has no children");
    }
    Free(t);
  });

  tf::Test("non-commutative operator keeps operand order", [] {
    Node* t = BuildFromPostfix({"10", "4", "-"});
    tf::ExpectTrue(t != nullptr, "tree is not null");
    if (t && t->left && t->right) {
      tf::ExpectEq(t->tok, string("-"), "root");
      tf::ExpectEq(t->left->tok, string("10"), "left child");
      tf::ExpectEq(t->right->tok, string("4"), "right child");
    } else {
      tf::Fail("root should be '-' with two children");
    }
    Free(t);
  });

  tf::HiddenTest("x * (y + 2) - x / y", [] {
    Node* t = BuildFromPostfix({"x", "y", "2", "+", "*", "x", "y", "/", "-"});
    tf::ExpectEq(ToPrefix(t), string("- * x + y 2 / x y"), "prefix");
    Free(t);
  });

  tf::HiddenTest("right-leaning tree: 2 3 2 ^ ^", [] {
    Node* t = BuildFromPostfix({"2", "3", "2", "^", "^"});
    tf::ExpectEq(ToPrefix(t), string("^ 2 ^ 3 2"), "prefix");
    Free(t);
  });

  tf::HiddenTest("malformed postfix throws runtime_error", [] {
    tf::ExpectTrue(Throws({"3", "+"}), "'3 +' (underflow)");
    tf::ExpectTrue(Throws({"+"}), "'+' (underflow)");
    tf::ExpectTrue(Throws({"3", "5"}), "'3 5' (leftover trees)");
    tf::ExpectTrue(Throws({"3", "5", "+", "2"}), "'3 5 + 2' (leftover trees)");
    tf::ExpectTrue(Throws({}), "empty input");
    tf::ExpectTrue(!Throws({"3", "5", "+"}), "'3 5 +' is valid");
  });
}

}  // namespace q70

REGISTER_QUESTION(70, "Expression trees: BuildFromPostfix()", q70::RunQ70);
