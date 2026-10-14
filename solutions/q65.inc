int MinLookupsToSortFirst(int N) {
  int lg = 0;
  while ((1 << lg) < N) ++lg;
  const long long per_lookup_saving = (long long)N - (1 + lg);
  if (per_lookup_saving <= 0) return -1;
  const long long sort_cost = (long long)N * lg;
  return (int)(sort_cost / per_lookup_saving) + 1;
}
