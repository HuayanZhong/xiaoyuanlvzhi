import { render } from "@testing-library/react";
import { ConfigProvider, theme } from "antd";
import { afterEach, describe, expect, it } from "vitest";
import ThemeTokenBridge from "../../../src/components/ThemeTokenBridge";

const variables = [
  "--app-color-canvas",
  "--app-color-surface",
  "--app-color-ink",
  "--app-color-line",
  "--app-color-muted",
  "--app-color-primary",
  "--app-color-accent",
];

function readVariables() {
  return Object.fromEntries(
    variables.map((name) => [
      name,
      document.documentElement.style.getPropertyValue(name),
    ]),
  );
}

afterEach(() => {
  for (const name of variables) {
    document.documentElement.style.removeProperty(name);
  }
});

describe("ThemeTokenBridge", () => {
  it("exposes light antd tokens as root CSS variables", () => {
    render(
      <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
        <ThemeTokenBridge />
      </ConfigProvider>,
    );

    expect(readVariables()).toMatchObject({
      "--app-color-canvas": "#f5f5f5",
      "--app-color-surface": "#ffffff",
      "--app-color-line": "#f0f0f0",
      "--app-color-accent": "#b7791f",
    });
  });

  it("follows the dark algorithm", () => {
    render(
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <ThemeTokenBridge />
      </ConfigProvider>,
    );

    expect(readVariables()).toMatchObject({
      "--app-color-canvas": "#000000",
      "--app-color-surface": "#141414",
      "--app-color-line": "#303030",
    });
  });
});
