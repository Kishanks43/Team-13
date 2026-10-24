/**
 * Built-in sample scenarios. Each one gives a pair of versions (a, b) of the same small file,
 * a description, and how many separate regions of difference the two versions have.
 */

const base = {
  formatPrice: [
    "function formatPrice(amount, currency) {",
    "  const rounded = Math.round(amount * 100) / 100;",
    '  return currency + " " + rounded.toFixed(2);',
    "}",
  ],
  applyDiscount: [
    "function applyDiscount(price, percent) {",
    "  if (percent < 0 || percent > 100) {",
    '    throw new Error("Invalid discount");',
    "  }",
    "  return price - (price * percent) / 100;",
    "}",
  ],
  checkout: [
    "function checkout(cart) {",
    "  let total = 0;",
    "  for (const item of cart) {",
    "    total += item.price * item.quantity;",
    "  }",
    "  return total;",
    "}",
  ],
};

const join = (...blocks) => blocks.map((block) => block.join("\n")).join("\n\n") + "\n";

export const samples = [
  {
    id: "separate-edits",
    name: "Separate edits",
    description: "Each version changed a different part of the file, so both changes could be kept.",
    expectedRegions: 2,
    a: join(
      [
        "function formatPrice(amount, currency = \"INR\") {",
        "  const rounded = Math.round(amount * 100) / 100;",
        '  return currency + " " + rounded.toFixed(2);',
        "}",
      ],
      base.applyDiscount,
      base.checkout
    ),
    b: join(base.formatPrice, base.applyDiscount, [
      "function checkout(cart) {",
      "  let total = 0;",
      "  for (const item of cart) {",
      "    total += item.price * item.quantity * (1 - (item.discount || 0));",
      "  }",
      "  return total;",
      "}",
    ]),
  },
  {
    id: "same-line-conflict",
    name: "Same-line conflict",
    description: "Both versions rewrote the same line in different ways, so you have to choose one or combine them.",
    expectedRegions: 1,
    a: join(
      base.formatPrice,
      [
        "function applyDiscount(price, percent) {",
        "  if (percent < 0 || percent > 100) {",
        '    throw new RangeError("Discount must be between 0 and 100");',
        "  }",
        "  return price - (price * percent) / 100;",
        "}",
      ],
      base.checkout
    ),
    b: join(
      base.formatPrice,
      [
        "function applyDiscount(price, percent) {",
        "  if (percent < 0 || percent > 100) {",
        '    throw new Error("Discount out of range: " + percent);',
        "  }",
        "  return price - (price * percent) / 100;",
        "}",
      ],
      base.checkout
    ),
  },
  {
    id: "deleted-vs-modified",
    name: "Deleted vs modified block",
    description: "One version deleted the validation block while the other changed it, so the two cannot both be kept as they are.",
    expectedRegions: 1,
    a: join(
      base.formatPrice,
      ["function applyDiscount(price, percent) {", "  return price - (price * percent) / 100;", "}"],
      base.checkout
    ),
    b: join(
      base.formatPrice,
      [
        "function applyDiscount(price, percent) {",
        "  if (percent <= 0 || percent >= 100) {",
        '    throw new Error("Invalid discount");',
        "  }",
        "  return price - (price * percent) / 100;",
        "}",
      ],
      base.checkout
    ),
  },
];

/** Find a sample by its id, or undefined if there is none. */
export function getSample(id) {
  return samples.find((sample) => sample.id === id);
}
