export const samples = [
  {
    id: "separate-edits",
    name: "Separate edits (2 conflicts)",
    a: [
      "function greet(name) {",
      '  return "Hello " + name;',
      "}",
      "",
      "function add(a, b) {",
      "  return a + b;",
      "}",
      "",
      "module.exports = { greet, add };"
    ].join("\n"),
    b: [
      "function greet(name) {",
      "  return `Hello, ${name}!`;",
      "}",
      "",
      "function add(a, b) {",
      "  return a + b;",
      "}",
      "",
      "function sub(a, b) {",
      "  return a - b;",
      "}",
      "",
      "module.exports = { greet, add };"
    ].join("\n"),
    expectedRegions: 2
  },
  {
    id: "same-line-conflict",
    name: "Same line changed in both (1 conflict)",
    a: ["const TIMEOUT = 3000;", "const RETRIES = 3;", "const HOST = \"localhost\";"].join("\n"),
    b: ["const TIMEOUT = 3000;", "const RETRIES = 5;", "const HOST = \"localhost\";"].join("\n"),
    expectedRegions: 1
  },
  {
    id: "deleted-vs-modified",
    name: "Deleted in one, modified in the other (1 conflict)",
    a: ["# Settings", "debug = true", "verbose = true", "", "# End"].join("\n"),
    b: ["# Settings", "debug = true", "", "# End"].join("\n"),
    expectedRegions: 1
  }
];

export function getSample(id) {
  return samples.find((sample) => sample.id === id) || null;
}
