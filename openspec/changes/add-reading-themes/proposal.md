## Why

游客需要在保留当前纸感风格的同时，选择更紧凑的阅读工作台。风格选择应简单，并与日夜模式相互独立。

## What Changes

- 将当前默认风格命名为「纸上」，新增「阅读工作台」。
- 游客页右上角增加图标切换，保留独立的日夜切换。
- 记住风格选择，在首次绘制前恢复；存储不可用时仍可切换。
- 工作台统一游客页配色与字体，文章采用白色面板和右侧目录，适配手机与深色。

## Capabilities

### New Capabilities
- `visitor-reading-themes`: 游客页面的双风格选择、持久化与响应式阅读体验。

### Modified Capabilities
无。

## Impact

修改游客 BaseLayout、SiteHeader，新增主题 CSS 和主题控制脚本。不修改内容、后台和发布流程，不引入依赖。
