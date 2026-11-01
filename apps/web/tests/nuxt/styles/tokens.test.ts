import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, "../../../app");
const tokensPath = path.join(appDir, "assets/css/tokens.css");
const tokensSource = readFileSync(tokensPath, "utf8");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);

    return entry.isDirectory() ? walk(full) : [full];
  });
}

function styleBlocks(source: string): string {
  return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => match[1] ?? "")
    .join("\n");
}

function styleSource(file: string): string {
  const source = readFileSync(file, "utf8");

  return file.endsWith(".vue") ? styleBlocks(source) : source;
}

function definedTokens(css: string): Set<string> {
  return new Set(
    [...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1] ?? ""),
  );
}

function tokenReferences(
  source: string,
): Array<{ token: string; line: number }> {
  return source.split(/\r?\n/).flatMap((line, index) =>
    [...line.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => ({
      token: match[1] ?? "",
      line: index + 1,
    })),
  );
}

type PaletteName =
  | "paper"
  | "sheet"
  | "ink"
  | "graphite"
  | "muted"
  | "rule-strong"
  | "seal"
  | "seal-deep";

function readPalette(css: string): Record<PaletteName, string> {
  const names: PaletteName[] = [
    "paper",
    "sheet",
    "ink",
    "graphite",
    "muted",
    "rule-strong",
    "seal",
    "seal-deep",
  ];
  const palette = {} as Record<PaletteName, string>;

  for (const name of names) {
    const match = css.match(
      new RegExp(`--palette-${name}:\\s*(#[0-9a-f]{6})`, "i"),
    );

    if (!match?.[1]) {
      throw new Error(`Missing --palette-${name} in tokens.css`);
    }

    palette[name] = match[1];
  }

  return palette;
}

function channel(value: number): number {
  const normalized = value / 255;

  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return (
    0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
  );
}

function contrast(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);
  const light = Math.max(first, second);
  const dark = Math.min(first, second);

  return (light + 0.05) / (dark + 0.05);
}

const appFiles = walk(appDir);
const vueFiles = appFiles.filter((file) => file.endsWith(".vue"));
const cssFiles = appFiles.filter(
  (file) => file.endsWith(".css") && file !== tokensPath,
);

describe("student web design tokens", () => {
  it("defines every custom property referenced by app styles", () => {
    const defined = definedTokens(tokensSource);
    const missing: string[] = [];

    for (const file of [...vueFiles, ...cssFiles]) {
      for (const reference of tokenReferences(styleSource(file))) {
        if (!defined.has(reference.token)) {
          missing.push(
            `${path.relative(appDir, file)}:${reference.line} uses ${reference.token}`,
          );
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it("detects an undefined token in a synthetic source", () => {
    const defined = definedTokens(tokensSource);
    const references = tokenReferences("color: var(--missing-token);");

    expect(references.some((reference) => !defined.has(reference.token))).toBe(
      true,
    );
  });

  it("keeps raw colors inside tokens.css", () => {
    const rawColor = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i;
    const offenders: string[] = [];

    for (const file of [...vueFiles, ...cssFiles]) {
      styleSource(file)
        .split(/\r?\n/)
        .forEach((line, index) => {
          if (rawColor.test(line)) {
            offenders.push(
              `${path.relative(appDir, file)}:${index + 1} ${line.trim()}`,
            );
          }
        });
    }

    expect(offenders).toEqual([]);
  });

  it("meets contrast thresholds for paper, ink and status roles", () => {
    const palette = readPalette(tokensSource);
    const pairs: Array<[string, string, string, number]> = [
      ["ink on paper", palette.ink, palette.paper, 4.5],
      ["ink on sheet", palette.ink, palette.sheet, 4.5],
      ["graphite on paper", palette.graphite, palette.paper, 4.5],
      ["muted on paper", palette.muted, palette.paper, 4.5],
      ["seal on paper", palette.seal, palette.paper, 4.5],
      ["seal-deep on paper", palette["seal-deep"], palette.paper, 4.5],
      ["interactive border on sheet", palette["rule-strong"], palette.sheet, 3],
      ["sheet on ink", palette.sheet, palette.ink, 4.5],
      ["focus ink on paper", palette.ink, palette.paper, 3],
    ];

    for (const [label, foreground, background, minimum] of pairs) {
      const ratio = contrast(foreground, background);

      console.log(`${label}: ${ratio.toFixed(2)}:1`);
      expect(ratio, label).toBeGreaterThanOrEqual(minimum);
    }
  });

  it("keeps the dark theme readable", () => {
    const block = tokensSource.match(
      /:root\[data-theme="dark"\]\s*\{([\s\S]*?)\}/,
    )?.[1];

    expect(block).toBeDefined();

    const palette = readPalette(block ?? "");
    const pairs: Array<[string, string, string, number]> = [
      ["ink on paper", palette.ink, palette.paper, 4.5],
      ["graphite on paper", palette.graphite, palette.paper, 4.5],
      ["muted on paper", palette.muted, palette.paper, 4.5],
      ["seal on paper", palette.seal, palette.paper, 4.5],
      ["seal-deep on paper", palette["seal-deep"], palette.paper, 4.5],
      ["interactive border on sheet", palette["rule-strong"], palette.sheet, 3],
    ];

    for (const [label, foreground, background, minimum] of pairs) {
      const ratio = contrast(foreground, background);

      console.log(`dark ${label}: ${ratio.toFixed(2)}:1`);
      expect(ratio, `dark ${label}`).toBeGreaterThanOrEqual(minimum);
    }
  });
});
