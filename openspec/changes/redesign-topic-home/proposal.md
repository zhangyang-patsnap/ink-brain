## Why

用户选择 E 主题展厅作为专题首页，以区别于文章首页的编辑选读。现有专题首页仍为大间距列表，不能直观展示真实专题的混合内容。

## What Changes

- 用大字展签、交错色块和代表内容替换专题首页旧列表。
- 直接读取后台维护的专题排序、名称、简介及内容顺序，展示有效内容数量和前两项内容。
- 保持文章、项目、工具链接，兼容两套风格、日夜模式、手机和空状态。

## Capabilities

### New Capabilities
- `topic-exhibition-home`: 真实专题驱动的展厅式首页。

### Modified Capabilities
无。

## Impact

仅更改 knowledge/index.astro，新增首页组件、样式与数据整形测试。不改后台 schema、发布流程、专题详情或其他首页。
