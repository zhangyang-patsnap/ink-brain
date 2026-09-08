---
title: 运行可观测性：理解一次执行
summary: 用事件、日志、Trace 与失败分类回答一次运行究竟发生了什么。
order: 30
topic: Runtime Evidence
thesis: 可观测性的目标是重建关键事实，而不是最大化日志数量。
concepts:
  - Terminal events
  - Trace continuity
  - Failure classification
learningPath:
  - title: 从问题出发
    description: 先定义一次运行需要回答的关键问题，再选择日志、指标或 Trace。
  - title: 保留证据链
    description: 让请求、阶段、工具调用和终态通过稳定标识连接。
references:
  articles:
    - designing-verifiable-ai-systems
  labs:
    - agent-runtime-rust
  projects:
    - atlas-agent-framework
  tools:
    - trace-deck
  adjacent:
    - agent-orchestration
maturity: verified
related:
  - knowledge:agent-orchestration
  - article:designing-verifiable-ai-systems
demo: true
---

可观测性不是日志数量，而是能否重建关键事实：输入经过哪些阶段、哪一步失败、终态由什么证据确认。
