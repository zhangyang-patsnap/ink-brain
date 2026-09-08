import projectData from './projects.json';
export type ProjectStatus = 'concept' | 'building' | 'released' | 'verified';

export interface OwnedProject {
  slug: string;
  name: string;
  type: 'Agent Framework' | 'Application' | 'Library' | 'Other';
  status: ProjectStatus;
  demo: boolean;
  tagline: string;
  summary: string;
  stack: string[];
  capabilities: string[];
  evidence: string[];
  documentation: string;
  repositoryUrl?: string;
  documentationUrl?: string;
  repositoryUrls?: string[];
  documentationUrls?: string[];
  projectUrl?: string;
  related: Array<{ label: string; href: string; domain: 'Writing' | 'Knowledge' | 'Lab' | 'Tool' }>;
}

export const ownedProjects = projectData as OwnedProject[];

export const getOwnedProject = (slug: string) => ownedProjects.find((project) => project.slug === slug);
