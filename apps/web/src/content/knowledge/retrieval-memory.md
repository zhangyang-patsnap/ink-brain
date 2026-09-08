---
title: 检索与记忆：管理上下文
summary: 区分检索、会话上下文和长期记忆在 AI 应用中的责任。
order: 40
topic: Knowledge Systems
thesis: 检索、会话状态与长期记忆需要不同的生命周期、权限和评估标准。
concepts:
  - Retrieval scope
  - Session context
  - Durable memory
learningPath:
  - title: 拆分记忆类型
    description: 先判断数据是检索语料、运行状态还是长期事实。
  - title: 再定义权限
    description: 明确写入、读取、删除和评估每类记忆的责任者。
references:
  articles: []
  labs:
    - langgraph-python
  projects: []
  tools: []
  adjacent:
    - typed-contracts
maturity: idea
related:
  - knowledge:typed-contracts
  - framework:langgraph-python
demo: true
---

“记忆”不是一种单一存储。检索语料、短期状态和长期用户事实应采用不同生命周期、权限和评估标准。
