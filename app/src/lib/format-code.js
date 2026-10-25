// Real clang-format, compiled to WebAssembly (about 2.5 MB), downloaded the first time you
// format. The repo's own VS Code setup falls back to Google style, so that is what this uses.
let ready = null;
let mod = null;

export async function formatCpp(code) {
  if (!mod) mod = await import('@wasm-fmt/clang-format/vite');
  if (!ready) ready = mod.default();
  await ready;
  return mod.format(code, 'answer.cpp', 'Google');
}
