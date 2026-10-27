import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRestrictions, blankNonCode, checkRestrictions } from '../shared/restrictions.js';

const rules = (restrict, code) => checkRestrictions(restrict, code).map((v) => v.rule);

test('parseRestrictions reads a comma list and rejects unknown words', () => {
  assert.deepEqual(parseRestrictions('no-loops, recursive'), ['no-loops', 'recursive']);
  assert.throws(() => parseRestrictions('no-loops, fast'), /unknown restriction "fast"/);
});

test('comments and string literals are blanked, newlines kept', () => {
  const out = blankNonCode('int a; // for\n/* while\n */ cout << "do for" << \'"\';');
  assert.equal(out.split('\n').length, 3);
  assert.ok(!/for|while|do/.test(out));
  assert.ok(out.includes('cout'));
});

test('no-loops finds for, while and do, but not words that merely contain them', () => {
  assert.deepEqual(rules(['no-loops'], 'int F(int n) { return n ? F(n - 1) : 0; }'), []);
  assert.deepEqual(rules(['no-loops'], 'int F(int n) { for (int i = 0; i < n; ++i) {} return 0; }'), ['no-loops']);
  assert.deepEqual(rules(['no-loops'], 'void F() { while (true) break; }'), ['no-loops']);
  assert.deepEqual(rules(['no-loops'], 'void F() { do { } while (false); }'), ['no-loops']);
  assert.deepEqual(rules(['no-loops'], 'int before = 0, forward = 1, doing = 2; // for while'), []);
  const hit = checkRestrictions(['no-loops'], 'int F() {\n  for (;;) {}\n}')[0];
  assert.equal(hit.line, 2);
  assert.match(hit.message, /line 2/);
});

test('recursive wants a function that calls itself', () => {
  const rec = 'int Gcd(int a, int b) {\n  if (b == 0) return a;\n  return Gcd(b, a % b);\n}';
  const loop = 'int Gcd(int a, int b) {\n  while (b) { int t = b; b = a % b; a = t; }\n  return a;\n}';
  assert.deepEqual(rules(['recursive'], rec), []);
  assert.deepEqual(rules(['recursive'], loop), ['recursive']);
  assert.deepEqual(rules(['recursive'], ''), ['recursive']);
  // a mention in a comment, or a call to another function, is not recursion
  assert.deepEqual(rules(['recursive'], 'int F(int n) { // F(n - 1)\n  return G(n);\n}\nint G(int n) { return n; }'), ['recursive']);
});

test('recursion through a member function or a helper is found', () => {
  const member = 'int Tree::Height(Node* n) const {\n  if (n == nullptr) return 0;\n  return 1 + max(Height(n->left), Height(n->right));\n}';
  assert.deepEqual(rules(['recursive'], member), []);
  const method = 'void List::Print(Node* n) const noexcept {\n  if (n) { cout << n->data; n->next->Print(n->next); }\n}';
  assert.deepEqual(rules(['recursive'], method), []);
  // the public function only forwards; the helper recurses
  const forwards = 'void T::Insert(int v) { root = InsertAt(root, v); }\nNode* T::InsertAt(Node* n, int v) {\n  if (!n) return new Node(v);\n  n->left = InsertAt(n->left, v);\n  return n;\n}';
  assert.deepEqual(rules(['recursive'], forwards), []);
});

test('no-recursion fails an answer whose function calls itself, and names it', () => {
  const iter = 'int T::FindMin() const {\n  Node* c = root;\n  while (c->left) c = c->left;\n  return c->data;\n}';
  assert.deepEqual(rules(['no-recursion'], iter), []);
  const rec = 'int FindMin(Node* n) {\n  return n->left ? FindMin(n->left) : n->data;\n}';
  const hit = checkRestrictions(['no-recursion'], rec)[0];
  assert.equal(hit.rule, 'no-recursion');
  assert.match(hit.message, /FindMin\(\) calls itself/);
});

test('control keywords are not mistaken for function definitions', () => {
  assert.deepEqual(rules(['recursive'], 'int F(int n) { if (n) { return 1; } return 0; }'), ['recursive']);
});

test('no restrictions means no violations', () => {
  assert.deepEqual(checkRestrictions([], 'for (;;) {}'), []);
  assert.deepEqual(checkRestrictions(undefined, 'for (;;) {}'), []);
});
