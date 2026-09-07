export type FrameworkStatus = 'planned' | 'documented';

export interface FrameworkTrack {
  slug: string;
  name: string;
  language: 'Python' | 'Java' | 'Rust';
  focus: string;
  status: FrameworkStatus;
  position: string;
  concepts: string[];
  experiments: string[];
  runtimeBoundary: string;
  related: string[];
}

export const frameworkTracks: FrameworkTrack[] = [
  {
    slug: 'crewai-python',
    name: 'CrewAI',
    language: 'Python',
    focus: 'Role-based collaboration',
    status: 'planned',
    position: '观察多角色协作、任务委托与 Crew / Flow 边界。',
    concepts: ['Agent', 'Task', 'Crew', 'Flow'],
    experiments: ['顺序与分层协作', '工具授权边界', '失败后的任务恢复'],
    runtimeBoundary: '未来作为独立 Python 进程运行；当前只有清单和协议占位。',
    related: ['knowledge:agent-orchestration'],
  },
  {
    slug: 'pydanticai-python',
    name: 'PydanticAI',
    language: 'Python',
    focus: 'Typed agent contracts',
    status: 'planned',
    position: '研究类型驱动的依赖、输出模型和工具契约。',
    concepts: ['Agent', 'Dependencies', 'Tools', 'Structured output'],
    experiments: ['结构化输出失败', '依赖注入', '类型化工具返回'],
    runtimeBoundary: '未来作为独立 Python 进程运行；网页不会导入其实现。',
    related: ['knowledge:typed-contracts', 'article:typed-agent-contracts'],
  },
  {
    slug: 'langgraph-python',
    name: 'LangGraph',
    language: 'Python',
    focus: 'Stateful graph execution',
    status: 'planned',
    position: '理解显式状态图、检查点和可恢复执行。',
    concepts: ['StateGraph', 'Node', 'Edge', 'Checkpoint'],
    experiments: ['条件分支', '中断与恢复', '状态持久化边界'],
    runtimeBoundary: '未来 Lab 只通过统一运行协议向网页提供状态。',
    related: ['knowledge:agent-orchestration', 'knowledge:retrieval-memory'],
  },
  {
    slug: 'spring-ai-java',
    name: 'Spring AI',
    language: 'Java',
    focus: 'Enterprise integration',
    status: 'documented',
    position: '连接企业 Java 应用与模型、向量存储和工具调用。',
    concepts: ['ChatClient', 'Advisor', 'Tool calling', 'Vector store'],
    experiments: ['应用边界集成', '可观测性', '模型提供方替换'],
    runtimeBoundary: '协议边界已记录；尚未提供可验证启动命令。',
    related: ['knowledge:runtime-observability'],
  },
  {
    slug: 'agent-runtime-rust',
    name: 'Agent Runtime',
    language: 'Rust',
    focus: 'Runtime and event semantics',
    status: 'planned',
    position: '探索低层运行控制、事件协议与性能边界。',
    concepts: ['Run state', 'Cancellation', 'SSE', 'Resource ownership'],
    experiments: ['终态事件', '背压', '取消传播'],
    runtimeBoundary: '当前仅有设计清单，不存在可运行 Runtime。',
    related: ['knowledge:runtime-observability', 'article:rust-runtime-boundaries'],
  },
];

export const getFramework = (slug: string) =>
  frameworkTracks.find((framework) => framework.slug === slug);
