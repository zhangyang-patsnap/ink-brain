---
title: 用类型约束 Agent 与工具的协作
summary: 让工具输入、模型输出和失败反馈都成为可检查的工程契约。
publishedAt: 2026-08-04
topic: Agent Engineering
maturity: implemented
related:
  - knowledge:agent-orchestration
  - knowledge:typed-contracts
  - framework:pydanticai-python
readingMinutes: 10
demo: true
---

> 本文为 Demo 内容，`implemented` 仅用于展示状态样式，不代表真实项目证据。

自然语言适合表达意图，但不适合独自承担系统边界。把关键交换转换成结构化类型，可以更早发现缺失字段、非法状态和不兼容变更。

## 类型保护什么

类型适合保护数据形状和状态范围；授权、安全策略与事实正确性仍需要独立校验。

## 失败也要结构化

不要只返回一段错误字符串。错误应至少说明发生阶段、是否可重试、原始输入是否保留，以及调用方下一步能做什么。
