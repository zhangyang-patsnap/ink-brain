import toolData from './tools.json';
export type ToolKind = 'macos-app' | 'cli' | 'plugin' | 'web-tool';
export type ToolAvailability = 'demo' | 'available' | 'retired';

export interface SoftwareTool {
  slug: string;
  name: string;
  monogram: string;
  kind: ToolKind;
  platform: string;
  availability: ToolAvailability;
  summary: string;
  description: string;
  features: string[];
  screenshots?: Array<{ src: string; alt: string }>;
  release: {
    version: string;
    packageFormat: string;
    fileSize: string;
    requirements: string;
    releasedAt: string;
    checksum: string;
    notes: string[];
    downloadUrl?: string;
  };
  relatedProject?: string;
}

export const toolKindLabels: Record<ToolKind, string> = {
  'macos-app': 'macOS App',
  cli: 'CLI',
  plugin: '插件',
  'web-tool': '在线工具',
};

export const softwareTools = toolData as SoftwareTool[];

export const getSoftwareTool = (slug: string) => softwareTools.find((tool) => tool.slug === slug);
