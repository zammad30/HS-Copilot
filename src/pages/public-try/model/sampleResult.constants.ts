/**
 * Static example shown to visitors. It is never computed from what they typed:
 * a public classification call would be costly and abusable. Every figure and
 * reference here is placeholder data, so the page labels it as a sample.
 */
export const sampleResult = {
  isSample: true,
  product: "Men's 100% cotton knitted crew-neck T-shirt",
  code: "6109.10",
  confidence: 96,
  reasoning:
    "The product's material, construction, and principal use support classification under this heading. The cited tariff text and similar rulings provide the strongest available basis for review.",
  basis: ["HTS heading 6109", "GRI 1 and 6", "Knitted cotton apparel chapter notes"],
  candidates: [
    { code: "6109.10", title: "Men's 100% cotton knitted crew-neck T-shirt", confidence: 96 },
    {
      code: "6109.90",
      title: "Alternative classification for Men's 100% cotton knitted crew-neck T-shirt",
      confidence: 41,
    },
    {
      code: "6110.20",
      title: "Secondary alternative for Men's 100% cotton knitted crew-neck T-shirt",
      confidence: 18,
    },
  ],
  tariffText: {
    reference: "6109.10",
    excerpt:
      "Knitted cotton apparel described by its material, construction, and principal function under subheading 6109.10.",
  },
  ruling: {
    reference: "HQ 610910-26",
    summary:
      "A materially similar knitted cotton apparel was classified under 6109.10 after review of its essential character and principal use.",
  },
} as const;
