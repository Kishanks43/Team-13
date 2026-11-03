// Small deterministic random generator so property-style tests are repeatable.
export function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}
