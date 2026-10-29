import { Button, ConfigProvider, theme, type ButtonProps } from "antd";
import { forwardRef, type ComponentRef } from "react";

/**
 * 顶栏固定在深色 Header 上，按钮局部使用暗色算法渲染，
 * 使虚线按钮在亮色和暗色模式下都能保持对比度。
 */
const HeaderButton = forwardRef<ComponentRef<typeof Button>, ButtonProps>(
  ({ type = "dashed", ...props }, ref) => (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <Button ref={ref} type={type} {...props} />
    </ConfigProvider>
  ),
);

HeaderButton.displayName = "HeaderButton";

export default HeaderButton;
