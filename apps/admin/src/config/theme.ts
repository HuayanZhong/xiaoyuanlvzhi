/**
 * Ant Design theme bridge.
 *
 * Only the brand seed is configured; antd's default and dark algorithms
 * derive component surfaces, borders and contrast from it.
 */
export const adminTheme = {
  token: {
    colorPrimary: "#1f7a4d",
  },
} as const;

/** 品牌强调色；antd seed 中没有对应角色，由 ThemeTokenBridge 直接输出。 */
export const adminAccent = "#b7791f";
